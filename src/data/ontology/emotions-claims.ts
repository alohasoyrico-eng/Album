/**
 * Claims adapter for the Emotion catalogue.
 *
 * The seed file (`emotions.ts`) stores each emotion in its CANONICAL
 * shape (single string description, single resonance vector, etc.). At
 * module load this adapter wraps every canonical field into a Marina-
 * sourced claim with weight 1.0 — so the plural face exists immediately
 * without rewriting the seed.
 *
 * As subsequent layers ship (curator overlays, lens-specific readings,
 * participation backend, inference engine), they ADD claims by calling
 * `appendClaim(emotionId, field, claim)`. Marina's claims are never
 * mutated; they coexist with the new ones, and consensus picks at read
 * time.
 *
 * Net effect: existing call-sites keep reading `emotion.description`
 * unchanged. New code calling `resolveEmotion(id, ctx)` gets a context-
 * aware plural view.
 */

import type { Emotion, EmotionClaims } from "@/types";
import { marinaClaim } from "@/types/claims";
import type { Claim, Claimed, ReadContext, LensKey } from "@/types/claims";
import { resolve, consensusResonance, consensusList, consensusValue } from "@/lib/consensus";
import { EMOTIONS as RAW_EMOTIONS, EMOTION_MAP as RAW_EMOTION_MAP } from "./emotions";

// ─── Lens-specific overlays ──────────────────────────────────────────────
// Stub for now — empty arrays. Curator + lens overlays will register here
// (Fase 1.3 demo will inject one). Participation backend will write here too.
const _overlays: Record<string, Partial<EmotionClaims>> = {};

// Tracks how many times `registerOverlay(id, …)` has been called per id.
// `materialise()` invalidates its cache when the entry was last built at
// a generation lower than the current count. Declared BEFORE materialise()
// so module init doesn't hit TDZ when EMOTIONS_PLURAL materialises eagerly.
const _overlayGenById = new Map<string, number>();

export function registerOverlay(emotionId: string, claims: Partial<EmotionClaims>) {
  const cur = _overlays[emotionId] ?? {};
  // Merge each field's claims array
  for (const key of Object.keys(claims) as Array<keyof EmotionClaims>) {
    const next = claims[key] as Claim<unknown>[] | undefined;
    if (!next) continue;
    const prev = (cur[key] as Claim<unknown>[] | undefined) ?? [];
    (cur as Record<string, Claim<unknown>[]>)[key] = [...prev, ...next];
  }
  _overlays[emotionId] = cur;
  _overlayGenById.set(emotionId, (_overlayGenById.get(emotionId) ?? 0) + 1);
}

// ─── Build the plural face from the canonical seed ───────────────────────

function makeClaims(e: Emotion): EmotionClaims {
  return {
    name:            [marinaClaim(e.name)],
    nameEn:          [marinaClaim(e.nameEn)],
    description:     [marinaClaim(e.description)],
    etymology:       [marinaClaim(e.etymology)],
    poeticIntro:     [marinaClaim(e.poeticIntro)],
    tribe:           [marinaClaim(e.tribe)],
    clan:            [marinaClaim(e.clan)],
    resonance:       [marinaClaim(e.resonance)],
    antonyms:        [marinaClaim(e.antonyms)],
    neighbors:       [marinaClaim(e.neighbors)],
    atmosphereTags:  [marinaClaim(e.atmosphereTags)],
    colorResonance:  [marinaClaim(e.colorResonance)],
    typographyResonance: [marinaClaim(e.typographyResonance)],
  };
}

function mergeClaims(base: EmotionClaims, overlay?: Partial<EmotionClaims>): EmotionClaims {
  if (!overlay) return base;
  const out: EmotionClaims = { ...base };
  for (const key of Object.keys(overlay) as Array<keyof EmotionClaims>) {
    const extra = overlay[key];
    if (!extra) continue;
    (out as unknown as Record<string, Claim<unknown>[]>)[key] = [
      ...(base[key] as Claim<unknown>[]),
      ...(extra as Claim<unknown>[]),
    ];
  }
  return out;
}

// Materialise the plural face per emotion. Lazy so overlays registered
// after import are still picked up the first time someone calls.
const _materialised = new Map<string, Emotion>();

function materialise(e: Emotion): Emotion {
  const cached = _materialised.get(e.id);
  // INVARIANT: if no overlays for this id, the cached materialisation
  // (made from Marina canonical alone) is still correct.
  if (cached && !_overlays[e.id]) return cached;
  // If overlays exist, rebuild from raw claims + overlay every time the
  // overlay shape might have changed. We track a per-id "overlay
  // generation" counter so cached entries that were built at an earlier
  // generation are invalidated automatically. Without this, `EMOTIONS_PLURAL`
  // (built at module init, before applyEmotionSeedOverlays runs) would
  // mask all subsequent overlays.
  const gen = _overlayGenById.get(e.id) ?? 0;
  if (cached && (cached as Emotion & { __gen?: number }).__gen === gen) return cached;
  const base = makeClaims(e);
  const claims = mergeClaims(base, _overlays[e.id]);
  const ext: Emotion & { __gen?: number } = { ...e, claims };
  ext.__gen = gen;
  _materialised.set(e.id, ext);
  return ext;
}

/**
 * Use these instead of the raw exports when you want the plural face.
 * Backward-compatible — every consumer reading `emotion.description`
 * still gets the canonical string; consumers reading `emotion.claims`
 * get the plural face.
 */
export const EMOTIONS_PLURAL: Emotion[] = RAW_EMOTIONS.map(materialise);
export const EMOTION_MAP_PLURAL = new Map(EMOTIONS_PLURAL.map((e) => [e.id, e]));

// Adapter — eagerly fill `claims` on the raw exports so even legacy
// imports get the plural face. Safe because we only ADD a property.
for (const raw of RAW_EMOTIONS) {
  if (!raw.claims) raw.claims = makeClaims(raw);
}
void RAW_EMOTION_MAP;

// Apply curator / lens overlays AFTER `_overlays` is initialised. ESM
// hoists static imports above any module body, so a plain
// `import "./_seed-overlays"` would run before `_overlays` exists → TDZ.
// The seed file exports an idempotent applier we call explicitly.
import { applyEmotionSeedOverlays } from "./_seed-overlays";
applyEmotionSeedOverlays();

// ─── Reader — context-aware plural view ──────────────────────────────────

export interface ResolvedEmotion {
  id: string;
  name: string;
  nameEn: string;
  tribe: string;
  clan: string;
  description: string;
  etymology: string;
  poeticIntro: string;
  resonance: import("@/types").ResonanceAxes;
  antonyms: string[];
  neighbors: string[];
  atmosphereTags: string[];
  colorResonance: string[];
  typographyResonance: string[];

  /** Per-field disagreement (0..1). */
  contested: {
    description: number;
    resonance: number;
    name: number;
    tribe: number;
  };
  /** Alternative readings — the second-most-weighted claim per textual field. */
  alternatives: {
    description: Claim<string> | null;
    name: Claim<string> | null;
    poeticIntro: Claim<string> | null;
  };
  /** Source attribution of the chosen consensus value per field. */
  attribution: {
    description: import("@/types/claims").ClaimSource | null;
    resonance: import("@/types/claims").ClaimSource | null;
  };
}

export function resolveEmotion(emotionId: string, ctx: ReadContext = {}): ResolvedEmotion | null {
  // Always go through materialise() so overlay-gen invalidation runs;
  // EMOTION_MAP_PLURAL entries were cached at module init, before
  // applyEmotionSeedOverlays() (and any subsequent participation
  // hydration) populated `_overlays`.
  const rawE = RAW_EMOTION_MAP.get(emotionId);
  const e = rawE ? materialise(rawE) : null;
  if (!e) return null;
  const c = e.claims!;

  const descR  = resolve(c.description, ctx);
  const nameR  = resolve(c.name, ctx);
  const tribeR = resolve(c.tribe, ctx);
  const resR   = consensusResonance(c.resonance, ctx);
  const reson  = resolve(c.resonance, ctx);

  const top = <T>(claims: Claimed<T>) => {
    const r = resolve(claims, ctx);
    return r.value;
  };

  return {
    id: e.id,
    name: nameR.value ?? e.name,
    nameEn: top(c.nameEn) ?? e.nameEn,
    tribe: tribeR.value ?? e.tribe,
    clan: top(c.clan) ?? e.clan,
    description: descR.value ?? e.description,
    etymology: top(c.etymology) ?? e.etymology,
    poeticIntro: top(c.poeticIntro) ?? e.poeticIntro,
    resonance: resR ?? e.resonance,
    antonyms: consensusList(c.antonyms, ctx),
    neighbors: consensusList(c.neighbors, ctx),
    atmosphereTags: consensusList(c.atmosphereTags, ctx),
    colorResonance: consensusList(c.colorResonance, ctx),
    typographyResonance: consensusList(c.typographyResonance, ctx),
    contested: {
      description: descR.contested,
      resonance: reson.contested,
      name: nameR.contested,
      tribe: tribeR.contested,
    },
    alternatives: {
      description: descR.alternatives[0] ?? null,
      name: nameR.alternatives[0] ?? null,
      poeticIntro: resolve(c.poeticIntro, ctx).alternatives[0] ?? null,
    },
    attribution: {
      description: descR.value != null
        ? (consensusValue(c.description, ctx) === descR.value
            ? c.description.find((cl) => cl.value === descR.value)?.source ?? null
            : null)
        : null,
      resonance: c.resonance[0]?.source ?? null,
    },
  };
}

/** Convenience accessor: returns the materialised plural Emotion. */
export function getEmotion(id: string): Emotion | null {
  const rawE = RAW_EMOTION_MAP.get(id);
  return rawE ? materialise(rawE) : null;
}

/**
 * Live resonance — the 10-axis vector for an emotion under the active
 * context. Equals the Marina canonical when no lens / no overlays. With
 * a lens active and overlays present, this returns a weighted average
 * over lens-aligned claims. This is the single fact that any visual
 * engine (chromatics, typeset, motion) must consult when it wants to
 * "feel" the active perspective.
 */
export function liveResonance(emotionId: string, ctx: ReadContext = {}): import("@/types").ResonanceAxes {
  const rawE = RAW_EMOTION_MAP.get(emotionId);
  const e = rawE ? materialise(rawE) : null;
  if (!e?.claims?.resonance) return e?.resonance ?? {
    energy: 50, temperature: 50, tension: 50, density: 50, movement: 50,
    temporality: 50, humanity: 50, clarity: 50, intimacy: 50, control: 50,
  };
  // consensusResonance returns weighted average across the lens-relevant
  // claims. Marina's claim (lens-less, weight 1) always contributes; lens
  // claims boost when the reader's lens matches.
  // Import lazily to avoid circular module init.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { consensusResonance } = require("@/lib/consensus") as typeof import("@/lib/consensus");
  return consensusResonance(e.claims.resonance, ctx) ?? e.resonance;
}

/**
 * Returns true when the lens-aware live resonance differs meaningfully
 * (any axis off by ≥ 4 units) from the canonical Marina vector. Engines
 * use this to decide whether to recompute their assignment or reuse the
 * cached unique-assignment value.
 */
export function lensShiftsResonance(emotionId: string, ctx: ReadContext): boolean {
  if (!ctx.lens) return false;
  const rawE = RAW_EMOTION_MAP.get(emotionId);
  const e = rawE ? materialise(rawE) : null;
  if (!e?.claims?.resonance) return false;
  const live = liveResonance(emotionId, ctx);
  const canon = e.resonance;
  for (const k of Object.keys(canon) as Array<keyof typeof canon>) {
    if (Math.abs(live[k] - canon[k]) >= 4) return true;
  }
  return false;
}

export function listLensesPresent(emotionId: string): LensKey[] {
  const rawE = RAW_EMOTION_MAP.get(emotionId);
  const e = rawE ? materialise(rawE) : null;
  if (!e?.claims) return [];
  const s = new Set<LensKey>();
  for (const field of Object.values(e.claims)) {
    for (const claim of field as Claim<unknown>[]) {
      if (claim.lens) s.add(claim.lens);
    }
  }
  return [...s];
}
