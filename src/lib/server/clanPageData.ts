/**
 * Server-only data assembly for /clan/[id]. Same recipe as
 * emotionPageData: page (RSC) → getClanPageData(id) → typed payload →
 * ClanView (client). The client View never imports the resonance
 * engine, chromatics, typeset, texture, or any seed catalogue.
 */

import type { Clan, Tribe, Emotion } from "@/types";
import { CLANS, CLAN_MAP } from "@/data/ontology/clans";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { EMOTIONS, EMOTION_MAP } from "@/data/ontology/emotions";
import { groupCentroidResonance } from "@/lib/resonance-engine";
import { emotionMotion } from "@/lib/emotionMotion";
import { derivePresentation, type PresentationBundle } from "./derivePresentation";

export interface ClanPageData {
  clan: Clan;
  tribe: Tribe;
  canonical: Emotion | null;
  clanEmotions: Emotion[];
  siblings: Clan[];
  prev: Clan | null;
  next: Clan | null;
  /** Same shape every editorial page consumes. */
  presentation: PresentationBundle;
}

export function getClanPageData(id: string): ClanPageData | null {
  const clan = CLAN_MAP.get(id);
  if (!clan) return null;
  const tribe = TRIBE_MAP.get(clan.tribe);
  if (!tribe) return null;
  const canonical = clan.canonicalEmotion ? (EMOTION_MAP.get(clan.canonicalEmotion) ?? null) : null;
  const clanEmotions = EMOTIONS.filter((e) => e.clan === clan.id);
  const siblings = CLANS.filter((c) => c.tribe === tribe.id);
  const idx = siblings.findIndex((c) => c.id === clan.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  // Centroid: average of all emotions in the clan, else the canonical
  // anchor's vector. Mirrors the previous client-side computation.
  const centroid = clanEmotions.length > 0
    ? groupCentroidResonance(clanEmotions)
    : (canonical?.resonance ?? groupCentroidResonance([]));

  // Motion prefers the canonical emotion's assigned pattern (so the
  // clan page moves like its anchor) and falls back to derive from the
  // centroid otherwise.
  const motionOverride = canonical ? (emotionMotion(canonical.id) ?? undefined) : undefined;

  const presentation = derivePresentation(centroid, {
    assignmentId: canonical?.id,
    paletteLimit: 12,
    excludeIds: [clan.id],
    motionPattern: motionOverride,
  });

  return {
    clan,
    tribe,
    canonical,
    clanEmotions,
    siblings,
    prev,
    next,
    presentation,
  };
}
