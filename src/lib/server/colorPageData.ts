/**
 * Server-only data assembly for /color/[id]. Same recipe as the
 * emotion / clan / tribe pages.
 */

import type {
  ColorResonance,
  Emotion,
  Artwork,
  TypographyResonance,
} from "@/types";
import { COLOR_MAP, COLORS } from "@/data/colors/colorResonance";
import { EMOTIONS } from "@/data/ontology/emotions";
import { ARTWORKS } from "@/data/seed/artworks";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { derivePresentation, type PresentationBundle } from "./derivePresentation";

export interface ColorPageData {
  color: ColorResonance;
  primaryEmotions: Emotion[];
  contradictoryEmotions: Emotion[];
  resonantEmotions: Emotion[];
  resonantArtworks: Artwork[];
  resonantFonts: TypographyResonance[];
  /** Trimmed neighboring colors in the appreciated-rank ordering. */
  prev: { id: string; nameEs: string; hex: string } | null;
  next: { id: string; nameEs: string; hex: string } | null;
  presentation: PresentationBundle;
}

export function getColorPageData(id: string): ColorPageData | null {
  const color = COLOR_MAP.get(id);
  if (!color) return null;

  const primaryEmotions = color.primaryEmotions
    .map((eId) => EMOTIONS.find((e) => e.id === eId))
    .filter((e): e is Emotion => Boolean(e));

  const contradictoryEmotions = color.contradictoryEmotions
    .map((eId) => EMOTIONS.find((e) => e.id === eId))
    .filter((e): e is Emotion => Boolean(e));

  const resonantEmotions = EMOTIONS.filter(
    (e) => e.colorResonance.includes(color.id) && !color.primaryEmotions.includes(e.id),
  );

  const resonantArtworks = ARTWORKS.filter((a) => a.colorResonance.includes(color.id));

  const primaryEmotionIds = new Set(color.primaryEmotions);
  const resonantFonts = TYPOGRAPHY.filter((f) =>
    f.emotionResonance.some((e) => primaryEmotionIds.has(e)),
  );

  // Prev/next in the appreciated-rank ordering (catalogue display order).
  const ordered = [...COLORS].sort(
    (a, b) => (a.appreciatedRank ?? 99) - (b.appreciatedRank ?? 99),
  );
  const idx = ordered.findIndex((c) => c.id === color.id);
  const trim = (c: ColorResonance | undefined) =>
    c ? { id: c.id, nameEs: c.nameEs, hex: c.hex } : null;
  const prev = idx > 0 ? trim(ordered[idx - 1]) : null;
  const next = idx >= 0 && idx < ordered.length - 1 ? trim(ordered[idx + 1]) : null;

  const presentation = derivePresentation(color.resonance, {
    assignmentId: color.id,
    paletteLimit: 12,
    excludeIds: [color.id],
  });

  return {
    color,
    primaryEmotions,
    contradictoryEmotions,
    resonantEmotions,
    resonantArtworks,
    resonantFonts,
    prev,
    next,
    presentation,
  };
}
