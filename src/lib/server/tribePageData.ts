/**
 * Server-only data assembly for /tribe/[slug]. Same recipe as the
 * emotion / clan pages.
 */

import type { Tribe, Clan, Emotion, TribeId } from "@/types";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { CLANS_BY_TRIBE } from "@/data/ontology/clans";
import { EMOTIONS } from "@/data/ontology/emotions";
import { groupCentroidResonance } from "@/lib/resonance-engine";
import { derivePresentation, type PresentationBundle } from "./derivePresentation";

export interface TribePageData {
  tribe: Tribe;
  clans: Clan[];
  emotions: Emotion[];
  presentation: PresentationBundle;
}

export function getTribePageData(slug: string): TribePageData | null {
  const tribe = TRIBE_MAP.get(slug as TribeId);
  if (!tribe) return null;
  const clans = CLANS_BY_TRIBE[tribe.id] ?? [];
  const emotions = EMOTIONS.filter((e) => e.tribe === tribe.id);

  // Centroid of all emotions in the tribe — falls back to an empty
  // centroid (returns canonical mid-axis vector) when the tribe is
  // empty so derivePresentation always has something to work with.
  const centroid = emotions.length > 0
    ? groupCentroidResonance(emotions)
    : groupCentroidResonance([]);

  const presentation = derivePresentation(centroid, {
    paletteLimit: 14,
    excludeIds: [tribe.id],
  });

  return {
    tribe,
    clans,
    emotions,
    presentation,
  };
}
