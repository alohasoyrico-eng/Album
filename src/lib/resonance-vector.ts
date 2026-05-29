/**
 * Unified resonance vector system.
 *
 * Álbum's semantic engine treats every entity (emotion, artwork, music,
 * film, sculpture, dance, architecture, photography, literature, ritual,
 * color, font, poem) as a point in a single high-dimensional vector space.
 * Similarity in this space IS semantic resonance.
 *
 * Each entity already carries 10 base axes (`ResonanceAxes`). We extend this
 * with COMPOSITE axes derived from the base — softness, fragility, silence,
 * rituality, sacredness, etc. These don't add independent information (they
 * are linear combinations of the 10 base), but they:
 *
 *   1. enrich the cosine direction with semantically-meaningful dimensions
 *      that match how humans actually compare emotions/artworks
 *   2. give the UI READABLE explanations ("they resonate by their shared
 *      silence and sacredness") instead of "axes 4 and 7 are close"
 *
 * Optional atmosphereTags also contribute a sparse "tag vector" which can
 * surface non-axis resonance (e.g. "nocturno" tag boost).
 */

import type { ResonanceAxes } from "@/types";

// ─── Base axis names ──────────────────────────────────────────────────────────
const BASE_AXES = [
  "energy",
  "temperature",
  "tension",
  "density",
  "movement",
  "temporality",
  "humanity",
  "clarity",
  "intimacy",
  "control",
] as const;

// ─── Composite axes ───────────────────────────────────────────────────────────
// These are formally derived from the base. They give the vector space more
// human-readable directions for resonance interpretation. Each is a weighted
// combination of base axes in [0..1].
export const COMPOSITE_AXES = [
  "softness",
  "fragility",
  "silence",
  "rituality",
  "sacredness",
  "aggression",
  "warmth",
  "melancholyTone",
  "openness",
  "instability",
  "ambiguity",
  "intimacyPull",
] as const;

export type CompositeAxis = (typeof COMPOSITE_AXES)[number];

/**
 * Composite axis definitions. Each is a sum of `weight × normalized axis`
 * (axes normalized to 0..1, optionally inverted with `inv: true`).
 */
const COMPOSITE_RECIPES: Record<
  CompositeAxis,
  Array<{ axis: keyof ResonanceAxes; weight: number; inv?: boolean }>
> = {
  softness: [
    { axis: "humanity", weight: 0.35 },
    { axis: "intimacy", weight: 0.30 },
    { axis: "tension", weight: 0.25, inv: true },
    { axis: "temperature", weight: 0.10 },
  ],
  fragility: [
    { axis: "energy", weight: 0.35, inv: true },
    { axis: "control", weight: 0.30, inv: true },
    { axis: "density", weight: 0.20, inv: true },
    { axis: "clarity", weight: 0.15, inv: true },
  ],
  silence: [
    { axis: "energy", weight: 0.40, inv: true },
    { axis: "movement", weight: 0.35, inv: true },
    { axis: "tension", weight: 0.25, inv: true },
  ],
  rituality: [
    { axis: "control", weight: 0.30 },
    { axis: "temporality", weight: 0.35 },
    { axis: "density", weight: 0.20 },
    { axis: "humanity", weight: 0.15 },
  ],
  sacredness: [
    { axis: "temporality", weight: 0.30 },
    { axis: "control", weight: 0.25 },
    { axis: "clarity", weight: 0.20 },
    { axis: "humanity", weight: 0.15 },
    { axis: "tension", weight: 0.10, inv: true },
  ],
  aggression: [
    { axis: "tension", weight: 0.35 },
    { axis: "energy", weight: 0.30 },
    { axis: "control", weight: 0.20, inv: true },
    { axis: "humanity", weight: 0.15, inv: true },
  ],
  warmth: [
    { axis: "temperature", weight: 0.45 },
    { axis: "humanity", weight: 0.30 },
    { axis: "intimacy", weight: 0.25 },
  ],
  melancholyTone: [
    { axis: "temporality", weight: 0.35 },
    { axis: "energy", weight: 0.25, inv: true },
    { axis: "density", weight: 0.20 },
    { axis: "intimacy", weight: 0.20 },
  ],
  openness: [
    { axis: "clarity", weight: 0.30 },
    { axis: "density", weight: 0.30, inv: true },
    { axis: "movement", weight: 0.20 },
    { axis: "temperature", weight: 0.20 },
  ],
  instability: [
    { axis: "tension", weight: 0.40 },
    { axis: "control", weight: 0.35, inv: true },
    { axis: "movement", weight: 0.15 },
    { axis: "clarity", weight: 0.10, inv: true },
  ],
  ambiguity: [
    { axis: "clarity", weight: 0.45, inv: true },
    { axis: "tension", weight: 0.25 },
    { axis: "control", weight: 0.20, inv: true },
    { axis: "humanity", weight: 0.10 },
  ],
  intimacyPull: [
    { axis: "intimacy", weight: 0.45 },
    { axis: "humanity", weight: 0.30 },
    { axis: "temperature", weight: 0.15 },
    { axis: "energy", weight: 0.10, inv: true },
  ],
};

// ─── Extended vector ──────────────────────────────────────────────────────────
export type AxisName = (typeof BASE_AXES)[number] | CompositeAxis;

export type ResonanceVector = Record<AxisName, number>; // each value normalized 0..1

/** Convert a `ResonanceAxes` (0..100) into a base 0..1 vector. */
function normalizeBase(r: ResonanceAxes): Record<(typeof BASE_AXES)[number], number> {
  return {
    energy:      r.energy / 100,
    temperature: r.temperature / 100,
    tension:     r.tension / 100,
    density:     r.density / 100,
    movement:    r.movement / 100,
    temporality: r.temporality / 100,
    humanity:    r.humanity / 100,
    clarity:     r.clarity / 100,
    intimacy:    r.intimacy / 100,
    control:     r.control / 100,
  };
}

/**
 * Build the full resonance vector (10 base + 12 composite) for an entity.
 */
export function buildVector(r: ResonanceAxes): ResonanceVector {
  const base = normalizeBase(r);
  const vec: Partial<ResonanceVector> = { ...base };

  for (const axis of COMPOSITE_AXES) {
    let v = 0;
    let totalW = 0;
    for (const { axis: srcAxis, weight, inv } of COMPOSITE_RECIPES[axis]) {
      const srcVal = base[srcAxis];
      v += (inv ? 1 - srcVal : srcVal) * weight;
      totalW += weight;
    }
    vec[axis] = clamp01(v / totalW);
  }
  return vec as ResonanceVector;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

// ─── Similarity ───────────────────────────────────────────────────────────────

/**
 * Cosine similarity between two vectors. Returns a value in [-1, 1] but in
 * practice (since our values are 0..1) lives in [0, 1].
 */
export function cosineSimilarity(a: ResonanceVector, b: ResonanceVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const key of [...BASE_AXES, ...COMPOSITE_AXES] as AxisName[]) {
    const av = a[key];
    const bv = b[key];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Euclidean distance in the full vector space — useful for "anomaly"
 * detection where we want pairs that are far apart globally but share a
 * single dimension strongly.
 */
export function euclideanDistance(a: ResonanceVector, b: ResonanceVector): number {
  let sum = 0;
  for (const key of [...BASE_AXES, ...COMPOSITE_AXES] as AxisName[]) {
    const d = a[key] - b[key];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// ─── Axis overlap (interpretability) ──────────────────────────────────────────

export interface AxisOverlap {
  axis: AxisName;
  /** Min of the two values — high means BOTH share this axis strongly. */
  shared: number;
  /** Absolute gap — high means STRONG DISAGREEMENT on this axis. */
  gap: number;
}

/**
 * For two vectors, return the axes ranked by shared strength (top axes that
 * BOTH have high values on) and by gap (axes where they disagree most).
 * Used to label why two entities resonate, and what tension they hold.
 */
export function axisOverlap(a: ResonanceVector, b: ResonanceVector): {
  shared: AxisOverlap[];
  tensions: AxisOverlap[];
} {
  const overlaps: AxisOverlap[] = [];
  for (const axis of [...BASE_AXES, ...COMPOSITE_AXES] as AxisName[]) {
    const av = a[axis];
    const bv = b[axis];
    overlaps.push({
      axis,
      shared: Math.min(av, bv),
      gap: Math.abs(av - bv),
    });
  }
  return {
    shared: [...overlaps].sort((x, y) => y.shared - x.shared).slice(0, 6),
    tensions: [...overlaps].sort((x, y) => y.gap - x.gap).slice(0, 4),
  };
}

// ─── Human-readable axis labels ───────────────────────────────────────────────

export const AXIS_LABEL_ES: Record<AxisName, string> = {
  // Base
  energy:        "energía",
  temperature:   "temperatura",
  tension:       "tensión",
  density:       "densidad",
  movement:      "movimiento",
  temporality:   "temporalidad",
  humanity:      "humanidad",
  clarity:       "claridad",
  intimacy:      "intimidad",
  control:       "control",
  // Composite — these are the most evocative for the UI
  softness:        "suavidad",
  fragility:       "fragilidad",
  silence:         "silencio",
  rituality:       "ritualidad",
  sacredness:      "sacralidad",
  aggression:      "agresividad",
  warmth:          "calidez",
  melancholyTone:  "tono melancólico",
  openness:        "apertura",
  instability:     "inestabilidad",
  ambiguity:       "ambigüedad",
  intimacyPull:    "atracción íntima",
};
