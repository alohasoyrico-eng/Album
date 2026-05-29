/**
 * UNIVERSAL ENTITY-TO-COLOUR RESOLVER
 *
 * Single function that returns the catalogue hex for any entity carrying a
 * 10-axis resonance vector — emotion, clan, tribe, colour, font, painting,
 * track, film, poem, sculpture, dance, photograph, literature, ritual,
 * theater, or any future discipline. Replaces the ad-hoc divergence between
 * `emotionPalette` (one-to-one unique assignment) and `culturalColor` (which
 * fell back to Oklab recipe averaging and produced greys).
 *
 * GUARANTEES
 *   1. Output is ALWAYS a hex from the 224-colour catalogue. No averaging.
 *   2. Cosine ranking keeps the result semantically appropriate (similar
 *      resonance → similar chromatic neighbourhood).
 *   3. Fingerprint-based pick within the top-K spreads similar entities
 *      across distinct catalogue entries — two Renoirs land on different
 *      hexes in the same warm-rose region.
 *   4. The 72 canonical emotions still receive their globally-unique
 *      assignment via emotionPalette (one-to-one is the right invariant
 *      for the editorial backbone). Everything else uses this resolver.
 *   5. Capacity = catalogueSize × K. With 224 colours and K=16, that's
 *      ~3,584 unique slots — enough for ~1,300 cultural items now and
 *      scales by growing K or growing the catalogue.
 */

import { COLORS } from "@/data/colors/colorResonance";
import { buildVector, cosineSimilarity, type ResonanceVector } from "./resonance-vector";
import { emotionAssignedHex } from "./emotionPalette";
import type { ResonanceAxes } from "@/types";

/** Top-K window: how many cosine-best catalogue colours we sample from. */
const DEFAULT_K = 16;

// Lazy-built cache of catalogue colour vectors. Built once per process.
let _colorVecs: Array<{ hex: string; vec: ResonanceVector }> | null = null;
function colorVecs() {
  if (!_colorVecs) {
    _colorVecs = COLORS.map((c) => ({ hex: c.hex, vec: buildVector(c.resonance) }));
  }
  return _colorVecs;
}

/** Cheap deterministic hash over an entity id. */
function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Per-entity hex cache. With ~1300 entities this stays small and amortises
// the cosine ranking cost on every render and re-filter.
const _entityHexCache = new Map<string, string>();

export interface EntityColorOptions {
  /** Window of top-cosine candidates the fingerprint chooses from. */
  k?: number;
  /** Skip the canonical-emotion bypass — useful for centroids / aggregates. */
  ignoreCanonical?: boolean;
}

/**
 * Resolve any entity's chromatic identity from its resonance + id.
 */
export function entityColor(
  resonance: ResonanceAxes,
  entityId: string,
  opts: EntityColorOptions = {},
): string {
  // 1. The 72 canonical emotions own a globally-unique assignment — respect
  //    it so editorial pages and the map dot stay in sync.
  if (!opts.ignoreCanonical) {
    const owned = emotionAssignedHex(entityId);
    if (owned) return owned;
  }

  // 2. Memoised lookup keyed by id + K (K rarely changes but allows tuning).
  const K = opts.k ?? DEFAULT_K;
  const cacheKey = `${entityId}::${K}`;
  const hit = _entityHexCache.get(cacheKey);
  if (hit) return hit;

  // 3. Cosine-rank the catalogue against the entity's resonance.
  const target = buildVector(resonance);
  const ranked = colorVecs()
    .map((c) => ({ hex: c.hex, sim: cosineSimilarity(target, c.vec) }))
    .sort((a, b) => b.sim - a.sim);

  // 4. Fingerprint-based pick within top-K — different ids in the same
  //    cosine neighbourhood land on different hexes.
  const window = ranked.slice(0, Math.min(K, ranked.length));
  const pick = window[hashId(entityId) % window.length].hex;

  _entityHexCache.set(cacheKey, pick);
  return pick;
}

/** Clear the cache — useful in tests or if the catalogue is reloaded. */
export function _resetEntityColorCache() {
  _entityHexCache.clear();
  _colorVecs = null;
}
