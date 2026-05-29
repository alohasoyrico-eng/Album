#!/usr/bin/env node
/**
 * Ingest sculptures from the Met. Uses the same vectorize-by-emotion-keyword
 * pattern as ingest-met.mjs but restricts to Sculpture classification.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MET = "https://collectionapi.metmuseum.org/public/collection/v1";

const SEARCH_TERMS = {
  "melancolía": ["pieta", "mourning"],
  "tristeza":   ["lament", "weeping"],
  "soledad":    ["solitary figure"],
  "amor":       ["embrace", "lovers"],
  "ternura":    ["mother and child"],
  "ira":        ["warrior", "battle"],
  "miedo":      ["serpent", "monster"],
  "admiración": ["angel"],
  "sublimidad": ["god", "deity"],
  "trascendencia": ["buddha", "ascension"],
  "compasión":  ["bodhisattva", "saint"],
  "serenidad":  ["meditation", "seated"],
  "júbilo":     ["triumph"],
  "orgullo":    ["emperor", "ruler"],
  "horror":     ["gorgon", "medusa"],
  "vergüenza":  ["nude"],
  "pasión":     ["dance"],
  "anhelo":     ["reaching"],
  "resignación":["bowed"],
  "asco":       ["grotesque"],
  "esperanza":  ["seraph"],
  "alegría":    ["cherub"],
  "humor":      ["satyr"],
  "soberbia":   ["throne"],
  "fobia":      ["demon"],
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
  const url = `${MET}/search?hasImages=true&isPublicDomain=true&medium=Sculpture&q=${encodeURIComponent(term)}`;
  const data = await fetchJson(url);
  return data.objectIDs ?? [];
}
async function fetchObject(id) { return fetchJson(`${MET}/objects/${id}`); }

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
  for (const k of Object.keys(base)) base[k] = Math.round(base[k] / items.length);
  return base;
}

function buildSculpture(obj, emotionsMatched) {
  return {
    id: `met-sculpt-${obj.objectID}`,
    title: obj.title || "Untitled",
    artist: obj.artistDisplayName || "Anonymous",
    year: String(obj.objectDate || ""),
    medium: obj.medium || "Sculpture",
    culture: obj.culture || obj.artistNationality || "—",
    location: "The Metropolitan Museum of Art, New York",
    imageUrl: obj.primaryImageSmall || obj.primaryImage,
    sourceUrl: obj.objectURL,
    emotionResonance: emotionsMatched.map((e) => e.id),
    colorResonance: [],
    atmosphereTags: (obj.tags ?? []).map((t) => t.term?.toLowerCase()).filter(Boolean).slice(0, 5),
    resonance: averageResonance(emotionsMatched),
    description: obj.creditLine || "",
    poeticDescription: obj.title || "",
  };
}

async function main() {
  const emotions = await loadEmotions();
  const emotionById = new Map(emotions.map((e) => [e.id, e]));
  console.log(`Loaded ${emotions.length} emotions`);

  const seen = new Set();
  const collected = [];
  for (const [emotionId, terms] of Object.entries(SEARCH_TERMS)) {
    const emotion = emotionById.get(emotionId);
    if (!emotion) continue;
    let added = 0;
    const candidatePool = new Set();
    for (const term of terms) {
      try {
        const ids = await searchMet(term);
        for (const id of ids.slice(0, 20)) candidatePool.add(id);
      } catch (err) { console.warn(`Search "${term}" failed:`, err.message); }
      await sleep(120);
    }
    for (const id of candidatePool) {
      if (added >= 4) break;
      if (seen.has(id)) continue;
      try {
        const obj = await fetchObject(id);
        if (!obj.primaryImageSmall && !obj.primaryImage) continue;
        if (!obj.isPublicDomain) continue;
        if (!obj.title) continue;
        const haystack = `${obj.title?.toLowerCase() ?? ""} ${(obj.tags ?? []).map((t) => t.term?.toLowerCase()).join(" ")} ${obj.medium?.toLowerCase() ?? ""}`;
        const matched = [];
        for (const [eid, ts] of Object.entries(SEARCH_TERMS)) {
          if (!emotionById.has(eid)) continue;
          if (ts.some((t) => haystack.includes(t.toLowerCase()))) matched.push(emotionById.get(eid));
        }
        if (matched.length === 0) matched.push(emotion);
        collected.push(buildSculpture(obj, matched));
        seen.add(id);
        added++;
      } catch (err) { /* skip */ }
      await sleep(120);
    }
    console.log(`[${emotionId}] +${added} (total ${collected.length})`);
  }

  const outPath = path.join(ROOT, "src/data/seed/sculpture-met.ts");
  const body =
`import type { Sculpture } from "@/types";

/**
 * Sculptures ingested from the Metropolitan Museum of Art Open Access API.
 * Each piece's ResonanceAxes is derived by averaging the catalogue emotions
 * whose keywords matched its tags. Generated by scripts/ingest-met-sculpture.mjs.
 *
 * Total: ${collected.length} sculptures.
 */
export const SCULPTURES_MET: Sculpture[] = ${JSON.stringify(collected, null, 2)};
`;
  await fs.writeFile(outPath, body, "utf8");
  console.log(`Wrote ${outPath} (${collected.length} entries)`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
