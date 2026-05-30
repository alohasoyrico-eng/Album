// ─── Resonance Axes ───────────────────────────────────────────────────────────

export interface ResonanceAxes {
  energy: number;       // 0–100: dormant → explosive
  temperature: number;  // 0–100: glacial → incandescent
  tension: number;      // 0–100: released → taut
  density: number;      // 0–100: airy → dense
  movement: number;     // 0–100: still → kinetic
  temporality: number;  // 0–100: timeless → ephemeral
  humanity: number;     // 0–100: abstract → deeply human
  clarity: number;      // 0–100: obscure → crystalline
  intimacy: number;     // 0–100: distant → intimate
  control: number;      // 0–100: chaotic → controlled
}

// ─── Emotional Ontology ───────────────────────────────────────────────────────

// 22 tribes from Marina's ontology (each = a phenomenological experience type)
export type TribeId =
  | "impulso"              // I — necesidad / motivación
  | "aversion-fisica"      // II — asco
  | "vitalidad"            // III — propia energía
  | "falta-vitalidad"      // IV — ausencia de energía
  | "cambio-negativo"      // V — alteración / desasosiego
  | "inseguridad"          // VI — falta de recursos cognitivos
  | "alivio"               // VII — disminución de alteración
  | "ausencia"             // VIII — ausencia de estímulo
  | "obstaculo"            // IX — contra obstáculo del deseo
  | "aversion-duradera"    // X — desamor / odio
  | "bien-ajeno"           // XI — el bien del otro provoca malestar
  | "peligro"              // XII — peligro / amenaza
  | "desmentido"           // XIII — previsión desmentida
  | "futuro-positivo"      // XIV — evaluación positiva del futuro
  | "futuro-negativo"      // XV — evaluación negativa del futuro
  | "perdida"              // XVI — pérdida del objeto deseado
  | "no-habitual"          // XVII — aparición de lo no habitual
  | "realizacion"          // XVIII — realización del deseo
  | "bien-recibido"        // XIX — bien recibido de otra persona
  | "bien-deseado"         // XX — amor / deseo del bien
  | "evaluacion-positiva"  // XXI — evaluación positiva de uno mismo
  | "evaluacion-negativa"; // XXII — evaluación negativa de uno mismo

export interface TribeClaims {
  name: import("./claims").Claimed<string>;
  nameEn: import("./claims").Claimed<string>;
  description: import("./claims").Claimed<string>;
}

export interface Tribe {
  id: TribeId;
  /** @deprecated Use `resolveTribe(id, ctx).name`. */
  name: string;
  /** @deprecated Use `resolveTribe(id, ctx).nameEn`. */
  nameEn: string;
  /** @deprecated Use `resolveTribe(id, ctx).description`. */
  description: string;
  color: string;
  textColor: string;
  clans: ClanId[];
  /** Plural face — populated by tribes-claims adapter. */
  claims?: TribeClaims;
}

export type ClanId = string;

export interface ClanClaims {
  name: import("./claims").Claimed<string>;
  description: import("./claims").Claimed<string>;
  feelings: import("./claims").Claimed<string[]>;
  antonyms: import("./claims").Claimed<string[]>;
}

export interface Clan {
  id: ClanId;
  /** @deprecated Use `resolveClan(id, ctx).name`. */
  name: string;
  tribe: TribeId;
  /** @deprecated Use `resolveClan(id, ctx).description`. */
  description: string;
  /** @deprecated Use `resolveClan(id, ctx).feelings`. */
  feelings: string[];
  /** @deprecated Use `resolveClan(id, ctx).antonyms`. */
  antonyms: string[];
  canonicalEmotion?: EmotionId;
  /** Plural face — populated by clans-claims adapter. */
  claims?: ClanClaims;
}

export type EmotionId = string;

/**
 * Plural face of an Emotion — every field is a collection of claims with
 * provenance. The canonical fields below remain the read-shape that the
 * existing UI consumes (back-compat); the `claims` map exists alongside
 * so new components can render disagreement, lenses, alternatives.
 *
 * The data adapter (data/ontology/emotions-claims.ts) populates `claims`
 * for every seeded emotion at load time, tagging existing curated
 * values as source: "marina" with weight 1.0. Subsequent participation
 * appends more claims without ever rewriting Marina's.
 */
export interface EmotionClaims {
  name: import("./claims").Claimed<string>;
  nameEn: import("./claims").Claimed<string>;
  description: import("./claims").Claimed<string>;
  etymology: import("./claims").Claimed<string>;
  poeticIntro: import("./claims").Claimed<string>;
  tribe: import("./claims").Claimed<TribeId>;
  clan: import("./claims").Claimed<ClanId>;
  resonance: import("./claims").Claimed<ResonanceAxes>;
  antonyms: import("./claims").Claimed<EmotionId[]>;
  neighbors: import("./claims").Claimed<EmotionId[]>;
  atmosphereTags: import("./claims").Claimed<string[]>;
  colorResonance: import("./claims").Claimed<ColorId[]>;
  typographyResonance: import("./claims").Claimed<FontId[]>;
}

export interface Emotion {
  id: EmotionId;
  // ─── Canonical fields ──────────────────────────────────────────────
  // These remain authoritative for read-only consumers. They are kept
  // identical to the most-weighted claim's value, computed once at load.
  //
  // ⚠ MIGRATION NOTICE: new code that wants ambiguity / lenses /
  // disagreement / participation should consult `claims` instead of
  // reading these directly. Use:
  //   import { resolveEmotion } from "@/data/ontology/emotions-claims";
  //   const live = resolveEmotion(id, ctx);
  // Direct reads are kept marked @deprecated below; they still work but
  // are blind to the active lens and to any community claims.
  /** @deprecated Use `resolveEmotion(id, ctx).name` for lens-aware reads. */
  name: string;
  /** @deprecated Use `resolveEmotion(id, ctx).nameEn`. */
  nameEn: string;
  /** @deprecated Use `resolveEmotion(id, ctx).tribe`. */
  tribe: TribeId;
  /** @deprecated Use `resolveEmotion(id, ctx).clan`. */
  clan: ClanId;
  /** @deprecated Use `resolveEmotion(id, ctx).description`. */
  description: string;
  /** @deprecated Use `resolveEmotion(id, ctx).etymology`. */
  etymology: string;
  /** @deprecated Use `resolveEmotion(id, ctx).poeticIntro`. */
  poeticIntro: string;
  /** @deprecated Use `resolveEmotion(id, ctx).antonyms`. */
  antonyms: EmotionId[];
  /** @deprecated Use `resolveEmotion(id, ctx).neighbors`. */
  neighbors: EmotionId[];
  transitions: EmotionTransition[];
  /** @deprecated Use `liveResonance(id, ctx)` for lens-aware vectors. */
  resonance: ResonanceAxes;
  /** @deprecated Use `resolveEmotion(id, ctx).colorResonance`. */
  colorResonance: ColorId[];
  /** @deprecated Use `resolveEmotion(id, ctx).typographyResonance`. */
  typographyResonance: FontId[];
  artworkResonance: string[];
  musicResonance: string[];
  filmResonance: string[];
  poetryResonance: string[];
  sculptureResonance?: string[];
  danceResonance?: string[];
  architectureResonance?: string[];
  photographyResonance?: string[];
  literatureResonance?: string[];
  ritualResonance?: string[];
  theaterResonance?: string[];
  /** @deprecated Use `resolveEmotion(id, ctx).atmosphereTags`. */
  atmosphereTags: string[];

  /**
   * Plural face — populated by the claims adapter. New components read
   * here when they want lenses, ambiguity, alternatives, or disagreement
   * measures. Optional only to keep the seed files (which still ship as
   * the canonical shape) valid until the adapter runs.
   */
  claims?: EmotionClaims;
}

export interface EmotionTransition {
  to: EmotionId;
  direction: "intensification" | "attenuation" | "transformation" | "opposition";
  description: string;
  strength: number; // 0–1
}

// ─── Color Resonance ──────────────────────────────────────────────────────────

export type ColorId = string;

/** Plural face of a Color — each meaning is a claim with provenance. */
export interface ColorClaims {
  nameEs: import("./claims").Claimed<string>;
  name: import("./claims").Claimed<string>;
  description: import("./claims").Claimed<string>;
  hellerQuote: import("./claims").Claimed<string>;
  resonance: import("./claims").Claimed<ResonanceAxes>;
  primaryEmotions: import("./claims").Claimed<EmotionId[]>;
  contradictoryEmotions: import("./claims").Claimed<EmotionId[]>;
  culturalMeanings: import("./claims").Claimed<string[]>;
  symbolism: import("./claims").Claimed<string[]>;
}

export interface ColorResonance {
  id: ColorId;
  /** @deprecated Use `resolveColor(id, ctx).name`. */
  name: string;
  /** @deprecated Use `resolveColor(id, ctx).nameEs`. */
  nameEs: string;
  hex: string;
  hsl: { h: number; s: number; l: number };
  hellerRank: number; // legacy single rank — kept for compatibility
  appreciatedRank?: number | null;
  lessAppreciatedRank?: number | null;
  /** @deprecated Use `resolveColor(id, ctx).primaryEmotions`. */
  primaryEmotions: EmotionId[];
  /** @deprecated Use `resolveColor(id, ctx).contradictoryEmotions`. */
  contradictoryEmotions: EmotionId[];
  /** @deprecated Use `resolveColor(id, ctx).culturalMeanings`. */
  culturalMeanings: string[];
  /** @deprecated Use `resolveColor(id, ctx).resonance`. */
  resonance: ResonanceAxes;
  /** @deprecated Use `resolveColor(id, ctx).description`. */
  description: string;
  /** @deprecated Use `resolveColor(id, ctx).hellerQuote`. */
  hellerQuote: string;
  /** @deprecated Use `resolveColor(id, ctx).symbolism`. */
  symbolism: string[];

  /** Plural face — populated by colors-claims adapter. */
  claims?: ColorClaims;
}

// ─── Typography ───────────────────────────────────────────────────────────────

export type FontId = string;

export interface TypographyResonance {
  id: FontId;
  name: string;
  googleFontFamily: string;
  category: "serif" | "sans-serif" | "display" | "monospace" | "handwriting";
  description: string;
  emotionalTone: string;
  resonance: ResonanceAxes;
  emotionResonance: EmotionId[];
  specimen: string;
  sampleText: string;
  designerEra: string;
  historicalContext: string;
}

// ─── Artworks ─────────────────────────────────────────────────────────────────

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  year: string;
  medium: string;
  culture: string;
  style: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  source: "met" | "artic" | "rijksmuseum" | "wikimedia";
  sourceId: string;
  sourceUrl: string;
  dominantColors: string[];
  emotionResonance: EmotionId[];
  colorResonance: ColorId[];
  atmosphereTags: string[];
  resonance: ResonanceAxes;
  poeticDescription: string;
}

// ─── Music ────────────────────────────────────────────────────────────────────

export interface Track {
  id: string;
  title: string;
  artist: string;
  // Cover-art / portrait image for the track or its album. Optional —
  // the Wikipedia ingest fills this for the diversity-expansion entries;
  // older curated tracks may not have one and rely on the iconographic
  // fallback in CulturalImage.
  imageUrl?: string;
  album?: string;
  year?: number;
  genre: string[];
  moods: string[];
  duration?: number;
  source: "lastfm" | "musicbrainz" | "jamendo" | "seed";
  sourceId?: string;
  listenUrl?: string;
  youtubeId?: string;
  emotionResonance: EmotionId[];
  colorResonance: ColorId[];
  atmosphereTags: string[];
  resonance: ResonanceAxes;
  description: string;
}

// ─── Films ────────────────────────────────────────────────────────────────────

export interface Film {
  id: string;
  title: string;
  director: string;
  year: number;
  overview: string;
  posterUrl?: string;
  genres: string[];
  emotionResonance: EmotionId[];
  colorResonance: ColorId[];
  atmosphereTags: string[];
  resonance: ResonanceAxes;
  poeticDescription: string;
  source: "tmdb" | "seed";
  sourceId?: number;
  youtubeId?: string;
}

// ─── Poetry ───────────────────────────────────────────────────────────────────

export interface Poem {
  id: string;
  title: string;
  author: string;
  year?: string;
  excerpt: string;
  fullText?: string;
  source: "poetrydb" | "gutenberg" | "seed";
  sourceId?: string;
  sourceUrl?: string;
  poeticDescription?: string;
  language: "en" | "es" | "fr" | "de" | "pt";
  emotionResonance: EmotionId[];
  colorResonance: ColorId[];
  atmosphereTags: string[];
  resonance: ResonanceAxes;
}

// ─── Extended disciplines ─────────────────────────────────────────────────────
//
// Beyond painting, music, film and poetry, Álbum recognises six further
// disciplines as emotional carriers. Each follows the same base shape (id,
// creator, year, emotionResonance, colorResonance, atmosphereTags, resonance,
// description, poeticDescription) plus a few discipline-specific fields.

interface BaseDiscipline {
  id: string;
  emotionResonance: EmotionId[];
  colorResonance: ColorId[];
  atmosphereTags: string[];
  resonance: ResonanceAxes;
  description: string;
  poeticDescription: string;
}

/** Sculpture — the body in space. */
export interface Sculpture extends BaseDiscipline {
  title: string;
  artist: string;
  year: string;
  medium: string;          // "Bronze", "Marble", "Mixed media"…
  culture: string;
  location?: string;       // current location (museum, site)
  imageUrl: string;
  sourceUrl?: string;
}

/** Dance — emotion in moving bodies. */
export interface Dance extends BaseDiscipline {
  title: string;
  choreographer: string;
  year: string;            // year of creation (some are traditional → e.g. "trad.")
  tradition: string;       // "Modern", "Butoh", "Flamenco", "Kathakali"…
  culture: string;
  imageUrl?: string;       // representative still; iconographic fallback otherwise
  youtubeId?: string;      // a representative recording
  videoUrl?: string;
}

/** Architecture — emotion as inhabited space. */
export interface Architecture extends BaseDiscipline {
  title: string;
  architect: string;
  year: string;
  location: string;
  buildingType: string;    // "chapel", "memorial", "house", "library"…
  // Optional now — the diversity expansion adds entries without a
  // reliable photo (Fathy's Gurna, Borobudur from the side, etc.) and
  // CulturalImage renders a fallback when missing.
  imageUrl?: string;
  sourceUrl?: string;
}

/** Photography — the decided instant. */
export interface Photography extends BaseDiscipline {
  title: string;
  photographer: string;
  year: string;
  series?: string;         // e.g. "Genesis" series (Salgado)
  culture: string;
  imageUrl: string;
  sourceUrl?: string;
}

/** Literature (narrative / essay, beyond poetry). */
export interface Literature extends BaseDiscipline {
  title: string;
  author: string;
  year: string;
  form: "novel" | "novella" | "short story" | "essay" | "memoir";
  language: string;
  excerpt?: string;        // a short representative passage
}

/** Theater — staged drama as emotional architecture. */
export interface Theater extends BaseDiscipline {
  title: string;
  author: string;
  year: string;
  form: "tragedy" | "comedy" | "absurdist" | "epic" | "documentary" | "performance";
  language: string;
  origin: string;          // "Athenian", "Elizabethan", "German", "Argentinian"…
  excerpt?: string;
  imageUrl?: string;       // production photo / author portrait; fallback otherwise
  videoUrl?: string;       // optional staged recording reference
}

/** Ritual — performative tradition with explicit emotional function. */
export interface Ritual extends BaseDiscipline {
  title: string;
  tradition: string;       // "Shinto", "Catholic", "Sufi", "Mexica"…
  culture: string;
  region: string;
  period: string;          // e.g. "Edo period", "Contemporary"
  imageUrl?: string;
  videoUrl?: string;
}

// ─── Resonance Relationships ──────────────────────────────────────────────────

export type ResonanceType =
  | "emotional"
  | "sensory"
  | "symbolic"
  | "cultural"
  | "formal"
  | "narrative"
  | "emergent"; // computed by the resonance engine via cosine similarity

export interface ResonanceRelationship {
  id: string;
  source: string;
  sourceType: "emotion" | "color" | "typography" | "artwork" | "music" | "film" | "poem";
  target: string;
  targetType: "emotion" | "color" | "typography" | "artwork" | "music" | "film" | "poem";
  strength: number;       // 0–1
  ambiguity: number;      // 0–1: how contested this relationship is
  collectiveAgreement: number; // 0–1: how much users agree
  culturalVariability: number; // 0–1: how much this varies across cultures
  resonanceType: ResonanceType;
  validations: number;
  contradictions: number;
}

// ─── Atmosphere ───────────────────────────────────────────────────────────────

export interface Atmosphere {
  id: string;
  name: string;
  poeticDescription: string;
  emotion: EmotionId;
  color: ColorId;
  typography: FontId;
  artwork?: string;
  music?: string;
  film?: string;
  poem?: string;
  resonanceProfile: ResonanceAxes;
  atmosphereTags: string[];
  createdAt: string;
  isSaved: boolean;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  description?: string;
  atmospheres: Atmosphere[];
  emotionPath: EmotionId[];
  savedEmotions: EmotionId[];
  savedArtworks: string[];
  savedMusic: string[];
  savedFilms: string[];
  savedPoems: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Participation ────────────────────────────────────────────────────────────

export type ParticipationType =
  | "emotion_color"
  | "emotion_typography"
  | "atmosphere_temperature"
  | "emotion_transition"
  | "resonance_validation"
  | "ambiguity_detection"
  | "contradiction_detection";

export interface ParticipationPrompt {
  id: string;
  type: ParticipationType;
  question: string;
  context?: string;
  options: ParticipationOption[];
  currentResults: ParticipationResult;
  isAmbiguous: boolean;
  isPolarizing: boolean;
}

export interface ParticipationOption {
  id: string;
  label: string;
  value: string;
  description?: string;
}

export interface ParticipationResult {
  totalVotes: number;
  distribution: Record<string, number>;
  dominantOption?: string;
  confidence: number;   // 0–1
  ambiguity: number;    // 0–1
  polarization: number; // 0–1
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | "node_clicked"
  | "node_hovered"
  | "resonance_validated"
  | "resonance_contradicted"
  | "atmosphere_generated"
  | "atmosphere_saved"
  | "collection_created"
  | "constellation_expanded"
  | "emotional_path_followed"
  | "unexpected_connection_discovered"
  | "participation_completed"
  | "editorial_page_opened"
  | "map_navigation_started"
  | "return_visit"
  | "filter_applied"
  | "resonance_layer_toggled";

export interface AnalyticsEventPayload {
  event: AnalyticsEvent;
  properties: Record<string, string | number | boolean | null>;
  timestamp: string;
  sessionId: string;
}

// ─── Semantic Map ─────────────────────────────────────────────────────────────

export type NodeType =
  | "emotion"
  | "color"
  | "artwork"
  | "music"
  | "film"
  | "poem"
  | "typography"
  | "sculpture"
  | "dance"
  | "architecture"
  | "photography"
  | "literature"
  | "ritual"
  | "theater";

export interface MapNode {
  id: string;
  type: NodeType;
  label: string;
  tribe?: TribeId;
  clan?: ClanId;
  resonance?: ResonanceAxes;
  /** Per-emotion derived color (chromatic signature). */
  color?: string;
  /** Tribal hex — used for tribe-level effects (glow filters, atmospheric tint). */
  tribalColor?: string;
  weight: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface MapLink {
  source: string | MapNode;
  target: string | MapNode;
  strength: number;
  ambiguity: number;
  resonanceType: ResonanceType;
}

export interface MapState {
  nodes: MapNode[];
  links: MapLink[];
  hoveredNode: string | null;
  selectedNode: string | null;
  activeFilter: NodeType | null;
  activeTribe: TribeId | null;
  zoom: number;
}
