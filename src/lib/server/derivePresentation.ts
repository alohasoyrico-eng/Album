/**
 * Shared server-only derivation helper used by every editorial page
 * (emotion / clan / tribe / color). Takes a resonance vector and
 * returns the full visual presentation bundle plus pre-computed
 * resonance-engine output. Means the client View components never have
 * to import chromatics / typeset / texture / motion / engine — those
 * stay on the server.
 *
 * Why a single helper instead of inlining per page: every page used to
 * derive the same things from the same vector with subtly different
 * defaults, accumulating drift. One helper is one source of truth and
 * one place to update when the algorithm changes.
 */

import type { ResonanceAxes, ColorResonance } from "@/types";
import { COLOR_MAP } from "@/data/colors/colorResonance";
import { deriveTypeSet, typeSetToCssVars, type EmotionTypeSet } from "@/lib/typeset";
import { deriveTexture, type EmotionTexture } from "@/lib/emotionTexture";
import { inkVars, blendHex } from "@/lib/contrast";
import { deriveMotion, motionCssVars } from "@/lib/emotionMotion";
import type { MotionPattern } from "@/data/motion/patterns";
import {
  resonateFrom,
  queryResonance,
  type ResonanceHit,
  type ResonanceMode,
} from "@/lib/resonance-engine";
import { buildVector } from "@/lib/resonance-vector";
import type {
  SerialisableHit,
  EmergentHitsByMode,
  PathwayCandidate,
} from "./emotionPageData";
import type { CSSProperties } from "react";

export interface PresentationBundle {
  typeSet: EmotionTypeSet;
  typeVars: Record<string, string>;
  titleFontFamily: string;
  emergentPalette: ColorResonance[];
  texture: EmotionTexture;
  inkOverrides: Record<string, string>;
  motionPattern: MotionPattern;
  motionVars: CSSProperties;
  /** Top-12 hits per mode for EmergentResonance. */
  emergentHits: EmergentHitsByMode;
  /** First-step candidates for PathwayDrift. */
  pathwayInitialCandidates: PathwayCandidate[];
}

export interface PresentationOptions {
  /** Used by typeset to maintain per-entity stable font assignment when
   * an id exists in the assignment table (otherwise null is fine). */
  assignmentId?: string;
  /** Maximum colors in the emergent palette (default 12). */
  paletteLimit?: number;
  /** IDs to exclude from EmergentResonance + PathwayDrift candidates —
   * usually the current entity's own id so it doesn't hit against
   * itself. */
  excludeIds?: string[];
  /** Optional motion pattern to use instead of deriving from resonance
   * (e.g. when a canonical emotion has a pre-assigned pattern). */
  motionPattern?: MotionPattern;
}

const trimHit = (h: ResonanceHit): SerialisableHit => ({
  entity: {
    id: h.entity.id,
    kind: h.entity.kind,
    label: h.entity.label,
    creator: h.entity.creator,
    year: h.entity.year,
    description: h.entity.description,
    imageUrl: h.entity.imageUrl,
    href: h.entity.href,
  },
  similarity: h.similarity,
  mode: h.mode,
  sharedAxes: h.sharedAxes.map((a) => ({ axis: a.axis, shared: a.shared })),
  tensionAxes: h.tensionAxes.map((a) => ({ axis: a.axis, shared: a.shared })),
});

export function derivePresentation(
  resonance: ResonanceAxes,
  opts: PresentationOptions = {},
): PresentationBundle {
  const { assignmentId, paletteLimit = 12, excludeIds = [], motionPattern: motionOverride } = opts;

  const typeSet = deriveTypeSet(resonance, assignmentId);
  const typeVars = typeSetToCssVars(typeSet);
  const titleFontFamily = typeSet.display?.googleFontFamily ?? "Cormorant Garamond";

  const emergentPalette = resonateFrom(resonance, {
    kinds: ["color"],
    limit: paletteLimit,
    mode: "expected",
  })
    .map((h) => COLOR_MAP.get(h.entity.id))
    .filter((c): c is ColorResonance => Boolean(c));

  const texture = deriveTexture(resonance, emergentPalette);
  const effectiveBg = blendHex(texture.baseColor, texture.surfaceTint, 0.35);
  const inkOverrides = inkVars(effectiveBg);

  const motionPattern = motionOverride ?? deriveMotion(resonance);
  const motionVars = motionCssVars(motionPattern);

  // EmergentResonance — top-12 hits per mode
  const queryHits = (mode: ResonanceMode) =>
    resonateFrom(resonance, {
      mode,
      excludeIds,
      limit: 12,
    }).map(trimHit);

  const emergentHits: EmergentHitsByMode = {
    mixed: queryHits("mixed"),
    expected: queryHits("expected"),
    adjacent: queryHits("adjacent"),
    anomaly: queryHits("anomaly"),
  };

  // PathwayDrift — initial cross-discipline candidates
  const vec = buildVector(resonance);
  const pickInitial = (mode: "expected" | "adjacent" | "anomaly"): PathwayCandidate | null => {
    const hits = queryResonance(vec, { mode, excludeIds, limit: 8 });
    const cross = hits.find((h) => h.entity.kind !== "emotion");
    const chosen = (cross ?? hits[0])?.entity;
    if (!chosen) return null;
    return {
      id: chosen.id,
      kind: chosen.kind,
      label: chosen.label,
      creator: chosen.creator,
      year: chosen.year,
      fromMode: mode,
    };
  };
  const seen = new Set<string>();
  const pathwayInitialCandidates: PathwayCandidate[] = (["expected", "adjacent", "anomaly"] as const)
    .map(pickInitial)
    .filter((c): c is PathwayCandidate => c !== null)
    .filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

  return {
    typeSet,
    typeVars,
    titleFontFamily,
    emergentPalette,
    texture,
    inkOverrides,
    motionPattern,
    motionVars,
    emergentHits,
    pathwayInitialCandidates,
  };
}
