/**
 * autoFillResonance — fills empty `emotionResonance` / `colorResonance`
 * arrays on the diversity-expansion catalogues.
 *
 * Why this exists
 * ────────────────
 * The original curated entries (Marina's 16 films / 18 tracks / 8
 * sculptures / …) all have hand-typed `emotionResonance: ["amor",
 * "melancolía", ...]` arrays. Those arrays do two things:
 *   1. Power back-references — visiting an emotion can highlight
 *      "this film was curated for melancolía"; visiting a film can
 *      tell the visitor "Marina paired this with amor".
 *   2. Serve as a curated bias to the resonance-engine fallback.
 *
 * The diversity-expansion files I added later (films-extended.ts,
 * music-extended.ts, …) ship those arrays empty because writing 240
 * × 6 pairings by hand is unreasonable. But empty arrays also mean
 * those entries become "anonymous" in the cross-reference layer.
 *
 * This helper closes the gap by computing the top-3 nearest emotions
 * + top-3 nearest colors *per entry* via cosine similarity over the
 * 10-axis resonance space — which I DID curate per entry. The result
 * is deterministic, runs once at module init, and gives every new
 * entry a plausible set of back-references without manual labour.
 *
 * Curated entries (where the array is already non-empty) pass through
 * untouched. Marina's hand-pinning always wins.
 */

import type { ResonanceAxes, EmotionId, ColorId } from "@/types";
import { EMOTIONS } from "@/data/ontology/emotions";
import { COLORS } from "@/data/colors/colorResonance";
import { buildVector, cosineSimilarity } from "@/lib/resonance-vector";

interface ResonatesEntry {
  id: string;
  resonance: ResonanceAxes;
  emotionResonance: EmotionId[];
  colorResonance: ColorId[];
}

// Pre-compute the index of every emotion + colour vector once. The
// 95 emotions + 224 colours times each entry would be wasteful if
// done per-call; this caches the vectors in memory.
const _emotionVectors = EMOTIONS.map((e) => ({
  id: e.id as EmotionId,
  vector: buildVector(e.resonance),
}));
const _colorVectors = COLORS.map((c) => ({
  id: c.id as ColorId,
  vector: buildVector(c.resonance),
}));

function topK<T>(items: T[], score: (t: T) => number, k: number): T[] {
  return [...items]
    .map((t) => ({ t, s: score(t) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.t);
}

function nearestEmotions(resonance: ResonanceAxes, k: number): EmotionId[] {
  const v = buildVector(resonance);
  return topK(_emotionVectors, (e) => cosineSimilarity(v, e.vector), k).map((e) => e.id);
}

function nearestColors(resonance: ResonanceAxes, k: number): ColorId[] {
  const v = buildVector(resonance);
  return topK(_colorVectors, (c) => cosineSimilarity(v, c.vector), k).map((c) => c.id);
}

/**
 * Returns a new array with `emotionResonance` / `colorResonance` filled
 * (top-3 by cosine similarity) on any entry whose array was empty.
 * Entries with non-empty arrays are returned untouched — curated
 * pinning always wins.
 */
export function autoFillResonance<T extends ResonatesEntry>(entries: T[]): T[] {
  return entries.map((e) => {
    const needsEmotions = !e.emotionResonance || e.emotionResonance.length === 0;
    const needsColors = !e.colorResonance || e.colorResonance.length === 0;
    if (!needsEmotions && !needsColors) return e;
    return {
      ...e,
      emotionResonance: needsEmotions ? nearestEmotions(e.resonance, 3) : e.emotionResonance,
      colorResonance: needsColors ? nearestColors(e.resonance, 3) : e.colorResonance,
    };
  });
}
