/**
 * Stable, one-to-one emotion → font assignment, per typographic role.
 *
 * Same problem as colour: the cosine-based picker collapses similar
 * emotions to identical fonts (all classical-serif emotions land on
 * Cormorant or EB Garamond) when the catalogue actually holds 91
 * distinct typographic voices.
 *
 * Strategy: for each role (display/body/literary/technical), build a
 * pool of catalogue fonts that fit the role's structural register, then
 * assign each of the 72 canonical emotions a UNIQUE font from that
 * pool. Most-extreme emotions pick first.
 *
 * Result: amor's display font is different from gratitud's, which is
 * different from ternura's, etc. The whole template re-typesets
 * meaningfully per emotion, not just for the title.
 */

import { EMOTIONS } from "@/data/ontology/emotions";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { buildVector, cosineSimilarity } from "./resonance-vector";
import type { ResonanceAxes, TypographyResonance } from "@/types";

type Role = "display" | "body" | "literary" | "technical";
type Category = TypographyResonance["category"];

const ROLE_POOL: Record<Role, Category[]> = {
  display:   ["display", "serif", "handwriting"],
  body:      ["serif", "sans-serif"],
  literary:  ["handwriting", "serif"],
  technical: ["monospace", "sans-serif"],
};

function centroid(vs: Array<{ resonance: ResonanceAxes }>): ResonanceAxes {
  const sum: ResonanceAxes = { energy: 0, temperature: 0, tension: 0, density: 0, movement: 0, temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0 };
  for (const v of vs) for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) sum[k] += v.resonance[k];
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

function buildRoleAssignment(role: Role): Map<string, TypographyResonance> {
  const pool = TYPOGRAPHY
    .filter((t) => ROLE_POOL[role].includes(t.category))
    .map((t) => ({ font: t, vec: buildVector(t.resonance) }));

  const out = new Map<string, TypographyResonance>();
  const claimed = new Set<string>();

  const emoCentroid = centroid(EMOTIONS);
  const ordered = [...EMOTIONS]
    .map((e) => ({ e, dist: distanceFromCentroid(e.resonance, emoCentroid) }))
    .sort((a, b) => b.dist - a.dist)
    .map((x) => x.e);

  for (const emotion of ordered) {
    const evec = buildVector(emotion.resonance);
    let best: typeof pool[number] | null = null;
    let bestSim = -Infinity;
    for (const p of pool) {
      if (claimed.has(p.font.id)) continue;
      const sim = cosineSimilarity(evec, p.vec);
      if (sim > bestSim) { bestSim = sim; best = p; }
    }
    if (best) {
      out.set(emotion.id, best.font);
      claimed.add(best.font.id);
    }
  }

  // When the pool is smaller than the emotion count (e.g. only 10 mono
  // fonts but 72 emotions), late-claim emotions get nothing — fall back
  // by rotating the pool so they at least get DIFFERENT fonts than their
  // close neighbours.
  if (out.size < EMOTIONS.length) {
    const allFonts = pool.map((p) => p.font);
    let i = 0;
    for (const e of ordered) {
      if (out.has(e.id) || allFonts.length === 0) continue;
      // Fingerprint-based fallback so even reused fonts spread out
      out.set(e.id, allFonts[i % allFonts.length]);
      i++;
    }
  }
  return out;
}

const _assignments: Record<Role, Map<string, TypographyResonance>> = {
  display:   buildRoleAssignment("display"),
  body:      buildRoleAssignment("body"),
  literary:  buildRoleAssignment("literary"),
  technical: buildRoleAssignment("technical"),
};

export interface EmotionTypeSet {
  display: TypographyResonance | null;
  body: TypographyResonance | null;
  literary: TypographyResonance | null;
  technical: TypographyResonance | null;
}

export function emotionTypeSet(emotionId: string): EmotionTypeSet {
  return {
    display:   _assignments.display.get(emotionId)   ?? null,
    body:      _assignments.body.get(emotionId)      ?? null,
    literary:  _assignments.literary.get(emotionId)  ?? null,
    technical: _assignments.technical.get(emotionId) ?? null,
  };
}
