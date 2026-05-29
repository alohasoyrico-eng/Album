#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MET = "https://collectionapi.metmuseum.org/public/collection/v1";

const SEARCH_TERMS = {
  "melancolía":   ["melancholy", "twilight"],
  "soledad":      ["solitary", "alone"],
  "tristeza":     ["mourning", "grief"],
  "nostalgia":    ["family"],
  "amor":         ["lovers", "embrace"],
  "ternura":      ["mother", "child"],
  "miedo":        ["war", "casualty"],
  "ansiedad":     ["protest"],
  "horror":       ["destruction"],
  "ira":          ["fight"],
  "compasión":    ["refugee", "homeless"],
  "esperanza":    ["dawn"],
  "alegría":      ["children"],
  "serenidad":    ["landscape"],
  "trascendencia":["spiritual"],
  "admiración":   ["portrait"],
  "sublimidad":   ["sky", "mountain"],
  "curiosidad":   ["street"],
  "pasmo":        ["unusual"],
  "vergüenza":    ["nude"],
  "asco":         ["wound"],
  "júbilo":       ["festival"],
  "humor":        ["satire"],
  "orgullo":      ["uniform"],
  "fobia":        ["dread"],
};

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function fetchJson(url, attempt = 0) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        await sleep(1500 * (attempt + 1));
        return fetchJson(url, attempt + 1);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (attempt < 2) { await sleep(700); return fetchJson(url, attempt + 1); }
    throw err;
  }
}
async function searchMet(term) {
  const url = `${MET}/search?hasImages=true&isPublicDomain=true&medium=Photographs&q=${encodeURIComponent(term)}`;
  return (await fetchJson(url)).objectIDs ?? [];
}
async function fetchObject(id) { return fetchJson(`${MET}/objects/${id}`); }

async function loadEmotions() {
  const text = await fs.readFile(path.join(ROOT, "src/data/ontology/emotions.ts"), "utf8");
  const records = [];
  const blockRe = /\{\s*\n\s*id:\s*"([^"]+)",[\s\S]*?resonance:\s*\{\s*([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    const id = m[1];
    const axes = {};
    for (const pair of m[2].split(",")) {
      const kv = pair.split(":");
      if (kv.length !== 2) continue;
      const v = parseInt(kv[1].trim(), 10);
      if (!Number.isNaN(v)) axes[kv[0].trim()] = v;
    }
    if (Object.keys(axes).length === 10) records.push({ id, resonance: axes });
  }
  return records;
}

function averageResonance(items) {
  const base = { energy: 0, temperature: 0, tension: 0, density: 0, movement: 0, temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0 };
  if (items.length === 0) return base;
  for (const it of items) for (const k of Object.keys(base)) base[k] += it.resonance[k];
  for (const k of Object.keys(base)) base[k] = Math.round(base[k] / items.length);
  return base;
}

function buildPhoto(obj, matched) {
  return {
    id: `met-photo-${obj.objectID}`,
    title: obj.title || "Untitled",
    photographer: obj.artistDisplayName || "Anonymous",
    year: String(obj.objectDate || ""),
    culture: obj.culture || obj.artistNationality || "—",
    imageUrl: obj.primaryImageSmall || obj.primaryImage,
    sourceUrl: obj.objectURL,
    emotionResonance: matched.map((e) => e.id),
    colorResonance: [],
    atmosphereTags: (obj.tags ?? []).map((t) => t.term?.toLowerCase()).filter(Boolean).slice(0, 5),
    resonance: averageResonance(matched),
    description: obj.creditLine || "",
    poeticDescription: obj.title || "",
  };
}

async function main() {
  const emotions = await loadEmotions();
  const emotionById = new Map(emotions.map((e) => [e.id, e]));
  const seen = new Set();
  const collected = [];
  for (const [eid, terms] of Object.entries(SEARCH_TERMS)) {
    const emotion = emotionById.get(eid);
    if (!emotion) continue;
    const candidates = new Set();
    for (const t of terms) {
      try { for (const id of (await searchMet(t)).slice(0, 20)) candidates.add(id); }
      catch (err) { console.warn(`"${t}" failed:`, err.message); }
      await sleep(120);
    }
    let added = 0;
    for (const id of candidates) {
      if (added >= 4) break;
      if (seen.has(id)) continue;
      try {
        const obj = await fetchObject(id);
        if (!(obj.primaryImageSmall || obj.primaryImage)) continue;
        if (!obj.isPublicDomain) continue;
        if (!obj.title) continue;
        const haystack = `${obj.title?.toLowerCase() ?? ""} ${(obj.tags ?? []).map((t) => t.term?.toLowerCase()).join(" ")}`;
        const matched = [];
        for (const [eid2, ts] of Object.entries(SEARCH_TERMS)) {
          if (!emotionById.has(eid2)) continue;
          if (ts.some((t) => haystack.includes(t.toLowerCase()))) matched.push(emotionById.get(eid2));
        }
        if (matched.length === 0) matched.push(emotion);
        collected.push(buildPhoto(obj, matched));
        seen.add(id);
        added++;
      } catch (err) { /* skip */ }
      await sleep(120);
    }
    console.log(`[${eid}] +${added} (total ${collected.length})`);
  }

  const outPath = path.join(ROOT, "src/data/seed/photography-met.ts");
  const body = `import type { Photography } from "@/types";

/**
 * Photographs ingested from the Metropolitan Museum of Art Open Access API.
 * Each photo's ResonanceAxes derives from emotion-keyword matching on its tags.
 * Generated by scripts/ingest-met-photo.mjs.
 *
 * Total: ${collected.length} photographs.
 */
export const PHOTOGRAPHS_MET: Photography[] = ${JSON.stringify(collected, null, 2)};
`;
  await fs.writeFile(outPath, body, "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
