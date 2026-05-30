/**
 * Server-only data assembly for the /emotion/[slug] page.
 *
 * Why this exists
 * ───────────────
 * The previous `EmotionDetail` (client component) imported every seed
 * catalogue directly: ~30k lines of cultural data + the resonance engine
 * + chromatics + typeset + motion catalogue. All of it shipped to the
 * browser even though most of it was used to compute a handful of values
 * that are 100% deterministic from the emotion id.
 *
 * This module is `import "server-only"` — Next.js will fail the build if
 * a client component pulls it in. That guarantee lets us depend on the
 * heavy catalogues here without leaking them to the bundle.
 *
 * The strategy
 * ────────────
 * Page (RSC) → getEmotionPageData(id) → typed payload → EmotionDetail
 * (client). EmotionDetail no longer imports any of the heavy modules;
 * it just renders the payload. Adding a 12th cultural discipline costs
 * zero client JS — only the payload field grows.
 *
 * Lens-aware re-derivation (when a visitor pins a perspective) is
 * intentionally out of scope here: the bulk of pages render canonical,
 * and the small minority that need live visual shift can opt back in
 * via a future lazy-loaded "lens engine" chunk. Lens-driven TEXT shifts
 * (description / poeticIntro / etc.) still work through the lightweight
 * `resolveEmotion` adapter which is bundled with the editorial client.
 */

// NOTE: this module is intended for server use only (RSC + build-time).
// We avoid the `server-only` package to keep the dependency tree small;
// the guarantee comes from no client component importing this path.

import type {
  Emotion,
  Tribe,
  Clan,
  ResonanceAxes,
  ColorResonance,
  TypographyResonance,
  Artwork,
  Track,
  Film,
  Poem,
  Sculpture,
  Dance,
  Architecture,
  Photography,
  Literature,
  Ritual,
  Theater,
} from "@/types";
import { EMOTION_MAP } from "@/data/ontology/emotions";
import { TRIBE_MAP, TRIBES } from "@/data/ontology/tribes";
import { CLAN_MAP } from "@/data/ontology/clans";
import { COLOR_MAP } from "@/data/colors/colorResonance";
import { FONT_MAP } from "@/data/typography/fonts";
import { ARTWORK_MAP } from "@/data/seed/artworks";
import { TRACK_MAP } from "@/data/seed/music";
import { FILM_MAP } from "@/data/seed/films";
import { POEM_MAP } from "@/data/seed/poetry";
import { SCULPTURE_MAP } from "@/data/seed/sculpture";
import { DANCE_MAP } from "@/data/seed/dance";
import { ARCHITECTURE_MAP } from "@/data/seed/architecture";
import { PHOTOGRAPHY_MAP } from "@/data/seed/photography";
import { LITERATURE_MAP } from "@/data/seed/literature";
import { RITUAL_MAP } from "@/data/seed/ritual";
import { THEATER_MAP } from "@/data/seed/theater";
import { emotionRecipe, type ColorRecipe } from "@/lib/chromatics";
import { deriveBehavior, behaviorCssVars, type EmotionBehavior } from "@/lib/behavior";
import { deriveTypeSet, typeSetToCssVars, type EmotionTypeSet } from "@/lib/typeset";
import { deriveTexture, type EmotionTexture } from "@/lib/emotionTexture";
import { inkVars, blendHex } from "@/lib/contrast";
import { emotionMotion, motionCssVars } from "@/lib/emotionMotion";
import type { MotionPattern } from "@/data/motion/patterns";
import {
  resonateFrom,
  queryResonance,
  type ResonanceHit,
  type ResonanceMode,
} from "@/lib/resonance-engine";
import { buildVector } from "@/lib/resonance-vector";
import { COLORS } from "@/data/colors/colorResonance";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { EMOTIONS } from "@/data/ontology/emotions";
import type { CSSProperties } from "react";

/** A resonance hit trimmed for transport — the full `vector` arrays
 * are stripped (no client renders them; they'd waste payload).
 * `entity.id` is enough for the client to re-resolve if it ever lazy-
 * loads the engine for follow-up queries. */
export interface SerialisableHit {
  entity: {
    id: string;
    kind: string;
    label: string;
    creator?: string;
    year?: string | number;
    description?: string;
    imageUrl?: string;
    href?: string;
  };
  similarity: number;
  mode: "expected" | "adjacent" | "anomaly";
  sharedAxes: Array<{ axis: string; shared: number }>;
  tensionAxes: Array<{ axis: string; shared: number }>;
}

/** Pre-computed EmergentResonance hits, one bucket per mode. The client
 * component just reads from these — no engine import. */
export interface EmergentHitsByMode {
  mixed: SerialisableHit[];
  expected: SerialisableHit[];
  adjacent: SerialisableHit[];
  anomaly: SerialisableHit[];
}

/** Initial PathwayDrift candidates (one per band). After the first
 * click, PathwayDrift lazy-loads the resonance engine to compute the
 * next hop — that cost is deferred to actual interaction. */
export interface PathwayCandidate {
  id: string;
  kind: string;
  label: string;
  creator?: string;
  year?: string | number;
  fromMode: "expected" | "adjacent" | "anomaly";
}

/** Trimmed entries used by ParticipationModule voting options — keeps
 * the module's client chunk free of COLORS/TYPOGRAPHY/EMOTIONS imports. */
export interface ParticipationOptions {
  colors: Array<{ id: string; nameEs: string; hex: string }>;
  typographies: Array<{ id: string; name: string; googleFontFamily: string }>;
  transitions: Array<{ to: string; toName: string; description: string }>;
}

/** Trimmed neighbor/antonym entry. */
export interface RelatedEmotionRef {
  id: string;
  name: string;
  tribeColor: string;
  rel: "neighbor" | "antonym";
}

/** Trimmed transition target. */
export interface TransitionRef {
  to: string;
  toName: string;
  toTribeColor: string;
  direction: string;
  strength: number;
  description: string;
}

export interface EmotionPageData {
  emotion: Emotion;
  tribe: Tribe;
  clan: Clan | null;

  // Pre-derived visual recipe + supporting CSS variable bundles.
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

  // Cultural neighborhood — full domain objects so the JSX renders directly.
  relatedColors: ColorResonance[];
  relatedFonts: TypographyResonance[];
  emergentPalette: ColorResonance[];
  relatedArtworks: Artwork[];
  relatedTracks: Track[];
  relatedFilms: Film[];
  relatedPoems: Poem[];
  relatedSculptures: Sculpture[];
  relatedDances: Dance[];
  relatedArchitectures: Architecture[];
  relatedPhotographs: Photography[];
  relatedLiterature: Literature[];
  relatedRituals: Ritual[];
  relatedTheater: Theater[];

  // Relational refs (trimmed).
  relatedEmotions: RelatedEmotionRef[];
  transitions: TransitionRef[];

  // Pre-computed resonance-engine output — the EmergentResonance and
  // PathwayDrift components no longer import the engine on the client.
  emergentHits: EmergentHitsByMode;
  pathwayInitialCandidates: PathwayCandidate[];
  participationOptions: ParticipationOptions;
}

const TRIBE_COLOR_BY_ID: Record<string, string> = Object.fromEntries(
  TRIBES.map((t) => [t.id, t.color]),
);

function pickFromMap<T>(ids: string[] | undefined, map: Map<string, T>): T[] {
  if (!ids || ids.length === 0) return [];
  const out: T[] = [];
  for (const id of ids) {
    const v = map.get(id);
    if (v) out.push(v);
  }
  return out;
}

/**
 * Build the full server-rendered payload for an emotion page.
 *
 * All derivations are computed in canonical (lens-less) form — the
 * vast majority of visitors land without a pinned perspective and get
 * the cached static HTML. Pages that DO shift under a lens still
 * resolve text content via the lightweight claims adapter on the
 * client; visual derivations stay canonical for this slice.
 */
export function getEmotionPageData(emotionId: string): EmotionPageData | null {
  const emotion = EMOTION_MAP.get(emotionId);
  if (!emotion) return null;
  const tribe = TRIBE_MAP.get(emotion.tribe);
  if (!tribe) return null;
  const clan = CLAN_MAP.get(emotion.clan) ?? null;
  const tribeColor = tribe.color;

  // Visual derivations — same calls EmotionDetail used to make under
  // useMemo, but now executed once at request time on the server.
  const recipe = emotionRecipe(emotion, tribeColor);
  const behavior = deriveBehavior(emotion.resonance);
  const behaviorVars = behaviorCssVars(behavior);
  const typeSet = deriveTypeSet(emotion.resonance, emotion.id);
  const typeVars = typeSetToCssVars(typeSet);
  const titleFontFamily = typeSet.display?.googleFontFamily ?? "Cormorant Garamond";

  // Top-16 emergent colors by vector similarity, materialised to full
  // ColorResonance entries (the JSX needs `hex` / `nameEs` / `id`).
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

  // Cultural neighborhoods — each is a small slice (~5-20 items) of
  // the corresponding catalogue. Total payload stays well under 100 KB
  // gzipped per page.
  const relatedColors = pickFromMap<ColorResonance>(emotion.colorResonance, COLOR_MAP);
  const relatedFonts = pickFromMap<TypographyResonance>(emotion.typographyResonance, FONT_MAP);
  const relatedArtworks = pickFromMap<Artwork>(emotion.artworkResonance, ARTWORK_MAP);
  // Same recipe as films: Marina's 3 curated picks anchor each
  // emotion's lineup, then the resonance engine fills the remaining
  // slots from the FULL ~93-track catalogue. Removes the old
  // "Mahler-on-every-page" effect now that the pool is six times
  // bigger and covers Latin / African / Asian / hip-hop / electronic.
  const trackEnginePicks = resonateFrom(emotion.resonance, {
    kinds: ["music"],
    limit: 10,
    mode: "expected",
    excludeIds: [emotion.id],
  });
  const trackCurated = pickFromMap<Track>(emotion.musicResonance, TRACK_MAP);
  const seenT = new Set<string>(trackCurated.map((t) => t.id));
  const trackFill: Track[] = [];
  for (const hit of trackEnginePicks) {
    if (seenT.has(hit.entity.id)) continue;
    const t = TRACK_MAP.get(hit.entity.id);
    if (!t) continue;
    trackFill.push(t);
    seenT.add(t.id);
    if (trackCurated.length + trackFill.length >= 6) break;
  }
  const relatedTracks = [...trackCurated.slice(0, 3), ...trackFill].slice(0, 6);
  // Films were the worst case of catalogue starvation: with only 16
  // curated entries for 72 emotions, each film ended up shared by 5-6
  // emotions and "2001: A Space Odyssey" appeared on nearly every page.
  // We now compute the top-6 films per emotion via the resonance engine
  // over the full catalogue (~84 entries after the diversity expansion
  // in films-extended.ts). The static `emotion.filmResonance` array is
  // honoured as a curatorial bias: any film Marina explicitly pinned
  // for this emotion gets pulled to the front, and the engine fills
  // the rest. Result: each emotion gets a unique-feeling lineup that
  // still respects Marina's verified pairings.
  const enginePicks = resonateFrom(emotion.resonance, {
    kinds: ["film"],
    limit: 10,
    mode: "expected",
    excludeIds: [emotion.id],
  });
  const seen = new Set<string>();
  const curatedFront = pickFromMap<Film>(emotion.filmResonance, FILM_MAP);
  for (const c of curatedFront) seen.add(c.id);
  const engineFill: Film[] = [];
  for (const hit of enginePicks) {
    if (seen.has(hit.entity.id)) continue;
    const f = FILM_MAP.get(hit.entity.id);
    if (!f) continue;
    engineFill.push(f);
    seen.add(f.id);
    if (curatedFront.length + engineFill.length >= 6) break;
  }
  const relatedFilms = [...curatedFront.slice(0, 3), ...engineFill].slice(0, 6);
  const relatedPoems = pickFromMap<Poem>(emotion.poetryResonance, POEM_MAP);
  const relatedSculptures = pickFromMap<Sculpture>(emotion.sculptureResonance, SCULPTURE_MAP);
  const relatedDances = pickFromMap<Dance>(emotion.danceResonance, DANCE_MAP);
  const relatedArchitectures = pickFromMap<Architecture>(emotion.architectureResonance, ARCHITECTURE_MAP);
  const relatedPhotographs = pickFromMap<Photography>(emotion.photographyResonance, PHOTOGRAPHY_MAP);
  const relatedLiterature = pickFromMap<Literature>(emotion.literatureResonance, LITERATURE_MAP);
  const relatedRituals = pickFromMap<Ritual>(emotion.ritualResonance, RITUAL_MAP);
  const relatedTheater = pickFromMap<Theater>(emotion.theaterResonance, THEATER_MAP);

  // Relational neighbors — trimmed to the fields the JSX actually
  // touches so we don't ship full emotion objects we won't render.
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

  // ─── Pre-compute resonance-engine output ────────────────────────────
  // Top-12 hits per mode so the EmergentResonance UI can switch modes
  // without re-querying the engine on the client.
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

  const queryHits = (mode: ResonanceMode) =>
    resonateFrom(emotion.resonance, {
      mode,
      excludeIds: [emotion.id],
      limit: 12,
    }).map(trimHit);

  const emergentHits: EmergentHitsByMode = {
    mixed: queryHits("mixed"),
    expected: queryHits("expected"),
    adjacent: queryHits("adjacent"),
    anomaly: queryHits("anomaly"),
  };

  // Initial PathwayDrift candidates: one expected + one adjacent + one
  // anomaly, each preferring cross-discipline picks (the original UX).
  const pathwayQueryVector = buildVector(emotion.resonance);
  const pickInitial = (mode: "expected" | "adjacent" | "anomaly"): PathwayCandidate | null => {
    const hits = queryResonance(pathwayQueryVector, {
      mode,
      excludeIds: [emotion.id],
      limit: 8,
    });
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
  const pathwayInitialCandidates: PathwayCandidate[] = (
    [pickInitial("expected"), pickInitial("adjacent"), pickInitial("anomaly")]
      .filter((c): c is PathwayCandidate => c !== null)
  );
  // De-duplicate (a tiny catalogue could yield the same top hit in
  // adjacent and anomaly buckets).
  const seenIds = new Set<string>();
  const pathwayInitialCandidatesDeduped = pathwayInitialCandidates.filter((c) => {
    if (seenIds.has(c.id)) return false;
    seenIds.add(c.id);
    return true;
  });

  // ─── Pre-trimmed participation options ──────────────────────────────
  // Replaces ParticipationModule's COLORS / TYPOGRAPHY / EMOTIONS imports
  // with a small server-supplied list.
  const participationOptions: ParticipationOptions = {
    colors: COLORS.slice(0, 4).map((c) => ({
      id: c.id,
      nameEs: c.nameEs,
      hex: c.hex,
    })),
    typographies: TYPOGRAPHY.slice(0, 4).map((t) => ({
      id: t.id,
      name: t.name,
      googleFontFamily: t.googleFontFamily,
    })),
    transitions: (emotion.transitions ?? []).flatMap((t) => {
      const target = EMOTIONS.find((e) => e.id === t.to);
      if (!target) return [];
      return [{ to: t.to, toName: target.name, description: t.description }];
    }),
  };

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
    relatedArtworks,
    relatedTracks,
    relatedFilms,
    relatedPoems,
    relatedSculptures,
    relatedDances,
    relatedArchitectures,
    relatedPhotographs,
    relatedLiterature,
    relatedRituals,
    relatedTheater,
    relatedEmotions,
    transitions,
    emergentHits,
    pathwayInitialCandidates: pathwayInitialCandidatesDeduped,
    participationOptions,
  };
}
