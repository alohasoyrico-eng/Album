/**
 * Claim<T> — the atomic unit of plurality in Álbum.
 *
 * Every meaning in Álbum is a claim, not a fact. Each claim has:
 *   - a SOURCE (who or what asserted it)
 *   - a VALUE (the asserted thing)
 *   - a WEIGHT (how confident we are, 0..1)
 *   - optional EVIDENCE (why this is asserted)
 *   - optional LENS (the cultural / personal perspective from which it speaks)
 *   - a TIMESTAMP (when it was asserted)
 *
 * Entities (emotions, colours, artworks…) no longer hold canonical values.
 * They hold *collections of claims* per field. The canonical reading is a
 * function of the claim collection plus an optional context — never a
 * pre-baked value.
 *
 * This is what makes ambiguity, lenses, participation, and inference
 * possible. Without this layer those concepts cannot be modelled at all.
 */

import type { ResonanceAxes } from "./index";

// ─── Sources ────────────────────────────────────────────────────────────
// Every claim is tagged with its provenance. Canonical curated data
// migrates as source: "marina" or "heller" with weight 1.0.

export type ClaimSource =
  | { kind: "marina" }                          // Marina's ontology
  | { kind: "heller" }                          // Eva Heller's research
  | { kind: "curator"; id: string }             // Editorial seed (named)
  | { kind: "user"; id: string }                // Anonymous user or signed-in
  | { kind: "lens"; key: LensKey }              // A claim that belongs to a perspective
  | { kind: "inference"; method: string }       // Produced by the inference engine
  | { kind: "import"; provenance: string };     // Met / ARTIC / Open Library, etc.

// ─── Lenses ─────────────────────────────────────────────────────────────
// A lens is a perspective: cultural, personal, methodological. Claims
// scoped to a lens belong to that worldview. The reader can pin a lens
// and the whole interface re-reads through it.

export type LensKey =
  | "western"            // dominant western canon — the default our seed data carries
  | "eastern"            // East / South-East Asian readings
  | "indigenous"         // First-nations readings (plural; specialise per node)
  | "afrodiasporic"
  | "latin-american"
  | "queer"
  | "feminist"
  | "personal";          // the active user's own marks

// ─── The claim itself ───────────────────────────────────────────────────

export interface Claim<T> {
  /** Stable id — useful for voting / cross-referencing / merging. */
  id: string;
  /** Who asserted this. */
  source: ClaimSource;
  /** The asserted value. */
  value: T;
  /** 0..1 confidence / community weight. Curated seeds default to 1. */
  weight: number;
  /** Free-text rationale, citation, or evidence. */
  evidence?: string;
  /** The perspective in which this claim lives. */
  lens?: LensKey;
  /** Optional vote counters — populated from the participation backend. */
  votes?: { up: number; down: number };
  /** ISO 8601 timestamp. */
  createdAt: string;
}

// ─── Claim-shaped fields ────────────────────────────────────────────────
// A "Claim-shaped" field is just an array of claims. We expose helper
// types so call-sites can write Claimed<string> instead of Claim<string>[].

export type Claimed<T> = Claim<T>[];

// ─── Context — used by consensus + inference ────────────────────────────
// The optional context object the readers pass when asking "what does
// this entity look like to me, here, now". Resonance becomes a function
// of (claims, context), not a constant.

export interface ReadContext {
  /** The lens the reader has pinned. Claims with this lens get extra weight. */
  lens?: LensKey;
  /** Stable user id (for personal claims). */
  userId?: string;
  /** Recent path through the field — informs contextual resonance. */
  recentPath?: string[];
  /** Sampling temperature — 0 = top-1, higher = probabilistic. */
  temperature?: number;
  /** Whether to consider inferred claims (default: true). */
  includeInferred?: boolean;
}

// ─── Convenience constructors ───────────────────────────────────────────

let _autoIdCounter = 0;
function autoId(prefix: string): string {
  _autoIdCounter += 1;
  return `${prefix}-${_autoIdCounter.toString(36)}`;
}

export function marinaClaim<T>(value: T, weight = 1.0, lens?: LensKey): Claim<T> {
  return {
    id: autoId("c-marina"),
    source: { kind: "marina" },
    value,
    weight,
    lens,
    createdAt: "1996-01-01T00:00:00Z",
  };
}

export function hellerClaim<T>(value: T, weight = 1.0): Claim<T> {
  return {
    id: autoId("c-heller"),
    source: { kind: "heller" },
    value,
    weight,
    lens: "western",
    createdAt: "2000-01-01T00:00:00Z",
  };
}

export function curatorClaim<T>(value: T, curatorId: string, weight = 0.9, lens?: LensKey, evidence?: string): Claim<T> {
  return {
    id: autoId("c-cur"),
    source: { kind: "curator", id: curatorId },
    value,
    weight,
    lens,
    evidence,
    createdAt: new Date().toISOString(),
  };
}

export function inferredClaim<T>(value: T, method: string, weight: number, evidence?: string): Claim<T> {
  return {
    id: autoId("c-inf"),
    source: { kind: "inference", method },
    value,
    weight,
    evidence,
    createdAt: new Date().toISOString(),
  };
}

export function userClaim<T>(value: T, userId: string, weight = 0.5, lens?: LensKey, evidence?: string): Claim<T> {
  return {
    id: autoId("c-usr"),
    source: { kind: "user", id: userId },
    value,
    weight,
    lens,
    evidence,
    createdAt: new Date().toISOString(),
  };
}

// ─── Sentinel: empty claim collection ───────────────────────────────────
// Many entity fields are optional. Helpers should treat empty arrays as
// "no claim" rather than crashing.

export const NO_CLAIMS: Claimed<never> = [] as Claimed<never>;

// ─── Resonance is special: a numeric vector that we average ─────────────
// We re-export the type so anything constructing a Claim<ResonanceAxes>
// has a single import target.

export type { ResonanceAxes };
