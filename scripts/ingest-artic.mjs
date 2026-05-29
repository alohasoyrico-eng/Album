#!/usr/bin/env node
/**
 * Ingest artworks from the Art Institute of Chicago Open Access API.
 *
 * Mirror of ingest-met.mjs: search by emotion-keyword, fetch top hits,
 * vectorize by aggregating the resonances of matched catalogue emotions.
 * ARTIC has cleaner term taxonomy than Met (term_titles[]) so the keyword
 * matching is more reliable here.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const ARTIC_BASE = "https://api.artic.edu/api/v1";
const IIIF_BASE  = "https://www.artic.edu/iiif/2";

const SEARCH_TERMS = {
  "melancolía":    ["melancholy", "twilight", "ruins"],
  "tristeza":      ["mourning", "grief", "lamentation"],
  "soledad":       ["solitary", "interior", "abandoned"],
  "nostalgia":     ["memory", "homeland", "old"],
  "esperanza":     ["dawn", "spring", "blossom"],
  "alegría":       ["dance", "celebration", "joy"],
  "amor":          ["lovers", "courtship", "embrace"],
  "ternura":       ["mother", "child", "cradle"],
  "pasión":        ["passion", "kiss"],
  "anhelo":        ["longing", "distant"],
  "miedo":         ["nightmare", "darkness", "fear"],
  "ansiedad":      ["anguish", "anxiety"],
  "horror":        ["hell", "torment"],
  "ira":           ["battle", "wrath"],
  "vergüenza":     ["shame", "fall"],
  "culpa":         ["confession", "penitence"],
  "admiración":    ["adoration", "reverence", "worship"],
  "sublimidad":    ["sublime", "landscape", "mountain", "ocean"],
  "éxtasis":       ["ecstasy", "rapture", "vision"],
  "curiosidad":    ["allegory", "still life", "studio"],
  "trascendencia": ["ascension", "transfiguration"],
  "gratitud":      ["thanksgiving", "blessing", "harvest"],
  "compasión":     ["pieta", "good samaritan", "charity"],
  "serenidad":     ["meditation", "calm", "still"],
  "júbilo":        ["triumph", "victory"],
  "resignación":   ["burden"],
  "asco":          ["temptation", "vice"],
  "orgullo":       ["throne", "monarch"],
  "humor":         ["caricature", "comic"],
};

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url, attempt = 0) {
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Album-prototype/1.0 contact@album.example" },
    });
    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(1200 * (attempt + 1));
        return fetchJson(url, attempt + 1);
      }
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.json();
  } catch (err) {
    if (attempt < 2) {
      await sleep(700);
      return fetchJson(url, attempt + 1);
    }
    throw err;
  }
}

async function searchArtic(term) {
  const fields = "id,title,artist_display,date_display,medium_display,classification_title,term_titles,image_id,is_public_domain";
  const url = `${ARTIC_BASE}/artworks/search?q=${encodeURIComponent(term)}&limit=10&fields=${fields}`;
  const data = await fetchJson(url);
  return (data.data ?? []).filter((d) => d.image_id && d.is_public_domain !== false);
}

async function loadEmotions() {
  const text = await fs.readFile(path.join(ROOT, "src/data/ontology/emotions.ts"), "utf8");
  const records = [];
  const blockRe = /\{\s*\n\s*id:\s*"([^"]+)",[\s\S]*?resonance:\s*\{\s*([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    const id = m[1];
    const axesText = m[2];
    const axes = {};
    for (const pair of axesText.split(",")) {
      const kv = pair.split(":");
      if (kv.length !== 2) continue;
      const k = kv[0].trim();
      const v = parseInt(kv[1].trim(), 10);
      if (k && !Number.isNaN(v)) axes[k] = v;
    }
    if (Object.keys(axes).length === 10) records.push({ id, resonance: axes });
  }
  return records;
}

function averageResonance(items) {
  const base = { energy: 0, temperature: 0, tension: 0, density: 0, movement: 0, temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0 };
  if (items.length === 0) return base;
  for (const it of items) for (const k of Object.keys(base)) base[k] += it.resonance[k];
  const n = items.length;
  for (const k of Object.keys(base)) base[k] = Math.round(base[k] / n);
  return base;
}

function buildArtwork(obj, emotionsMatched) {
  const resonance = averageResonance(emotionsMatched);
  return {
    id: `artic-${obj.id}`,
    title: obj.title || "Untitled",
    artist: obj.artist_display ? obj.artist_display.split(/\n|, /)[0] : "Anonymous",
    year: obj.date_display || "",
    medium: obj.medium_display || "Painting",
    culture: "—",
    style: obj.classification_title || "Painting",
    description: "",
    imageUrl: `${IIIF_BASE}/${obj.image_id}/full/843,/0/default.jpg`,
    source: "artic",
    sourceId: String(obj.id),
    sourceUrl: `https://www.artic.edu/artworks/${obj.id}`,
    dominantColors: ["#7A6A5A","#3A3A48","#C8B080","#1A1A24"],
    emotionResonance: emotionsMatched.map((e) => e.id),
    colorResonance: [],
    atmosphereTags: (obj.term_titles ?? []).slice(0, 5),
    resonance,
    poeticDescription: obj.title ? `${obj.title}.` : "",
  };
}

async function main() {
  const emotions = await loadEmotions();
  const emotionById = new Map(emotions.map((e) => [e.id, e]));
  console.log(`Loaded ${emotions.length} catalogue emotions`);

  const perEmotionLimit = 4;
  const seen = new Set();
  const collected = [];
  let totalCalls = 0;

  for (const [emotionId, terms] of Object.entries(SEARCH_TERMS)) {
    const emotion = emotionById.get(emotionId);
    if (!emotion) continue;

    let added = 0;
    for (const term of terms) {
      if (added >= perEmotionLimit) break;
      try {
        const hits = await searchArtic(term);
        totalCalls++;
        for (const obj of hits) {
          if (added >= perEmotionLimit) break;
          if (seen.has(obj.id)) continue;
          // Match other emotions via term_titles
          const terms_lower = (obj.term_titles ?? []).map((t) => t.toLowerCase()).join(" ");
          const haystack = `${obj.title?.toLowerCase() ?? ""} ${terms_lower} ${obj.medium_display?.toLowerCase() ?? ""}`;
          const matched = [];
          for (const [eid, ts] of Object.entries(SEARCH_TERMS)) {
            if (!emotionById.has(eid)) continue;
            if (ts.some((t) => haystack.includes(t.toLowerCase()))) matched.push(emotionById.get(eid));
          }
          if (matched.length === 0) matched.push(emotion);
          collected.push(buildArtwork(obj, matched));
          seen.add(obj.id);
          added++;
        }
      } catch (err) {
        console.warn(`Search "${term}" failed:`, err.message);
      }
      await sleep(160);
    }
    console.log(`[${emotionId}] +${added} (total ${collected.length})`);
  }
  console.log(`\nIngested ${collected.length} ARTIC works via ${totalCalls} calls`);

  const outPath = path.join(ROOT, "src/data/seed/artworks-artic.ts");
  const body =
`import type { Artwork } from "@/types";

/**
 * Artworks ingested from the Art Institute of Chicago Open Access API.
 * Generated by scripts/ingest-artic.mjs.
 * Each work's ResonanceAxes derives from the catalogue emotions whose
 * keywords matched its term_titles.
 *
 * Total: ${collected.length} works.
 */
export const ARTWORKS_ARTIC: Artwork[] = ${JSON.stringify(collected, null, 2)};
`;
  await fs.writeFile(outPath, body, "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
