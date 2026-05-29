/**
 * Resonance Engine.
 *
 * Indexes every cultural entity Álbum knows about into a single vector space
 * and computes semantic neighborhoods on demand. Instead of curated
 * `relatedX[]` arrays, the engine INFERS resonance through cosine similarity
 * across the entire catalogue.
 *
 * Probabilistic modes:
 *   - 'expected'  — top-similar hits (the obvious neighborhood)
 *   - 'adjacent'  — mid-range similarity (the drift zone)
 *   - 'anomaly'   — low overall similarity BUT high on one axis (surprise)
 *   - 'mixed'     — weighted blend 70/20/10
 */

import { EMOTIONS } from "@/data/ontology/emotions";
import { COLORS } from "@/data/colors/colorResonance";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { ARTWORKS } from "@/data/seed/artworks";
import { TRACKS } from "@/data/seed/music";
import { FILMS } from "@/data/seed/films";
import { POEMS } from "@/data/seed/poetry";
import { SCULPTURES } from "@/data/seed/sculpture";
import { DANCES } from "@/data/seed/dance";
import { ARCHITECTURES } from "@/data/seed/architecture";
import { PHOTOGRAPHS } from "@/data/seed/photography";
import { LITERATURES } from "@/data/seed/literature";
import { RITUALS } from "@/data/seed/ritual";
import { THEATERS } from "@/data/seed/theater";

import {
  buildVector,
  cosineSimilarity,
  axisOverlap,
  type ResonanceVector,
  type AxisOverlap,
} from "./resonance-vector";

import type { ResonanceAxes } from "@/types";

// ─── Entity type system ──────────────────────────────────────────────────────

export type EntityKind =
  | "emotion"
  | "color"
  | "typography"
  | "artwork"
  | "music"
  | "film"
  | "poem"
  | "sculpture"
  | "dance"
  | "architecture"
  | "photography"
  | "literature"
  | "ritual"
  | "theater";

export interface IndexedEntity {
  id: string;
  kind: EntityKind;
  vector: ResonanceVector;
  // Display fields (we keep this lean — the consumer can re-fetch the full
  // entity if needed)
  label: string;
  /** Creator / artist / author / etc. */
  creator?: string;
  /** Year / period / "trad." */
  year?: string | number;
  /** Short, evocative — used by EmergentResonance for the preview line. */
  description?: string;
  /** Optional image to render */
  imageUrl?: string;
  /** Route to the entity's editorial detail page (when one exists) */
  href?: string;
}

// ─── Index — built lazily once, then cached ──────────────────────────────────

let _index: IndexedEntity[] | null = null;

export function getIndex(): IndexedEntity[] {
  if (_index) return _index;
  const out: IndexedEntity[] = [];

  // Emotions
  for (const e of EMOTIONS) {
    out.push({
      id: e.id,
      kind: "emotion",
      vector: buildVector(e.resonance),
      label: e.name,
      description: e.poeticIntro,
      href: `/emotion/${e.id}`,
    });
  }

  // Colors
  for (const c of COLORS) {
    out.push({
      id: c.id,
      kind: "color",
      vector: buildVector(c.resonance),
      label: c.nameEs,
      description: c.hellerQuote,
      href: `/color/${c.id}`,
    });
  }

  // Typography
  for (const t of TYPOGRAPHY) {
    out.push({
      id: t.id,
      kind: "typography",
      vector: buildVector(t.resonance),
      label: t.name,
      creator: t.designerEra,
      description: t.emotionalTone,
    });
  }

  // Artworks
  for (const a of ARTWORKS) {
    out.push({
      id: a.id,
      kind: "artwork",
      vector: buildVector(a.resonance),
      label: a.title,
      creator: a.artist,
      year: a.year,
      description: a.poeticDescription,
      imageUrl: a.imageUrl,
    });
  }

  // Music
  for (const m of TRACKS) {
    out.push({
      id: m.id,
      kind: "music",
      vector: buildVector(m.resonance),
      label: m.title,
      creator: m.artist,
      year: m.year,
      description: m.description,
    });
  }

  // Films
  for (const f of FILMS) {
    out.push({
      id: f.id,
      kind: "film",
      vector: buildVector(f.resonance),
      label: f.title,
      creator: f.director,
      year: f.year,
      description: f.poeticDescription,
      imageUrl: f.posterUrl,
    });
  }

  // Poems
  for (const p of POEMS) {
    out.push({
      id: p.id,
      kind: "poem",
      vector: buildVector(p.resonance),
      label: p.title,
      creator: p.author,
      year: p.year,
      description: p.excerpt?.slice(0, 140),
    });
  }

  // Sculptures
  for (const s of SCULPTURES) {
    out.push({
      id: s.id,
      kind: "sculpture",
      vector: buildVector(s.resonance),
      label: s.title,
      creator: s.artist,
      year: s.year,
      description: s.poeticDescription,
      imageUrl: s.imageUrl,
    });
  }

  // Dances
  for (const d of DANCES) {
    out.push({
      id: d.id,
      kind: "dance",
      vector: buildVector(d.resonance),
      label: d.title,
      creator: d.choreographer,
      year: d.year,
      description: d.poeticDescription,
    });
  }

  // Architectures
  for (const a of ARCHITECTURES) {
    out.push({
      id: a.id,
      kind: "architecture",
      vector: buildVector(a.resonance),
      label: a.title,
      creator: a.architect,
      year: a.year,
      description: a.poeticDescription,
      imageUrl: a.imageUrl,
    });
  }

  // Photography
  for (const p of PHOTOGRAPHS) {
    out.push({
      id: p.id,
      kind: "photography",
      vector: buildVector(p.resonance),
      label: p.title,
      creator: p.photographer,
      year: p.year,
      description: p.poeticDescription,
      imageUrl: p.imageUrl,
    });
  }

  // Literature
  for (const l of LITERATURES) {
    out.push({
      id: l.id,
      kind: "literature",
      vector: buildVector(l.resonance),
      label: l.title,
      creator: l.author,
      year: l.year,
      description: l.poeticDescription,
    });
  }

  // Rituals
  for (const r of RITUALS) {
    out.push({
      id: r.id,
      kind: "ritual",
      vector: buildVector(r.resonance),
      label: r.title,
      creator: r.tradition,
      year: r.period,
      description: r.poeticDescription,
      imageUrl: r.imageUrl,
    });
  }

  // Theater
  for (const t of THEATERS) {
    out.push({
      id: t.id,
      kind: "theater",
      vector: buildVector(t.resonance),
      label: t.title,
      creator: t.author,
      year: t.year,
      description: t.poeticDescription,
    });
  }

  _index = out;
  return out;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export type ResonanceMode = "expected" | "adjacent" | "anomaly" | "mixed";

export interface ResonanceHit {
  entity: IndexedEntity;
  similarity: number;
  mode: "expected" | "adjacent" | "anomaly";
  /** Top axes both vectors share — used to label WHY they resonate */
  sharedAxes: AxisOverlap[];
  /** Axes with the largest gap — surfaces tension/contradiction */
  tensionAxes: AxisOverlap[];
}

export interface QueryOptions {
  /** Resonance mode (default 'mixed'). */
  mode?: ResonanceMode;
  /** Maximum number of hits to return. */
  limit?: number;
  /** Exclude entity IDs (typically the query entity itself). */
  excludeIds?: string[];
  /** Restrict to certain kinds (default = all). */
  kinds?: EntityKind[];
}

/**
 * Query the catalogue for entities that resonate with the given vector.
 *
 * The function does ONE pass over the full index, computing cosine similarity
 * for each candidate, then partitions the results into three bands:
 *
 *   - expected: similarity >= 0.92  → the obvious neighborhood
 *   - adjacent: 0.78 <= similarity < 0.92 → the drift zone
 *   - anomaly:  similarity < 0.78 BUT shares ≥0.75 on at least one axis
 *               → surprise resonance (e.g. fear ↔ tenderness via fragility)
 *
 * In 'mixed' mode the returned list interleaves expected (70%), adjacent
 * (20%) and anomaly (10%) up to `limit`.
 */
export function queryResonance(query: ResonanceVector, opts: QueryOptions = {}): ResonanceHit[] {
  const { mode = "mixed", limit = 12, excludeIds = [], kinds } = opts;
  const index = getIndex();
  const excludeSet = new Set(excludeIds);

  const expected: ResonanceHit[] = [];
  const adjacent: ResonanceHit[] = [];
  const anomaly:  ResonanceHit[] = [];

  for (const entity of index) {
    if (excludeSet.has(entity.id)) continue;
    if (kinds && !kinds.includes(entity.kind)) continue;

    const sim = cosineSimilarity(query, entity.vector);

    if (sim >= 0.92) {
      const { shared, tensions } = axisOverlap(query, entity.vector);
      expected.push({ entity, similarity: sim, mode: "expected", sharedAxes: shared, tensionAxes: tensions });
    } else if (sim >= 0.78) {
      const { shared, tensions } = axisOverlap(query, entity.vector);
      adjacent.push({ entity, similarity: sim, mode: "adjacent", sharedAxes: shared, tensionAxes: tensions });
    } else {
      // Check if any single axis is strongly shared → anomaly resonance
      const { shared, tensions } = axisOverlap(query, entity.vector);
      const strongestShared = shared[0];
      if (strongestShared && strongestShared.shared >= 0.72) {
        anomaly.push({
          entity,
          similarity: sim,
          mode: "anomaly",
          sharedAxes: shared,
          tensionAxes: tensions,
        });
      }
    }
  }

  // Sort each band by similarity (anomalies sorted by their strongest shared axis instead)
  expected.sort((a, b) => b.similarity - a.similarity);
  adjacent.sort((a, b) => b.similarity - a.similarity);
  anomaly.sort((a, b) => b.sharedAxes[0].shared - a.sharedAxes[0].shared);

  if (mode === "expected") return expected.slice(0, limit);
  if (mode === "adjacent") return adjacent.slice(0, limit);
  if (mode === "anomaly")  return anomaly.slice(0, limit);

  // 'mixed' — probabilistic blend
  const expectedCount = Math.round(limit * 0.7);
  const adjacentCount = Math.round(limit * 0.2);
  const anomalyCount  = Math.max(1, limit - expectedCount - adjacentCount);
  return [
    ...expected.slice(0, expectedCount),
    ...adjacent.slice(0, adjacentCount),
    ...anomaly.slice(0, anomalyCount),
  ];
}

/**
 * Convenience: build a vector from raw ResonanceAxes and query in one call.
 */
export function resonateFrom(r: ResonanceAxes, opts: QueryOptions = {}): ResonanceHit[] {
  return queryResonance(buildVector(r), opts);
}

/**
 * Compute the centroid resonance for a group of entities (a tribe, a clan,
 * a curated playlist…). The centroid is the per-axis average — it represents
 * the emotional "average shape" of the group.
 *
 * Useful when a non-entity object (tribe, clan) needs to query the catalogue
 * as if it had its own resonance.
 */
export function groupCentroidResonance<T extends { resonance: ResonanceAxes }>(
  items: T[],
): ResonanceAxes {
  const blank: ResonanceAxes = {
    energy: 0, temperature: 0, tension: 0, density: 0, movement: 0,
    temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0,
  };
  if (items.length === 0) return blank;
  const sum = { ...blank };
  for (const it of items) {
    for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) {
      sum[k] += it.resonance[k];
    }
  }
  const n = items.length;
  for (const k of Object.keys(sum) as Array<keyof ResonanceAxes>) {
    sum[k] = sum[k] / n;
  }
  return sum;
}

/**
 * Multi-hop drift — given a starting entity, walk N steps. Each step picks
 * the next entity from the 'adjacent' or 'anomaly' bands (never the exact
 * same kind twice in a row, to force semantic drift across disciplines).
 *
 * Returns the pathway as an ordered list of hops.
 */
export function driftPathway(startEntity: IndexedEntity, hops: number = 5): IndexedEntity[] {
  const path: IndexedEntity[] = [startEntity];
  const seen = new Set<string>([startEntity.id]);

  let current = startEntity;
  for (let i = 0; i < hops; i++) {
    // Mostly adjacent (drift zone), occasionally anomaly for surprise
    const useAnomaly = Math.random() < 0.25;
    const hits = queryResonance(current.vector, {
      mode: useAnomaly ? "anomaly" : "adjacent",
      limit: 10,
      excludeIds: Array.from(seen),
    });
    // Filter same-kind candidates to encourage cross-discipline drift
    const crossKind = hits.filter((h) => h.entity.kind !== current.kind);
    const candidates = crossKind.length > 0 ? crossKind : hits;
    if (candidates.length === 0) break;
    // Deterministic-ish: pick the first (highest similarity in that band)
    const next = candidates[0].entity;
    path.push(next);
    seen.add(next.id);
    current = next;
  }
  return path;
}
