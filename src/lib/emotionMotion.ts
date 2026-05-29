/**
 * Stable emotion → motion pattern assignment.
 *
 * Same architecture as emotionPalette.ts (colour) and emotionFonts.ts
 * (typography): the catalogue of MOTION_PATTERNS is mined for the
 * highest-resonance match per emotion, and assignments are tracked so
 * no two emotions claim the same pattern when the pool is large enough.
 *
 * Each emotion ends up with its own pace + inertia + trajectory + decay
 * + size bias. The map's circle size, glow period, hover transition
 * easing, idle drift and reveal animations all derive from this single
 * pattern.
 */

import { EMOTIONS } from "@/data/ontology/emotions";
import { MOTION_PATTERNS, type MotionPattern } from "@/data/motion/patterns";
import { buildVector, cosineSimilarity } from "./resonance-vector";
import type { ResonanceAxes } from "@/types";

function centroid(vs: Array<{ resonance: ResonanceAxes }>): ResonanceAxes {
  const sum: ResonanceAxes = { energy: 0, temperature: 0, tension: 0, density: 0, movement: 0, temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0 };
  for (const v of vs) for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) sum[k] += v.resonance[k];
  const n = Math.max(1, vs.length);
  for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) sum[k] = sum[k] / n;
  return sum;
}

function distFromCentroid(r: ResonanceAxes, c: ResonanceAxes): number {
  let s = 0;
  for (const k of Object.keys(c) as Array<keyof ResonanceAxes>) {
    const d = r[k] - c[k];
    s += d * d;
  }
  return Math.sqrt(s);
}

function buildAssignment(): Map<string, MotionPattern> {
  const out = new Map<string, MotionPattern>();
  const pool = MOTION_PATTERNS.map((p) => ({ pattern: p, vec: buildVector(p.resonance) }));
  const claimed = new Set<string>();

  const emoCentroid = centroid(EMOTIONS);
  const ordered = [...EMOTIONS]
    .map((e) => ({ e, d: distFromCentroid(e.resonance, emoCentroid) }))
    .sort((a, b) => b.d - a.d)   // most-extreme emotions pick first
    .map((x) => x.e);

  for (const emo of ordered) {
    const evec = buildVector(emo.resonance);
    let best: typeof pool[number] | null = null;
    let bestSim = -Infinity;
    for (const p of pool) {
      if (claimed.has(p.pattern.id)) continue;
      const sim = cosineSimilarity(evec, p.vec);
      if (sim > bestSim) { bestSim = sim; best = p; }
    }
    if (best) {
      out.set(emo.id, best.pattern);
      claimed.add(best.pattern.id);
    }
  }

  // When the catalogue runs out (we have more emotions than patterns),
  // fall back to best-cosine reuse so the remainder still gets a sensible
  // pattern rather than nothing.
  for (const emo of EMOTIONS) {
    if (out.has(emo.id)) continue;
    const evec = buildVector(emo.resonance);
    let best: MotionPattern | null = null;
    let bestSim = -Infinity;
    for (const p of pool) {
      const sim = cosineSimilarity(evec, p.vec);
      if (sim > bestSim) { bestSim = sim; best = p.pattern; }
    }
    if (best) out.set(emo.id, best);
  }

  return out;
}

const _assignment = buildAssignment();

export function emotionMotion(
  emotionId: string,
  ctx?: import("@/types/claims").ReadContext,
): MotionPattern | null {
  // Lens-shifted resonance → re-derive a motion pattern in the live
  // catalogue (uniqueness is sacrificed when the lens is active, which
  // is the right trade-off: lens is a perspective, not the canon).
  if (ctx?.lens) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { lensShiftsResonance, liveResonance } = require("@/data/ontology/emotions-claims") as
      typeof import("@/data/ontology/emotions-claims");
    if (lensShiftsResonance(emotionId, ctx)) {
      return deriveMotion(liveResonance(emotionId, ctx));
    }
  }
  return _assignment.get(emotionId) ?? null;
}

/**
 * Fallback: derive a motion pattern from any resonance vector by cosine
 * to the catalogue. Used by clan/tribe/colour centroids that aren't in
 * the canonical assignment map.
 */
export function deriveMotion(resonance: ResonanceAxes): MotionPattern {
  const v = buildVector(resonance);
  let best = MOTION_PATTERNS[0];
  let bestSim = -Infinity;
  for (const p of MOTION_PATTERNS) {
    const sim = cosineSimilarity(v, buildVector(p.resonance));
    if (sim > bestSim) { bestSim = sim; best = p; }
  }
  return best;
}

/**
 * Convert a pattern to CSS variables. Any component on the subtree picks
 * up the rhythm by referencing var(--em-pace) etc.
 */
export function motionCssVars(p: MotionPattern): Record<string, string> {
  return {
    "--em-pace": `${p.pace}ms`,
    "--em-inertia": p.inertia,
    "--em-trajectory": p.trajectory,
    "--em-decay": p.decay,
    "--em-size-bias": String(p.sizeBias),
  };
}
