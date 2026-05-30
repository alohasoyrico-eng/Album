#!/usr/bin/env node
/**
 * ingest-tmdb-posters — fills in `posterUrl` for the films in
 * `src/data/seed/films-extended.ts` by querying the TMDB API.
 *
 * Why this is a separate script
 * ──────────────────────────────
 * The diversity-expansion films (~68 entries) ship with no posterUrl.
 * The iconographic fallback in CulturalImage handles missing posters
 * gracefully — but for cinema specifically, the poster is half of the
 * recognition, so it's worth filling these in when possible.
 *
 * This script is run manually, locally, with a TMDB API key:
 *
 *     TMDB_API_KEY=your_key node scripts/ingest-tmdb-posters.mjs
 *
 * Get a key (free, 5-minute registration):
 *   https://www.themoviedb.org/settings/api
 *
 * What it does
 * ─────────────
 *   1. Parse films-extended.ts, find every entry with an empty
 *      `posterUrl` field.
 *   2. For each, query `/search/movie?query=<title>&year=<year>`.
 *   3. Take the first hit; if the year matches (±1), accept it.
 *   4. Build the poster URL: `https://image.tmdb.org/t/p/w500<path>`.
 *   5. Rewrite the source file in place, inserting `posterUrl: "..."`.
 *
 * Errors / no-match: leave the entry untouched. The iconographic
 * fallback continues to render.
 *
 * Rate limit: TMDB allows 40 req/sec. We pause 100 ms between
 * requests to stay polite.
 */

import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.error("Missing TMDB_API_KEY env var. Register at https://www.themoviedb.org/settings/api (free).");
  process.exit(1);
}

const FILE = path.resolve("src/data/seed/films-extended.ts");
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const REQUEST_DELAY_MS = 120;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchTmdb(title, year) {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("query", title);
  if (year) url.searchParams.set("year", String(year));
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;
  // Prefer year match (TMDB returns release_date "YYYY-MM-DD")
  const match = data.results.find((r) => {
    if (!year || !r.release_date) return false;
    const y = parseInt(r.release_date.slice(0, 4), 10);
    return Math.abs(y - year) <= 1;
  }) ?? data.results[0];
  return match;
}

/** Parse the entries by regex — simple enough since the file is
 *  consistently formatted. We pull title, year, and capture the
 *  closing brace of each entry so we can splice posterUrl in. */
function parseEntries(src) {
  const entries = [];
  const re = /\{\s*\n\s*id: "([^"]+)",\s*\n\s*title: "([^"]+)",\s*\n\s*director: "([^"]+)",\s*\n\s*year: (\d+),/g;
  let m;
  while ((m = re.exec(src))) {
    entries.push({
      id: m[1],
      title: m[2],
      director: m[3],
      year: parseInt(m[4], 10),
      matchIndex: m.index,
    });
  }
  return entries;
}

function hasPosterUrl(src, entryId) {
  const idx = src.indexOf(`id: "${entryId}"`);
  if (idx < 0) return true;
  // Look at the next ~600 chars for either posterUrl or the closing brace
  const slice = src.slice(idx, idx + 800);
  return /posterUrl:/.test(slice);
}

function insertPosterUrl(src, entryId, posterPath) {
  const url = POSTER_BASE + posterPath;
  // Insert right after `year: N,` line for the entry
  const re = new RegExp(`(id: "${entryId}",\\s*\\n\\s*title: "[^"]+",\\s*\\n\\s*director: "[^"]+",\\s*\\n\\s*year: \\d+,)`);
  return src.replace(re, `$1\n    posterUrl: "${url}",`);
}

async function main() {
  let src = await fs.readFile(FILE, "utf8");
  const entries = parseEntries(src);

  console.log(`Found ${entries.length} films in ${path.basename(FILE)}.`);
  let filled = 0;
  let skipped = 0;
  let missed = 0;

  for (const e of entries) {
    if (hasPosterUrl(src, e.id)) {
      skipped++;
      continue;
    }
    try {
      const hit = await searchTmdb(e.title, e.year);
      if (hit?.poster_path) {
        src = insertPosterUrl(src, e.id, hit.poster_path);
        filled++;
        console.log(`  ✓ ${e.title} (${e.year}) → ${hit.poster_path}`);
      } else {
        missed++;
        console.log(`  · ${e.title} (${e.year}) → no match`);
      }
    } catch (err) {
      missed++;
      console.log(`  ! ${e.title} (${e.year}) → error: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await fs.writeFile(FILE, src, "utf8");
  console.log(`\nDone. filled=${filled} skipped=${skipped} missed=${missed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
