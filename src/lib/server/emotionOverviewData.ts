/**
 * Server-only data assembly for the SLIM /emotion/[slug] overview.
 *
 * Why this exists separately from `getEmotionPageData`
 * ─────────────────────────────────────────────────────
 * `emotionPageData.ts` returns everything: 11 cultural sections,
 * EmergentResonance hits per mode, PathwayDrift candidates, plural
 * readings options, etc. Rendering all of it produced ~280 KB First
 * Load JS and ~350 KB HTML per emotion page, plus a fan-out of client
 * islands hydrating in parallel — exactly the surface that "se pasma"
 * (freezes) reported by the user.
 *
 * The new architecture: the default `/emotion/[slug]` route is just
 * the *overview*. Deep views (cultural / resonance / plural) live at
 * sub-routes and are paid for only when the visitor asks. Most page-
 * loads see only the overview, which now ships:
 *
 *   - Hero (title in emergent font, etymology, description, poetic)
 *   - Chromatic recipe summary (with link to the deep breakdown)
 *   - Emergent palette (16-colour swatch row)
 *   - Tribal transitions
 *   - "Related emotions" constellation
 *   - Save-to-collection + atmosphere CTAs
 *
 * What it deliberately does NOT compute:
 *   - The 11 `related*` cultural arrays
 *   - EmergentResonance hits across 4 modes × 12 entries
 *   - PathwayDrift initial candidates
 *   - ParticipationOptions
 *   - Pre-computed lens-shifted resolutions (those are tiny anyway)
 */

import type {
  Emotion,
  Tribe,
  Clan,
  ColorResonance,
  TypographyResonance,
} from "@/types";
import { EMOTION_MAP } from "@/data/ontology/emotions";
import { TRIBE_MAP, TRIBES } from "@/data/ontology/tribes";
import { CLAN_MAP } from "@/data/ontology/clans";
import { COLOR_MAP } from "@/data/colors/colorResonance";
import { FONT_MAP } from "@/data/typography/fonts";
import { emotionRecipe, type ColorRecipe } from "@/lib/chromatics";
import { deriveBehavior, behaviorCssVars, type EmotionBehavior } from "@/lib/behavior";
import { deriveTypeSet, typeSetToCssVars, type EmotionTypeSet } from "@/lib/typeset";
import { deriveTexture, type EmotionTexture } from "@/lib/emotionTexture";
import { inkVars, blendHex } from "@/lib/contrast";
import { emotionMotion, motionCssVars } from "@/lib/emotionMotion";
import type { MotionPattern } from "@/data/motion/patterns";
import { resonateFrom } from "@/lib/resonance-engine";
import type { CSSProperties } from "react";
import type {
  RelatedEmotionRef,
  TransitionRef,
} from "./emotionPageData";

export interface EmotionOverviewData {
  emotion: Emotion;
  tribe: Tribe;
  clan: Clan | null;

  // Visual presentation (shared with all sub-routes).
  recipe: ColorRecipe;
  behavior: EmotionBehavior;
  behaviorVars: CSSProperties;
  typeSet: EmotionTypeSet;
  typeVars: Record<string, string>;
  texture: EmotionTexture;
  inkOverrides: Record<string, string>;
  motionPattern: MotionPattern | null;
  motionVars: Record<string, string>;
  titleFontFamily: string;
  isNervous: boolean;

  // Overview-specific lightweight data.
  relatedColors: ColorResonance[];
  relatedFonts: TypographyResonance[];
  emergentPalette: ColorResonance[];
  relatedEmotions: RelatedEmotionRef[];
  transitions: TransitionRef[];
}

const TRIBE_COLOR_BY_ID: Record<string, string> = Object.fromEntries(
  TRIBES.map((t) => [t.id, t.color]),
);

export function getEmotionOverviewData(emotionId: string): EmotionOverviewData | null {
  const emotion = EMOTION_MAP.get(emotionId);
  if (!emotion) return null;
  const tribe = TRIBE_MAP.get(emotion.tribe);
  if (!tribe) return null;
  const clan = CLAN_MAP.get(emotion.clan) ?? null;
  const tribeColor = tribe.color;

  const recipe = emotionRecipe(emotion, tribeColor);
  const behavior = deriveBehavior(emotion.resonance);
  const behaviorVars = behaviorCssVars(behavior);
  const typeSet = deriveTypeSet(emotion.resonance, emotion.id);
  const typeVars = typeSetToCssVars(typeSet);
  const titleFontFamily = typeSet.display?.googleFontFamily ?? "Cormorant Garamond";

  const emergentPalette = resonateFrom(emotion.resonance, {
    kinds: ["color"],
    limit: 16,
    mode: "expected",
  })
    .map((h) => COLOR_MAP.get(h.entity.id))
    .filter((c): c is ColorResonance => Boolean(c));

  const texture = deriveTexture(emotion.resonance, emergentPalette);
  const effectiveBg = blendHex(texture.baseColor, texture.surfaceTint, 0.35);
  const inkOverrides = inkVars(effectiveBg);
  const motionPattern = emotionMotion(emotion.id) ?? null;
  const motionVars = motionPattern ? motionCssVars(motionPattern) : {};

  const isNervous =
    (emotion.resonance.tension / 100) * 0.6 +
      ((100 - emotion.resonance.control) / 100) * 0.4 >
    0.65;

  const pickFromMap = <T,>(ids: string[] | undefined, map: Map<string, T>): T[] => {
    if (!ids || ids.length === 0) return [];
    const out: T[] = [];
    for (const id of ids) {
      const v = map.get(id);
      if (v) out.push(v);
    }
    return out;
  };

  const relatedColors = pickFromMap(emotion.colorResonance, COLOR_MAP);
  const relatedFonts = pickFromMap(emotion.typographyResonance, FONT_MAP);

  const relatedEmotions: RelatedEmotionRef[] = [
    ...emotion.neighbors.map((id) => ({ id, rel: "neighbor" as const })),
    ...emotion.antonyms.map((id) => ({ id, rel: "antonym" as const })),
  ].flatMap(({ id, rel }) => {
    const e = EMOTION_MAP.get(id);
    if (!e) return [];
    return [{
      id,
      name: e.name,
      tribeColor: TRIBE_COLOR_BY_ID[e.tribe] ?? "#888",
      rel,
    }];
  });

  const transitions: TransitionRef[] = (emotion.transitions ?? []).flatMap((t) => {
    const target = EMOTION_MAP.get(t.to);
    if (!target) return [];
    return [{
      to: t.to,
      toName: target.name,
      toTribeColor: TRIBE_COLOR_BY_ID[target.tribe] ?? tribeColor,
      direction: t.direction,
      strength: t.strength,
      description: t.description,
    }];
  });

  return {
    emotion,
    tribe,
    clan,
    recipe,
    behavior,
    behaviorVars,
    typeSet,
    typeVars,
    texture,
    inkOverrides,
    motionPattern,
    motionVars,
    titleFontFamily,
    isNervous,
    relatedColors,
    relatedFonts,
    emergentPalette,
    relatedEmotions,
    transitions,
  };
}
