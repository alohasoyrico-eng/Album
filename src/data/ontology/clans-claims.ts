/**
 * Claims adapter for the Clan catalogue. Mirror of emotions-claims with
 * fewer fields. Marina's clan definitions become the canonical claim;
 * curators / lenses can register overlays via `registerClanOverlay`.
 */

import type { Clan, ClanClaims } from "@/types";
import { marinaClaim } from "@/types/claims";
import type { Claim, ReadContext, LensKey } from "@/types/claims";
import { resolve, consensusList } from "@/lib/consensus";
import { CLANS as RAW_CLANS, CLAN_MAP as RAW_CLAN_MAP } from "./clans";

const _overlays: Record<string, Partial<ClanClaims>> = {};

export function registerClanOverlay(clanId: string, claims: Partial<ClanClaims>) {
  const cur = _overlays[clanId] ?? {};
  for (const key of Object.keys(claims) as Array<keyof ClanClaims>) {
    const next = claims[key] as Claim<unknown>[] | undefined;
    if (!next) continue;
    const prev = (cur[key] as Claim<unknown>[] | undefined) ?? [];
    (cur as Record<string, Claim<unknown>[]>)[key] = [...prev, ...next];
  }
  _overlays[clanId] = cur;
}

function makeClaims(c: Clan): ClanClaims {
  return {
    name:        [marinaClaim(c.name)],
    description: [marinaClaim(c.description)],
    feelings:    [marinaClaim(c.feelings)],
    antonyms:    [marinaClaim(c.antonyms)],
  };
}

function mergeClaims(base: ClanClaims, overlay?: Partial<ClanClaims>): ClanClaims {
  if (!overlay) return base;
  const out: ClanClaims = { ...base };
  for (const key of Object.keys(overlay) as Array<keyof ClanClaims>) {
    const extra = overlay[key];
    if (!extra) continue;
    (out as unknown as Record<string, Claim<unknown>[]>)[key] = [
      ...(base[key] as Claim<unknown>[]),
      ...(extra as Claim<unknown>[]),
    ];
  }
  return out;
}

const _materialised = new Map<string, Clan>();
function materialise(c: Clan): Clan {
  const cached = _materialised.get(c.id);
  if (cached && !_overlays[c.id]) return cached;
  const base = cached?.claims ?? makeClaims(c);
  const claims = mergeClaims(base, _overlays[c.id]);
  const ext: Clan = { ...c, claims };
  _materialised.set(c.id, ext);
  return ext;
}

export const CLANS_PLURAL: Clan[] = RAW_CLANS.map(materialise);
export const CLAN_MAP_PLURAL = new Map(CLANS_PLURAL.map((c) => [c.id, c]));

for (const raw of RAW_CLANS) {
  if (!raw.claims) raw.claims = makeClaims(raw);
}
void RAW_CLAN_MAP;

export interface ResolvedClan {
  id: string;
  name: string;
  description: string;
  feelings: string[];
  antonyms: string[];
  contested: { description: number };
  alternatives: { description: Claim<string> | null };
}

export function resolveClan(clanId: string, ctx: ReadContext = {}): ResolvedClan | null {
  const c = CLAN_MAP_PLURAL.get(clanId) ?? materialise(RAW_CLAN_MAP.get(clanId)!);
  if (!c?.claims) return null;
  const desc = resolve(c.claims.description, ctx);
  return {
    id: c.id,
    name: resolve(c.claims.name, ctx).value ?? c.name,
    description: desc.value ?? c.description,
    feelings: consensusList(c.claims.feelings, ctx),
    antonyms: consensusList(c.claims.antonyms, ctx),
    contested: { description: desc.contested },
    alternatives: { description: desc.alternatives[0] ?? null },
  };
}

export function listClanLensesPresent(clanId: string): LensKey[] {
  const c = CLAN_MAP_PLURAL.get(clanId);
  if (!c?.claims) return [];
  const s = new Set<LensKey>();
  for (const field of Object.values(c.claims)) {
    for (const claim of field as Claim<unknown>[]) if (claim.lens) s.add(claim.lens);
  }
  return [...s];
}

// Apply seed overlays AFTER `_overlays` exists (TDZ guard).
import { applyClanSeedOverlays } from "./_seed-clan-overlays";
applyClanSeedOverlays();
