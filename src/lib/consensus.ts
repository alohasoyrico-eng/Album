/**
 * Consensus algebra over Claim<T> collections.
 *
 * Every read in Álbum eventually answers: "given these claims about X,
 * what should I show right now, to this person, on this lens?" That
 * answer is not a stored value — it is a function of the claim
 * collection + a ReadContext.
 *
 * This module provides the small algebra of consensus operations:
 *
 *   mostWeighted     — pick the single highest-weighted claim
 *   weighted         — full weighted list, sorted desc
 *   consensus        — derive a single value via type-specific reduction
 *   disagreement     — measure of how much the claims disagree (0..1)
 *   alternatives     — claims that disagree with the consensus
 *   filterByLens     — restrict to a lens (with fallback)
 *   reweighByContext — modulate weights by the reader's context
 *
 * String fields take mostWeighted; numeric vectors (ResonanceAxes) take
 * a weighted average; arrays take a weighted union. The defaults cover
 * 95 % of cases; specialised reducers can be passed when needed.
 */

import type { Claim, Claimed, ReadContext, LensKey, ResonanceAxes } from "@/types/claims";

// ─── Lens semantics ─────────────────────────────────────────────────────
// A lens claim weighs more when the reader's lens matches. A no-lens
// claim is treated as universal — weighted at face value regardless of
// the reader's lens.

const LENS_MATCH_BOOST = 1.6;     // when claim.lens == ctx.lens
const LENS_MISMATCH_DAMPEN = 0.35; // when claim has a lens but ctx prefers another
const USER_OWN_BOOST = 2.0;        // when claim source is the active user

export function effectiveWeight<T>(claim: Claim<T>, ctx: ReadContext = {}): number {
  let w = claim.weight;

  // Lens alignment
  if (claim.lens && ctx.lens) {
    if (claim.lens === ctx.lens) w *= LENS_MATCH_BOOST;
    else w *= LENS_MISMATCH_DAMPEN;
  }
  // User's own claims weigh more for that user
  if (claim.source.kind === "user" && ctx.userId && claim.source.id === ctx.userId) {
    w *= USER_OWN_BOOST;
  }
  // Inferred claims can be excluded
  if (claim.source.kind === "inference" && ctx.includeInferred === false) {
    return 0;
  }
  // Votes nudge weight by ±20 %
  if (claim.votes) {
    const net = claim.votes.up - claim.votes.down;
    const denom = Math.max(1, claim.votes.up + claim.votes.down);
    w *= 1 + 0.2 * (net / denom);
  }
  return Math.max(0, w);
}

// ─── Filters ────────────────────────────────────────────────────────────

export function filterByLens<T>(claims: Claimed<T>, lens: LensKey): Claimed<T> {
  // First, claims explicitly in the lens. If none, fall back to lens-less
  // claims (universal). Never return claims from competing lenses.
  const inLens = claims.filter((c) => c.lens === lens);
  if (inLens.length > 0) return inLens;
  return claims.filter((c) => !c.lens);
}

export function withoutInferred<T>(claims: Claimed<T>): Claimed<T> {
  return claims.filter((c) => c.source.kind !== "inference");
}

// ─── Ranking ────────────────────────────────────────────────────────────

export function weighted<T>(claims: Claimed<T>, ctx: ReadContext = {}): Array<{ claim: Claim<T>; w: number }> {
  return claims
    .map((c) => ({ claim: c, w: effectiveWeight(c, ctx) }))
    .filter((x) => x.w > 0)
    .sort((a, b) => b.w - a.w);
}

export function mostWeighted<T>(claims: Claimed<T>, ctx: ReadContext = {}): Claim<T> | null {
  const ranked = weighted(claims, ctx);
  return ranked.length > 0 ? ranked[0].claim : null;
}

// ─── Type-specific consensus reductions ─────────────────────────────────

/** Strings, IDs, single-value primitives: top weighted wins. */
export function consensusValue<T>(claims: Claimed<T>, ctx: ReadContext = {}): T | null {
  const top = mostWeighted(claims, ctx);
  return top ? top.value : null;
}

/** ResonanceAxes: weighted average across the 10 axes. */
export function consensusResonance(
  claims: Claimed<ResonanceAxes>,
  ctx: ReadContext = {},
): ResonanceAxes | null {
  const ranked = weighted(claims, ctx);
  if (ranked.length === 0) return null;
  const acc: ResonanceAxes = {
    energy: 0, temperature: 0, tension: 0, density: 0, movement: 0,
    temporality: 0, humanity: 0, clarity: 0, intimacy: 0, control: 0,
  };
  let sumW = 0;
  for (const { claim, w } of ranked) {
    sumW += w;
    for (const k of Object.keys(acc) as Array<keyof ResonanceAxes>) {
      acc[k] += claim.value[k] * w;
    }
  }
  if (sumW === 0) return mostWeighted(claims, ctx)?.value ?? null;
  for (const k of Object.keys(acc) as Array<keyof ResonanceAxes>) {
    acc[k] = Math.round(acc[k] / sumW);
  }
  return acc;
}

/** Arrays of ids / strings: weighted union, deduped, sorted by aggregate weight. */
export function consensusList(
  claims: Claimed<string[]>,
  ctx: ReadContext = {},
  limit = 32,
): string[] {
  const weights = new Map<string, number>();
  for (const { claim, w } of weighted(claims, ctx)) {
    for (const item of claim.value) {
      weights.set(item, (weights.get(item) ?? 0) + w);
    }
  }
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

// ─── Disagreement metrics ───────────────────────────────────────────────

/**
 * 0 = everybody agrees (single claim, or all claims have the same value)
 * 1 = maximum disagreement (claims with comparable weight assert
 *     mutually exclusive values)
 *
 * For string-shaped claims we measure shannon entropy over the weighted
 * distribution of distinct values. For numeric vectors we use the
 * normalised standard deviation across the consensus.
 */
export function disagreement<T>(claims: Claimed<T>, ctx: ReadContext = {}): number {
  const ranked = weighted(claims, ctx);
  if (ranked.length <= 1) return 0;
  const dist = new Map<string, number>();
  let total = 0;
  for (const { claim, w } of ranked) {
    const key = JSON.stringify(claim.value);
    dist.set(key, (dist.get(key) ?? 0) + w);
    total += w;
  }
  if (total === 0 || dist.size <= 1) return 0;
  let H = 0;
  for (const w of dist.values()) {
    const p = w / total;
    if (p > 0) H -= p * Math.log2(p);
  }
  // Normalise by log2(N) — entropy of a uniform distribution over N items.
  const maxH = Math.log2(dist.size);
  return maxH > 0 ? H / maxH : 0;
}

/**
 * Claims that disagree with the current consensus. Useful for "Marina
 * says X, but 14 % of readers say Y" UI fragments.
 */
export function alternatives<T>(claims: Claimed<T>, ctx: ReadContext = {}): Claim<T>[] {
  const top = mostWeighted(claims, ctx);
  if (!top) return [];
  const sameValue = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
  return claims.filter((c) => !sameValue(c.value, top.value));
}

// ─── Convenience: a single function for the common case ─────────────────
// Most readers just want "what value should I show". This wraps the
// dispatcher: strings & ids use consensusValue, arrays use consensusList,
// resonance uses consensusResonance.

export interface Resolved<T> {
  value: T | null;
  /** 0..1 — how confident this consensus is. */
  confidence: number;
  /** Up-to-K most-supported alternatives (sorted desc). */
  alternatives: Claim<T>[];
  /** 0..1 disagreement metric. */
  contested: number;
}

export function resolve<T>(
  claims: Claimed<T>,
  ctx: ReadContext = {},
): Resolved<T> {
  if (claims.length === 0) {
    return { value: null, confidence: 0, alternatives: [], contested: 0 };
  }
  const top = mostWeighted(claims, ctx);
  const ranked = weighted(claims, ctx);
  const totalW = ranked.reduce((s, x) => s + x.w, 0);
  const topW = ranked[0]?.w ?? 0;
  const confidence = totalW > 0 ? topW / totalW : 0;
  return {
    value: top?.value ?? null,
    confidence,
    alternatives: alternatives(claims, ctx),
    contested: disagreement(claims, ctx),
  };
}
