#!/usr/bin/env node
/**
 * Ingest poems from PoetryDB.
 *
 * Strategy:
 *   - For each catalogue emotion, define keywords likely to appear in poems
 *     (English, public domain — PoetryDB is mostly Romantics + Victorians).
 *   - Fetch all poems by a curated roster of authors.
 *   - For each poem, score it against every emotion by counting keyword
 *     occurrences in its lines. The top-N scoring emotions become the
 *     poem's resonance source (averaged).
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PDB = "https://poetrydb.org";

// Authors with substantial corpora and emotional range
const AUTHORS = [
  "John Keats",
  "William Wordsworth",
  "Emily Dickinson",
  "Walt Whitman",
  "William Blake",
  "Percy Bysshe Shelley",
  "Lord Byron",
  "Christina Rossetti",
  "Edgar Allan Poe",
  "William Butler Yeats",
];

// Keywords mapped to catalogue emotion IDs. Lowercase, word-stems
// matched as substring within the poem's text. Each emotion has 3-6 markers.
const EMOTION_KEYWORDS = {
  "melancolía":    ["melancholy","sorrow","sadness","mourn","weep","grief","lamen"],
  "tristeza":      ["sad","tears","sorrow","weep","grieve","cry"],
  "soledad":       ["alone","lonely","solitude","silent","empty","abandoned"],
  "nostalgia":     ["memory","remember","past","once","old","gone","return"],
  "añoranza":      ["far","distant","absent","longing","yearn"],
  "esperanza":     ["hope","dawn","light","spring","tomorrow","promise"],
  "alegría":       ["joy","glad","laugh","merry","delight","mirth"],
  "amor":          ["love","beloved","dear","heart","kiss","embrace"],
  "ternura":       ["gentle","tender","soft","kind","mother","child"],
  "pasión":        ["passion","fire","burn","desire","ardent","flame"],
  "anhelo":        ["yearn","crave","wish","desire","long for","aching"],
  "miedo":         ["fear","afraid","terror","tremble","shadow","dread"],
  "ansiedad":      ["anxious","restless","fret","worry","unease"],
  "horror":        ["horror","appal","ghastly","corpse","hell","dread"],
  "ira":           ["anger","wrath","rage","fury","scorn"],
  "rencor":        ["resent","grudge","spite","bitter"],
  "envidia":       ["envy","jealous","covet"],
  "desprecio":     ["contempt","scorn","despise","mock"],
  "vergüenza":     ["shame","blush","sin","fallen","disgrace"],
  "culpa":         ["guilt","sin","confess","penitent","atone"],
  "admiración":    ["adore","awe","reverence","wonder","worship"],
  "sublimidad":    ["sublime","vast","infinite","mighty","majestic","eternal"],
  "éxtasis":       ["ecstasy","rapture","vision","heaven","transport"],
  "curiosidad":    ["wonder","question","seek","ponder","ask"],
  "trascendencia": ["soul","spirit","heaven","divine","eternal","beyond"],
  "gratitud":      ["thank","bless","grateful","praise"],
  "compasión":     ["pity","mercy","compassion","tender"],
  "serenidad":     ["calm","peace","still","tranquil","quiet"],
  "júbilo":        ["rejoice","exult","triumph","cheer"],
  "resignación":   ["resign","accept","yield","submit"],
  "asco":          ["loath","disgust","foul","vile"],
  "fobia":         ["dread","abhor"],
  "orgullo":       ["proud","pride","glory","dignity"],
  "humor":         ["merry","laugh","jest","comic","wit"],
  "fatiga":        ["weary","tired","heavy","worn"],
  "desánimo":      ["despair","faint","weak"],
  "apatía":        ["dull","listless","numb","weary"],
  "alivio":        ["relief","ease","rest","release"],
};

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchAuthor(author) {
  const url = `${PDB}/author/${encodeURIComponent(author)}/title,author,lines,linecount`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${author}`);
  return res.json();
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

function scorePoem(text, emotionsCatalogue) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [eid, kws] of Object.entries(EMOTION_KEYWORDS)) {
    let s = 0;
    for (const k of kws) {
      // Count occurrences
      let idx = 0;
      while ((idx = lower.indexOf(k, idx)) !== -1) {
        s++;
        idx += k.length;
      }
    }
    if (s > 0) scores[eid] = s;
  }
  return scores;
}

// Track id collisions so we can append a counter — necessary because two
// different poems can normalize to the same kebab-cased id (e.g. excerpts
// from the same long poem) and React requires unique keys.
const _idCounts = new Map();

function buildPoem(p, emotionsMatched, scores) {
  // Use " / " as a line separator instead of "\n" — Turbopack's parser balks
  // on long escaped-newline string literals (the file is valid JS but the
  // diagnostic is wrong). Visual separator reads fine on the page.
  const sample = p.lines.slice(0, 6).join(" / ");
  let id = `pdb-${p.author.toLowerCase().replace(/[^a-z]+/g, "-")}-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
  const seen = _idCounts.get(id) ?? 0;
  if (seen > 0) id = `${id}-${seen + 1}`;
  _idCounts.set(id.replace(/-\d+$/, ""), seen + 1);
  return {
    id,
    title: p.title,
    author: p.author,
    year: "",
    language: "en",
    excerpt: sample,
    source: "poetrydb",
    sourceId: id,
    sourceUrl: `https://poetrydb.org/title/${encodeURIComponent(p.title)}`,
    emotionResonance: emotionsMatched.map((e) => e.id),
    colorResonance: [],
    atmosphereTags: Object.keys(scores).slice(0, 5),
    resonance: averageResonance(emotionsMatched),
    poeticDescription: sample.split("\n")[0],
  };
}

async function main() {
  const emotions = await loadEmotions();
  const emotionById = new Map(emotions.map((e) => [e.id, e]));
  console.log(`Loaded ${emotions.length} catalogue emotions`);

  const collected = [];
  for (const author of AUTHORS) {
    try {
      const poems = await fetchAuthor(author);
      console.log(`[${author}] ${poems.length} poems`);
      // Pick the ones with the strongest emotional signal
      const rated = poems
        .map((p) => {
          if (!p.lines?.length) return null;
          const text = p.lines.join(" ");
          if (text.length < 80) return null; // skip fragments
          const scores = scorePoem(text, emotions);
          const total = Object.values(scores).reduce((s, x) => s + x, 0);
          return { poem: p, scores, total };
        })
        .filter(Boolean)
        .sort((a, b) => b.total - a.total);

      const top = rated.slice(0, 15); // up to 15 per author
      for (const r of top) {
        // Take top 3 emotions by score for vectorization
        const ranked = Object.entries(r.scores)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([eid]) => emotionById.get(eid))
          .filter(Boolean);
        if (ranked.length === 0) continue;
        collected.push(buildPoem(r.poem, ranked, r.scores));
      }
      await sleep(120);
    } catch (err) {
      console.warn(`Author ${author} failed:`, err.message);
    }
  }

  console.log(`\nIngested ${collected.length} poems`);

  const outPath = path.join(ROOT, "src/data/seed/poetry-pdb.ts");
  const body =
`import type { Poem } from "@/types";

/**
 * Poems ingested from PoetryDB (public-domain English-language verse).
 * Generated by scripts/ingest-poetrydb.mjs.
 * Each poem was scored by counting catalogue-emotion keywords in its lines;
 * its resonance vector is the average of the top-3 scoring emotions.
 *
 * Total: ${collected.length} poems.
 */
export const POEMS_PDB: Poem[] = ${JSON.stringify(collected, null, 2)};
`;
  await fs.writeFile(outPath, body, "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
