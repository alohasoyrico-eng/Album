/**
 * Unified claim adapters for the 11 cultural disciplines.
 *
 * Each catalogue (artworks, music, films, poetry, sculpture, dance,
 * architecture, photography, literature, ritual, theater) gets a
 * generic claim adapter built from `makeClaimAdapter`. Every entity is
 * now claim-shaped — uniform data model across the entire ontology
 * + cultural layer.
 *
 * Phase 2 (participation backend) will push user / curator claims into
 * these adapters through a single `registerOverlay(kind, id, claims)`
 * channel.
 */

import { makeClaimAdapter, type ClaimAdapter, type CulturalEntity } from "@/lib/makeClaimAdapter";
import { ARTWORKS, ARTWORK_MAP } from "./artworks";
import { TRACKS, TRACK_MAP } from "./music";
import { FILMS, FILM_MAP } from "./films";
import { POEMS, POEM_MAP } from "./poetry";
import { SCULPTURES, SCULPTURE_MAP } from "./sculpture";
import { DANCES, DANCE_MAP } from "./dance";
import { ARCHITECTURES, ARCHITECTURE_MAP } from "./architecture";
import { PHOTOGRAPHS, PHOTOGRAPHY_MAP } from "./photography";
import { LITERATURES, LITERATURE_MAP } from "./literature";
import { RITUALS, RITUAL_MAP } from "./ritual";
import { THEATERS, THEATER_MAP } from "./theater";

// Each seed has a slightly different schema for its narrative field.
// The factory's `pick` hooks normalise that.

export const ARTWORK_ADAPTER = makeClaimAdapter({
  kind: "artwork",
  raw: ARTWORKS as unknown as CulturalEntity[],
  rawMap: ARTWORK_MAP as unknown as Map<string, CulturalEntity>,
});

export const MUSIC_ADAPTER = makeClaimAdapter({
  kind: "music",
  raw: TRACKS as unknown as CulturalEntity[],
  rawMap: TRACK_MAP as unknown as Map<string, CulturalEntity>,
  pick: {
    culture: (e) => {
      const t = e as unknown as { genre?: string[] };
      return Array.isArray(t.genre) ? t.genre.join(", ") : undefined;
    },
  },
});

export const FILM_ADAPTER = makeClaimAdapter({
  kind: "film",
  raw: FILMS as unknown as CulturalEntity[],
  rawMap: FILM_MAP as unknown as Map<string, CulturalEntity>,
  pick: {
    description: (e) => {
      const f = e as unknown as { overview?: string; description?: string };
      return f.overview ?? f.description;
    },
    culture: (e) => {
      const f = e as unknown as { genres?: string[] };
      return Array.isArray(f.genres) ? f.genres.join(", ") : undefined;
    },
  },
});

export const POEM_ADAPTER = makeClaimAdapter({
  kind: "poem",
  raw: POEMS as unknown as CulturalEntity[],
  rawMap: POEM_MAP as unknown as Map<string, CulturalEntity>,
  pick: {
    description: (e) => {
      const p = e as unknown as { excerpt?: string; fullText?: string };
      return p.excerpt ?? p.fullText;
    },
    culture: (e) => {
      const p = e as unknown as { language?: string };
      return p.language;
    },
  },
});

export const SCULPTURE_ADAPTER = makeClaimAdapter({
  kind: "sculpture",
  raw: SCULPTURES as unknown as CulturalEntity[],
  rawMap: SCULPTURE_MAP as unknown as Map<string, CulturalEntity>,
});

export const DANCE_ADAPTER = makeClaimAdapter({
  kind: "dance",
  raw: DANCES as unknown as CulturalEntity[],
  rawMap: DANCE_MAP as unknown as Map<string, CulturalEntity>,
});

export const ARCHITECTURE_ADAPTER = makeClaimAdapter({
  kind: "architecture",
  raw: ARCHITECTURES as unknown as CulturalEntity[],
  rawMap: ARCHITECTURE_MAP as unknown as Map<string, CulturalEntity>,
});

export const PHOTOGRAPHY_ADAPTER = makeClaimAdapter({
  kind: "photography",
  raw: PHOTOGRAPHS as unknown as CulturalEntity[],
  rawMap: PHOTOGRAPHY_MAP as unknown as Map<string, CulturalEntity>,
});

export const LITERATURE_ADAPTER = makeClaimAdapter({
  kind: "literature",
  raw: LITERATURES as unknown as CulturalEntity[],
  rawMap: LITERATURE_MAP as unknown as Map<string, CulturalEntity>,
});

export const RITUAL_ADAPTER = makeClaimAdapter({
  kind: "ritual",
  raw: RITUALS as unknown as CulturalEntity[],
  rawMap: RITUAL_MAP as unknown as Map<string, CulturalEntity>,
});

export const THEATER_ADAPTER = makeClaimAdapter({
  kind: "theater",
  raw: THEATERS as unknown as CulturalEntity[],
  rawMap: THEATER_MAP as unknown as Map<string, CulturalEntity>,
});

// ─── Unified dispatcher ────────────────────────────────────────────────

export type CulturalKind =
  | "artwork" | "music" | "film" | "poem"
  | "sculpture" | "dance" | "architecture" | "photography"
  | "literature" | "ritual" | "theater";

const ADAPTERS: Record<CulturalKind, ClaimAdapter<CulturalEntity>> = {
  artwork:      ARTWORK_ADAPTER as ClaimAdapter<CulturalEntity>,
  music:        MUSIC_ADAPTER as ClaimAdapter<CulturalEntity>,
  film:         FILM_ADAPTER as ClaimAdapter<CulturalEntity>,
  poem:         POEM_ADAPTER as ClaimAdapter<CulturalEntity>,
  sculpture:    SCULPTURE_ADAPTER as ClaimAdapter<CulturalEntity>,
  dance:        DANCE_ADAPTER as ClaimAdapter<CulturalEntity>,
  architecture: ARCHITECTURE_ADAPTER as ClaimAdapter<CulturalEntity>,
  photography:  PHOTOGRAPHY_ADAPTER as ClaimAdapter<CulturalEntity>,
  literature:   LITERATURE_ADAPTER as ClaimAdapter<CulturalEntity>,
  ritual:       RITUAL_ADAPTER as ClaimAdapter<CulturalEntity>,
  theater:      THEATER_ADAPTER as ClaimAdapter<CulturalEntity>,
};

export function resolveCultural(kind: CulturalKind, id: string, ctx?: import("@/types/claims").ReadContext) {
  return ADAPTERS[kind].resolve(id, ctx);
}

export function registerCulturalOverlay(
  kind: CulturalKind,
  id: string,
  claims: Partial<import("@/lib/makeClaimAdapter").CulturalClaims>,
) {
  return ADAPTERS[kind].registerOverlay(id, claims);
}

export function listCulturalLenses(kind: CulturalKind, id: string) {
  return ADAPTERS[kind].listLensesPresent(id);
}
