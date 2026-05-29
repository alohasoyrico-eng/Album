/**
 * Greedy farthest-point colour assignment for the map.
 *
 * Problem: cosine-similarity over the 224-colour catalogue is too sticky —
 * "melancolía", "nostalgia" and "tristeza" all return the same purple
 * because their vectors are genuinely close, even though the catalogue
 * contains dozens of distinct purples, violets, greys and indigos.
 *
 * Solution: for each emotion, instead of taking the top-1 nearest colour,
 * take the top-K candidates and greedily pick the one that is FARTHEST
 * (in perceptual Oklab distance) from every colour already assigned.
 * This guarantees the map's emotion dots span the full chromatic range
 * of the catalogue, while still respecting each emotion's neighbourhood.
 */

import type { Emotion, ColorResonance } from "@/types";
import { buildVector, cosineSimilarity } from "./resonance-vector";
import { hexToOklab } from "./chromatics";

interface ScoredColor {
  id: string;
  hex: string;
  oklab: { L: number; a: number; b: number };
}

function oklabDistance(a: ScoredColor["oklab"], b: ScoredColor["oklab"]): number {
  const dL = a.L - b.L;
  const dA = a.a - b.a;
  const dB = a.b - b.b;
  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

export function assignDiverseEmotionColors(
  emotions: Emotion[],
  colors: ColorResonance[],
  candidatesPerEmotion = 18,
): Map<string, string> {
  // Precompute color vectors + Oklab
  const colorIndex: ScoredColor[] = colors.map((c) => ({
    id: c.id,
    hex: c.hex,
    oklab: hexToOklab(c.hex),
  }));
  const colorVectors = colors.map((c) => buildVector(c.resonance));

  // For each emotion: rank colours by cosine similarity, keep top-K candidates
  const ranked: Array<{ emotionId: string; candidates: ScoredColor[] }> =
    emotions.map((e) => {
      const ev = buildVector(e.resonance);
      const scored = colors
        .map((c, i) => ({ ...colorIndex[i], sim: cosineSimilarity(ev, colorVectors[i]) }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, candidatesPerEmotion);
      return { emotionId: e.id, candidates: scored };
    });

  // Process emotions in a stable order, but pick within each their farthest
  // candidate from already-assigned colours. Result: a spread palette.
  const assigned: ScoredColor[] = [];
  const result = new Map<string, string>();

  for (const { emotionId, candidates } of ranked) {
    let best = candidates[0];
    let bestScore = -Infinity;

    for (const cand of candidates) {
      // Diversity score: minimum distance from already-assigned colours.
      // First assignment: just use rank-1.
      const minDist = assigned.length === 0
        ? 1
        : Math.min(...assigned.map((a) => oklabDistance(a.oklab, cand.oklab)));
      // We weight diversity strongly so we actually explore the catalogue.
      // Blend with the candidate's cosine rank position to keep semantic
      // fidelity: high-rank candidates get a small bonus.
      const rankIdx = candidates.indexOf(cand);
      const score = minDist - rankIdx * 0.008;
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }

    assigned.push(best);
    result.set(emotionId, best.hex);
  }

  return result;
}
