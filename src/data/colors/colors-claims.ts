/**
 * Claims adapter for the Color catalogue — mirror of emotions-claims.
 *
 * Heller's Western European survey provides the seed. Other lenses can
 * register overlays here (eastern, indigenous, afrodiasporic, queer)
 * each with its own claims about what a color means.
 *
 * Example: pure white reads as purity in Heller's data. In many East
 * Asian traditions it reads as mourning. Both are true; both coexist as
 * claims; the active lens picks which surfaces.
 */

import type { ColorResonance, ColorClaims } from "@/types";
import { hellerClaim, curatorClaim } from "@/types/claims";
import type { Claim, Claimed, ReadContext, LensKey } from "@/types/claims";
import { resolve, consensusResonance, consensusList } from "@/lib/consensus";
import { COLORS as RAW_COLORS, COLOR_MAP as RAW_COLOR_MAP } from "./colorResonance";

const _overlays: Record<string, Partial<ColorClaims>> = {};

export function registerColorOverlay(colorId: string, claims: Partial<ColorClaims>) {
  const cur = _overlays[colorId] ?? {};
  for (const key of Object.keys(claims) as Array<keyof ColorClaims>) {
    const next = claims[key] as Claim<unknown>[] | undefined;
    if (!next) continue;
    const prev = (cur[key] as Claim<unknown>[] | undefined) ?? [];
    (cur as Record<string, Claim<unknown>[]>)[key] = [...prev, ...next];
  }
  _overlays[colorId] = cur;
}

function makeClaims(c: ColorResonance): ColorClaims {
  return {
    nameEs:                [hellerClaim(c.nameEs)],
    name:                  [hellerClaim(c.name)],
    description:           [hellerClaim(c.description)],
    hellerQuote:           [hellerClaim(c.hellerQuote)],
    resonance:             [hellerClaim(c.resonance)],
    primaryEmotions:       [hellerClaim(c.primaryEmotions)],
    contradictoryEmotions: [hellerClaim(c.contradictoryEmotions)],
    culturalMeanings:      [hellerClaim(c.culturalMeanings)],
    symbolism:             [hellerClaim(c.symbolism)],
  };
}

function mergeClaims(base: ColorClaims, overlay?: Partial<ColorClaims>): ColorClaims {
  if (!overlay) return base;
  const out: ColorClaims = { ...base };
  for (const key of Object.keys(overlay) as Array<keyof ColorClaims>) {
    const extra = overlay[key];
    if (!extra) continue;
    (out as unknown as Record<string, Claim<unknown>[]>)[key] = [
      ...(base[key] as Claim<unknown>[]),
      ...(extra as Claim<unknown>[]),
    ];
  }
  return out;
}

const _materialised = new Map<string, ColorResonance>();
function materialise(c: ColorResonance): ColorResonance {
  const cached = _materialised.get(c.id);
  if (cached && !_overlays[c.id]) return cached;
  const base = cached?.claims ?? makeClaims(c);
  const claims = mergeClaims(base, _overlays[c.id]);
  const ext: ColorResonance = { ...c, claims };
  _materialised.set(c.id, ext);
  return ext;
}

export const COLORS_PLURAL: ColorResonance[] = RAW_COLORS.map(materialise);
export const COLOR_MAP_PLURAL = new Map(COLORS_PLURAL.map((c) => [c.id, c]));

// Side-effect: backfill `claims` on raw exports too.
for (const raw of RAW_COLORS) {
  if (!raw.claims) raw.claims = makeClaims(raw);
}
void RAW_COLOR_MAP;

// ─── Resolver ───────────────────────────────────────────────────────────

export interface ResolvedColor {
  id: string;
  nameEs: string;
  name: string;
  hex: string;
  description: string;
  hellerQuote: string;
  resonance: import("@/types").ResonanceAxes;
  primaryEmotions: string[];
  contradictoryEmotions: string[];
  culturalMeanings: string[];
  symbolism: string[];
  contested: { description: number; resonance: number };
  alternatives: { description: Claim<string> | null; hellerQuote: Claim<string> | null };
}

export function resolveColor(colorId: string, ctx: ReadContext = {}): ResolvedColor | null {
  const c = COLOR_MAP_PLURAL.get(colorId) ?? materialise(RAW_COLOR_MAP.get(colorId)!);
  if (!c) return null;
  const cl = c.claims!;
  const desc = resolve(cl.description, ctx);
  const heller = resolve(cl.hellerQuote, ctx);
  const reson = resolve(cl.resonance, ctx);
  const resR = consensusResonance(cl.resonance, ctx);
  return {
    id: c.id,
    nameEs: resolve(cl.nameEs, ctx).value ?? c.nameEs,
    name:   resolve(cl.name, ctx).value ?? c.name,
    hex: c.hex,
    description: desc.value ?? c.description,
    hellerQuote: heller.value ?? c.hellerQuote,
    resonance: resR ?? c.resonance,
    primaryEmotions: consensusList(cl.primaryEmotions, ctx),
    contradictoryEmotions: consensusList(cl.contradictoryEmotions, ctx),
    culturalMeanings: consensusList(cl.culturalMeanings, ctx),
    symbolism: consensusList(cl.symbolism, ctx),
    contested: { description: desc.contested, resonance: reson.contested },
    alternatives: {
      description: desc.alternatives[0] ?? null,
      hellerQuote: heller.alternatives[0] ?? null,
    },
  };
}

export function listColorLensesPresent(colorId: string): LensKey[] {
  const c = COLOR_MAP_PLURAL.get(colorId);
  if (!c?.claims) return [];
  const s = new Set<LensKey>();
  for (const field of Object.values(c.claims)) {
    for (const claim of field as Claim<unknown>[]) {
      if (claim.lens) s.add(claim.lens);
    }
  }
  return [...s];
}

// Apply seed cultural overlays AFTER `_overlays` exists (TDZ guard).
import { applyColorSeedOverlays } from "./_seed-color-overlays";
applyColorSeedOverlays();

// Re-export Claimed for the seed file to avoid duplicate imports.
export type { Claimed };
