/**
 * Stable, one-to-one emotion → catalogue colour assignment.
 *
 * Why this exists: the recipe-mix output averages chromatic extremes
 * (rosa-bebé becomes mid-pink, fucsia becomes muted, lila becomes grey).
 * Result: 7 pink emotions all land on visually similar mid-pinks even
 * though the catalogue carries 27 distinct rose/pink variants.
 *
 * Strategy: at module load, assign each of the 72 canonical emotions a
 * UNIQUE hex from the 224 catalogue. Each emotion claims its highest-
 * cosine catalogue colour that is still available; later emotions fall
 * back to their next-best. With 72 emotions among 224 candidates, every
 * emotion lands on a clearly distinct colour while still being
 * semantically appropriate.
 *
 * Processing order: by "vector extremity" first — emotions whose vectors
 * sit furthest from the global centroid get to pick first, so the
 * absolute best matches go to the most distinctive emotions. The bland
 * mid-vector emotions take whatever the catalogue has left, which is
 * still semantically close because they're close to the centroid.
 */

import { EMOTIONS } from "@/data/ontology/emotions";
import { COLORS } from "@/data/colors/colorResonance";
import { buildVector, cosineSimilarity } from "./resonance-vector";
import type { ResonanceAxes } from "@/types";

function centroid(vs: Array<{ resonance: ResonanceAxes }>): ResonanceAxes {
  const sum: ResonanceAxes = { energy: 0, temperature: 0, tension: 0, density: 0, movement: 0, temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0 };
  for (const v of vs) {
    for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) sum[k] += v.resonance[k];
  }
  const n = Math.max(1, vs.length);
  for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) sum[k] = sum[k] / n;
  return sum;
}

function distanceFromCentroid(r: ResonanceAxes, c: ResonanceAxes): number {
  let s = 0;
  for (const k of Object.keys(c) as Array<keyof ResonanceAxes>) {
    const d = r[k] - c[k];
    s += d * d;
  }
  return Math.sqrt(s);
}

function buildAssignment(): Map<string, string> {
  const out = new Map<string, string>();
  const colorPool = COLORS.map((c) => ({ id: c.id, hex: c.hex, vec: buildVector(c.resonance) }));
  const claimed = new Set<string>();

  const emoCentroid = centroid(EMOTIONS);
  const ordered = [...EMOTIONS]
    .map((e) => ({ e, dist: distanceFromCentroid(e.resonance, emoCentroid) }))
    .sort((a, b) => b.dist - a.dist) // most-extreme first
    .map((x) => x.e);

  for (const emotion of ordered) {
    const evec = buildVector(emotion.resonance);
    let best: typeof colorPool[number] | null = null;
    let bestSim = -Infinity;
    for (const c of colorPool) {
      if (claimed.has(c.id)) continue;
      const sim = cosineSimilarity(evec, c.vec);
      if (sim > bestSim) { bestSim = sim; best = c; }
    }
    if (best) {
      out.set(emotion.id, best.hex);
      claimed.add(best.id);
    }
  }

  return out;
}

const _assignment = buildAssignment();

/**
 * Returns the catalogue hex assigned to this emotion. If the id is
 * unknown (not a canonical emotion), returns null and the caller should
 * fall back to a derived/recipe colour.
 */
export function emotionAssignedHex(emotionId: string): string | null {
  return _assignment.get(emotionId) ?? null;
}
