/**
 * Claims adapter for the Tribe catalogue. Lightest of the four ontology
 * layers — tribes mostly hold name + description; resonance lives on
 * the emotions they contain. Lens-specific overlays here re-narrate
 * what a tribe means under a perspective.
 */

import type { Tribe, TribeClaims } from "@/types";
import { marinaClaim } from "@/types/claims";
import type { Claim, ReadContext, LensKey } from "@/types/claims";
import { resolve } from "@/lib/consensus";
import { TRIBES as RAW_TRIBES, TRIBE_MAP as RAW_TRIBE_MAP } from "./tribes";

const _overlays: Record<string, Partial<TribeClaims>> = {};

export function registerTribeOverlay(tribeId: string, claims: Partial<TribeClaims>) {
  const cur = _overlays[tribeId] ?? {};
  for (const key of Object.keys(claims) as Array<keyof TribeClaims>) {
    const next = claims[key] as Claim<unknown>[] | undefined;
    if (!next) continue;
    const prev = (cur[key] as Claim<unknown>[] | undefined) ?? [];
    (cur as Record<string, Claim<unknown>[]>)[key] = [...prev, ...next];
  }
  _overlays[tribeId] = cur;
}

function makeClaims(t: Tribe): TribeClaims {
  return {
    name:        [marinaClaim(t.name)],
    nameEn:      [marinaClaim(t.nameEn)],
    description: [marinaClaim(t.description)],
  };
}

function mergeClaims(base: TribeClaims, overlay?: Partial<TribeClaims>): TribeClaims {
  if (!overlay) return base;
  const out: TribeClaims = { ...base };
  for (const key of Object.keys(overlay) as Array<keyof TribeClaims>) {
    const extra = overlay[key];
    if (!extra) continue;
    (out as unknown as Record<string, Claim<unknown>[]>)[key] = [
      ...(base[key] as Claim<unknown>[]),
      ...(extra as Claim<unknown>[]),
    ];
  }
  return out;
}

const _materialised = new Map<string, Tribe>();
function materialise(t: Tribe): Tribe {
  const cached = _materialised.get(t.id);
  if (cached && !_overlays[t.id]) return cached;
  const base = cached?.claims ?? makeClaims(t);
  const claims = mergeClaims(base, _overlays[t.id]);
  const ext: Tribe = { ...t, claims };
  _materialised.set(t.id, ext);
  return ext;
}

export const TRIBES_PLURAL: Tribe[] = RAW_TRIBES.map(materialise);
export const TRIBE_MAP_PLURAL = new Map<import("@/types").TribeId, Tribe>(
  TRIBES_PLURAL.map((t) => [t.id, t]),
);

for (const raw of RAW_TRIBES) {
  if (!raw.claims) raw.claims = makeClaims(raw);
}
void RAW_TRIBE_MAP;

export interface ResolvedTribe {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  contested: { description: number };
  alternatives: { description: Claim<string> | null };
}

export function resolveTribe(tribeId: string, ctx: ReadContext = {}): ResolvedTribe | null {
  const id = tribeId as import("@/types").TribeId;
  const t = TRIBE_MAP_PLURAL.get(id) ?? materialise(RAW_TRIBE_MAP.get(id)!);
  if (!t?.claims) return null;
  const desc = resolve(t.claims.description, ctx);
  return {
    id: t.id,
    name:        resolve(t.claims.name, ctx).value ?? t.name,
    nameEn:      resolve(t.claims.nameEn, ctx).value ?? t.nameEn,
    description: desc.value ?? t.description,
    contested:   { description: desc.contested },
    alternatives:{ description: desc.alternatives[0] ?? null },
  };
}

export function listTribeLensesPresent(tribeId: string): LensKey[] {
  const t = TRIBE_MAP_PLURAL.get(tribeId as import("@/types").TribeId);
  if (!t?.claims) return [];
  const s = new Set<LensKey>();
  for (const field of Object.values(t.claims)) {
    for (const claim of field as Claim<unknown>[]) if (claim.lens) s.add(claim.lens);
  }
  return [...s];
}

// Apply seed overlays AFTER `_overlays` exists (TDZ guard).
import { applyTribeSeedOverlays } from "./_seed-tribe-overlays";
applyTribeSeedOverlays();
