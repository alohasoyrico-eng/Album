#!/usr/bin/env node
/**
 * ingest-wikipedia-images — fills missing image URLs on the extended
 * catalogues by querying Wikipedia's public API.
 *
 * No API key required. Wikipedia's REST endpoint
 *   https://en.wikipedia.org/api/rest_v1/page/summary/<title>
 * returns a `thumbnail.source` URL for the canonical Commons image
 * of a page, when one exists.
 *
 * Targets:
 *   - architecture-extended.ts  (Hagia Sophia, Machu Picchu, etc.)
 *   - theater-extended.ts       (Bernarda Alba, Hamlet, …)
 *   - dance-extended.ts         (Café Müller, Bolero, …)
 *   - ritual-extended.ts        (Día de Muertos, Kumbh Mela, …)
 *   - music-extended.ts         (Águas de Março, Libertango, …)
 *
 * The Wikipedia URL family (`upload.wikimedia.org/wikipedia/commons/…`)
 * is on the next.config.ts remotePatterns allow-list AND it goes
 * through the Vercel image proxy, so it's not subject to the
 * hotlinking restrictions of arbitrary upload.wikimedia.org/wikipedia/en/
 * thumbnails.
 *
 * Usage:
 *   node scripts/ingest-wikipedia-images.mjs
 *
 * The script tries a few search strategies per entry:
 *   1. Direct title page (`/page/summary/<title>`).
 *   2. Title + author/director suffixed if not found.
 *   3. Search via `/page/related/...` (skipped — too noisy).
 *
 * If nothing resolves, the entry is left alone (iconographic fallback
 * keeps working).
 */

import fs from "node:fs/promises";
import path from "node:path";

const REQUEST_DELAY_MS = 100;
const UA = "AlbumIngestBot/1.0 (https://album-mocha-theta.vercel.app)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strip diacritics, lowercase — used for search normalisation only. */
function normalise(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function tryFetchSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type === "disambiguation") return null;
  return data;
}

async function findThumbnail(query) {
  // 1) exact title
  let s = await tryFetchSummary(query);
  if (s?.thumbnail?.source) return s.thumbnail.source;
  // 2) title without diacritics
  const ascii = normalise(query);
  if (ascii !== query) {
    s = await tryFetchSummary(ascii);
    if (s?.thumbnail?.source) return s.thumbnail.source;
  }
  // 3) wiki search → pick top match → fetch that page
  const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set("srsearch", query);
  searchUrl.searchParams.set("srlimit", "3");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("origin", "*");
  const sres = await fetch(searchUrl, { headers: { "User-Agent": UA } });
  if (!sres.ok) return null;
  const sdata = await sres.json();
  const hits = sdata?.query?.search ?? [];
  for (const h of hits) {
    const sum = await tryFetchSummary(h.title);
    if (sum?.thumbnail?.source) return sum.thumbnail.source;
  }
  return null;
}

/** Find every entry whose imageUrl/posterUrl is empty or missing. We
 *  parse very loosely: each entry starts with `{ \n    id: "..."`. */
function findEmptyImageEntries(src, kind) {
  const isPoster = kind === "film";
  const imageKey = isPoster ? "posterUrl" : "imageUrl";
  const entries = [];
  // Match each entry block opening line; capture id + the title for
  // search hints.
  const blockRe = /\{\s*\n\s*id: "([^"]+)",[\s\S]*?(?=\n  \},?\n)/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const block = m[0];
    const id = m[1];
    const titleMatch = block.match(/title: "([^"]+)"/);
    if (!titleMatch) continue;
    const title = titleMatch[1];
    // Already has the image? Either `${imageKey}: "https://..."` or
    // explicitly empty string. Treat empty string as missing.
    const hasReal = new RegExp(`${imageKey}: "https?://`).test(block);
    if (hasReal) continue;
    // Hint: author / artist / director / architect / choreographer
    let hint = null;
    const hintRe = /(?:author|artist|director|architect|choreographer|tradition|culture): "([^"]+)"/;
    const hintMatch = block.match(hintRe);
    if (hintMatch) hint = hintMatch[1];
    entries.push({ id, title, hint, blockOffset: m.index, blockLength: block.length });
  }
  return entries;
}

async function processFile(file, kind) {
  const filePath = path.resolve(file);
  let src = await fs.readFile(filePath, "utf8");
  const entries = findEmptyImageEntries(src, kind);
  console.log(`\n[${path.basename(file)}] ${entries.length} entries without image.`);
  if (entries.length === 0) return { filled: 0, missed: 0 };
  let filled = 0, missed = 0;
  for (const e of entries) {
    const query = e.hint && !e.title.toLowerCase().includes(e.hint.toLowerCase())
      ? `${e.title} ${e.hint}`
      : e.title;
    try {
      const url = await findThumbnail(query);
      if (url) {
        const imageKey = kind === "film" ? "posterUrl" : "imageUrl";
        // Splice into the block: insert after the `year:` or `id:` line.
        const idLine = `id: "${e.id}",`;
        const idIdx = src.indexOf(idLine);
        if (idIdx < 0) { missed++; continue; }
        // Find the end of the line that starts with `year:` or
        // `author:` after id. We'll insert imageKey on a fresh line
        // after the first comma-terminated field.
        const after = src.indexOf("\n", idIdx);
        const insertion = `\n    ${imageKey}: "${url}",`;
        src = src.slice(0, after) + insertion + src.slice(after);
        filled++;
        console.log(`  ✓ ${e.title} → ${url.slice(0, 80)}...`);
      } else {
        missed++;
        console.log(`  · ${e.title} → no Wikipedia thumbnail`);
      }
    } catch (err) {
      missed++;
      console.log(`  ! ${e.title} → ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  await fs.writeFile(filePath, src, "utf8");
  console.log(`  → filled=${filled} missed=${missed}`);
  return { filled, missed };
}

async function main() {
  const targets = [
    ["src/data/seed/architecture-extended.ts", "architecture"],
    ["src/data/seed/theater-extended.ts",      "theater"],
    ["src/data/seed/dance-extended.ts",        "dance"],
    ["src/data/seed/ritual-extended.ts",       "ritual"],
    ["src/data/seed/music-extended.ts",        "music"],
  ];
  let totalFilled = 0, totalMissed = 0;
  for (const [file, kind] of targets) {
    const { filled, missed } = await processFile(file, kind);
    totalFilled += filled;
    totalMissed += missed;
  }
  console.log(`\nTotal: filled=${totalFilled} missed=${totalMissed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
