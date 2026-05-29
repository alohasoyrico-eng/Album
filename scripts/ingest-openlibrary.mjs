#!/usr/bin/env node
/**
 * Ingest literature from Open Library by emotional subject.
 * For each catalogue emotion, search by `subject:<keyword>` and pull
 * top-rated titles. Resonance derives from matched-emotion average.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SEARCH_SUBJECTS = {
  "melancolía":    ["melancholy", "longing"],
  "tristeza":      ["grief", "sadness"],
  "soledad":       ["loneliness", "solitude"],
  "nostalgia":     ["nostalgia", "memory"],
  "amor":          ["love"],
  "ternura":       ["tenderness"],
  "pasión":        ["passion"],
  "miedo":         ["fear"],
  "ansiedad":      ["anxiety"],
  "horror":        ["horror"],
  "ira":           ["anger"],
  "rencor":        ["revenge"],
  "envidia":       ["jealousy"],
  "desprecio":     ["contempt"],
  "vergüenza":     ["shame"],
  "culpa":         ["guilt"],
  "admiración":    ["heroism"],
  "sublimidad":    ["sublime"],
  "éxtasis":       ["mysticism"],
  "curiosidad":    ["adventure"],
  "trascendencia": ["spirituality"],
  "gratitud":      ["gratitude"],
  "compasión":     ["compassion"],
  "serenidad":     ["peace"],
  "júbilo":        ["joy"],
  "resignación":   ["resignation"],
  "fobia":         ["paranoia"],
  "orgullo":       ["pride"],
  "humor":         ["humor"],
  "anhelo":        ["yearning"],
  "esperanza":     ["hope"],
  "alegría":       ["happiness"],
  "desesperación": ["despair"],
  "soberbia":      ["arrogance"],
  "fracaso":       ["failure"],
  "celos":         ["jealousy"],
};

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

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

function buildLiterature(doc, matched, subject) {
  // Determine form from doc subjects (basic heuristic)
  const subjects = (doc.subject ?? []).map((s) => s.toLowerCase());
  let form = "novel";
  if (subjects.some((s) => s.includes("short stor"))) form = "short story";
  else if (subjects.some((s) => s.includes("essay"))) form = "essay";
  else if (subjects.some((s) => s.includes("memoir"))) form = "memoir";
  else if (subjects.some((s) => s.includes("novella"))) form = "novella";

  const author = (doc.author_name && doc.author_name[0]) || "Anonymous";
  const id = `ol-${(author + "-" + doc.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 70)}`;

  const excerpt = doc.first_sentence?.[0] ?? "";

  return {
    id,
    title: doc.title,
    author,
    year: String(doc.first_publish_year || ""),
    form,
    language: "en",
    excerpt,
    emotionResonance: matched.map((e) => e.id),
    colorResonance: [],
    atmosphereTags: subjects.slice(0, 5),
    resonance: averageResonance(matched),
    description: "",
    poeticDescription: excerpt || doc.title,
  };
}

async function main() {
  const emotions = await loadEmotions();
  const emotionById = new Map(emotions.map((e) => [e.id, e]));
  console.log(`Loaded ${emotions.length} emotions`);

  const seen = new Set();
  const collected = [];
  const idCounts = new Map();

  for (const [eid, subjects] of Object.entries(SEARCH_SUBJECTS)) {
    const emotion = emotionById.get(eid);
    if (!emotion) continue;
    let added = 0;
    for (const subject of subjects) {
      if (added >= 4) break;
      try {
        const url = `https://openlibrary.org/search.json?q=subject%3A${encodeURIComponent(subject)}&limit=20&fields=title,author_name,first_publish_year,first_sentence,subject`;
        const data = await fetchJson(url);
        for (const doc of data.docs ?? []) {
          if (added >= 4) break;
          if (!doc.title) continue;
          if (!doc.first_publish_year) continue;
          if (doc.first_publish_year < 1800 || doc.first_publish_year > 2020) continue; // canon-ish
          const key = `${(doc.author_name?.[0] ?? "")}-${doc.title}`;
          if (seen.has(key)) continue;

          // Match emotions by subject keywords
          const haystack = (doc.subject ?? []).map((s) => s.toLowerCase()).join(" ");
          const matched = [];
          for (const [eid2, subs] of Object.entries(SEARCH_SUBJECTS)) {
            if (!emotionById.has(eid2)) continue;
            if (subs.some((s) => haystack.includes(s.toLowerCase()))) matched.push(emotionById.get(eid2));
          }
          if (matched.length === 0) matched.push(emotion);

          let entry = buildLiterature(doc, matched, subject);
          const baseId = entry.id;
          const count = idCounts.get(baseId) ?? 0;
          if (count > 0) entry.id = `${baseId}-${count + 1}`;
          idCounts.set(baseId, count + 1);

          collected.push(entry);
          seen.add(key);
          added++;
        }
      } catch (err) { console.warn(`"${subject}" failed:`, err.message); }
      await sleep(200);
    }
    console.log(`[${eid}] +${added} (total ${collected.length})`);
  }

  const outPath = path.join(ROOT, "src/data/seed/literature-ol.ts");
  const body = `import type { Literature } from "@/types";

/**
 * Literature ingested from Open Library by emotional subject keyword.
 * Each work's ResonanceAxes derives from emotion-subject matching.
 * Generated by scripts/ingest-openlibrary.mjs.
 *
 * Total: ${collected.length} works.
 */
export const LITERATURES_OL: Literature[] = ${JSON.stringify(collected, null, 2)};
`;
  await fs.writeFile(outPath, body, "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
