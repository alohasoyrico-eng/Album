/**
 * Generic claim-shape adapter factory.
 *
 * The pattern is identical for every catalogued entity:
 *   1. Each canonical field becomes a [marina|heller|...]Claim of weight 1.
 *   2. Overlays from curators / lenses / users register additional claims.
 *   3. `resolveX(id, ctx)` produces a context-aware view that respects
 *      lens, user identity, vote counts, inferred contributions.
 *
 * Rather than re-author this pattern for each of the 11 cultural
 * disciplines (artworks, music, films, poetry, sculpture, dance,
 * architecture, photography, literature, ritual, theater), this factory
 * mints the adapter for any entity that has an `id`, a `description`
 * (or comparable narrative field), and a `resonance` vector.
 *
 * Phase 1 closes here: every Álbum entity is uniformly claim-shaped.
 * Phase 2 (participation backend) will feed claims into all these
 * adapters through a single channel.
 */

import { marinaClaim, type Claim, type Claimed, type ReadContext, type LensKey } from "@/types/claims";
import { resolve, consensusResonance, consensusList } from "./consensus";
import type { ResonanceAxes } from "@/types";

export interface CulturalClaims {
  /** Free-text narrative / description. */
  description: Claimed<string>;
  /** Poetic / editorial blurb if the seed has one. */
  poeticDescription: Claimed<string>;
  /** Resonance vector — the only claim that the visual engines care about. */
  resonance: Claimed<ResonanceAxes>;
  /** Cultural classification or family. */
  culture: Claimed<string>;
  /** Atmosphere tags. */
  atmosphereTags: Claimed<string[]>;
}

export interface CulturalEntity {
  id: string;
  description?: string;
  poeticDescription?: string;
  resonance: ResonanceAxes;
  culture?: string;
  language?: string;
  country?: string;
  atmosphereTags?: string[];
  claims?: CulturalClaims;
}

export interface ResolvedCultural {
  id: string;
  description: string;
  poeticDescription: string;
  resonance: ResonanceAxes;
  culture: string;
  atmosphereTags: string[];
  contested: { description: number; resonance: number };
  alternatives: { description: Claim<string> | null };
}

interface AdapterOptions<E extends CulturalEntity> {
  /** Display name of the kind, used in error messages. */
  kind: string;
  /** The raw catalogue array. */
  raw: E[];
  /** Map of id → entity for direct lookup. */
  rawMap: Map<string, E>;
  /** How to extract the source field for canonical claim baseline.
   *  Cultural items have varied schemas, so we let callers map them. */
  pick?: Partial<{
    description: (e: E) => string | undefined;
    poeticDescription: (e: E) => string | undefined;
    culture: (e: E) => string | undefined;
    atmosphereTags: (e: E) => string[] | undefined;
  }>;
}

export interface ClaimAdapter<E extends CulturalEntity> {
  /** Same array as raw, with claims materialised. */
  PLURAL: E[];
  /** Map keyed by id. */
  MAP_PLURAL: Map<string, E>;
  /** Append claims for an existing entity. */
  registerOverlay: (id: string, claims: Partial<CulturalClaims>) => void;
  /** Context-aware reader. */
  resolve: (id: string, ctx?: ReadContext) => ResolvedCultural | null;
  /** List active lenses present in the claims for this id. */
  listLensesPresent: (id: string) => LensKey[];
}

export function makeClaimAdapter<E extends CulturalEntity>(
  opts: AdapterOptions<E>,
): ClaimAdapter<E> {
  const { raw, rawMap, pick = {} } = opts;
  const _overlays: Record<string, Partial<CulturalClaims>> = {};
  const _materialised = new Map<string, E>();
  // Generation counter per-id: bumped by registerOverlay so that any
  // previously cached materialisation (built before the overlay arrived)
  // is invalidated on the next read. Without this, the lazy PLURAL cache
  // can latch onto a pre-overlay snapshot and mask all later claims.
  const _overlayGenById = new Map<string, number>();

  function makeClaims(e: E): CulturalClaims {
    const desc = pick.description?.(e) ?? e.description ?? "";
    const poetic = pick.poeticDescription?.(e) ?? e.poeticDescription ?? "";
    const culture = pick.culture?.(e) ?? e.culture ?? e.language ?? e.country ?? "";
    const tags = pick.atmosphereTags?.(e) ?? e.atmosphereTags ?? [];
    return {
      description:       desc ? [marinaClaim(desc)] : [],
      poeticDescription: poetic ? [marinaClaim(poetic)] : [],
      resonance:         [marinaClaim(e.resonance)],
      culture:           culture ? [marinaClaim(culture)] : [],
      atmosphereTags:    [marinaClaim(tags)],
    };
  }

  function merge(base: CulturalClaims, overlay?: Partial<CulturalClaims>): CulturalClaims {
    if (!overlay) return base;
    const out: CulturalClaims = { ...base };
    for (const key of Object.keys(overlay) as Array<keyof CulturalClaims>) {
      const extra = overlay[key];
      if (!extra) continue;
      (out as unknown as Record<string, Claim<unknown>[]>)[key] = [
        ...(base[key] as Claim<unknown>[]),
        ...(extra as Claim<unknown>[]),
      ];
    }
    return out;
  }

  function materialise(e: E): E {
    const cached = _materialised.get(e.id);
    if (cached && !_overlays[e.id]) return cached;
    const gen = _overlayGenById.get(e.id) ?? 0;
    if (cached && (cached as E & { __gen?: number }).__gen === gen) return cached;
    const base = makeClaims(e);
    const claims = merge(base, _overlays[e.id]);
    const ext: E & { __gen?: number } = { ...e, claims };
    ext.__gen = gen;
    _materialised.set(e.id, ext);
    // Invalidate the cached PLURAL array — next access re-materialises.
    _pluralCache = null;
    return ext;
  }

  // LAZY MATERIALISATION (perf): we no longer call `raw.map(materialise)`
  // at module init — for the ~1,300 cultural items × 5 fields each that
  // was ~6,500 object allocations during cold boot. Instead, PLURAL is a
  // proxy view backed by `materialise()` per-id; consumers that iterate
  // get the materialised array on demand, callers that resolve a single
  // id only pay for that one. The raw arrays already have `claims = undefined`
  // — the resolver detects this and materialises on first read.
  let _pluralCache: E[] | null = null;
  const getPlural = (): E[] => {
    if (_pluralCache) return _pluralCache;
    _pluralCache = raw.map(materialise);
    return _pluralCache;
  };
  // MAP_PLURAL is similarly lazy: we resolve by id through `materialise`
  // when asked, so the Map never has to be pre-populated.
  const MAP_PLURAL = new Proxy(new Map<string, E>(), {
    get(target, prop) {
      if (prop === "get") {
        return (id: string) => {
          const cached = target.get(id);
          if (cached) return cached;
          const r = rawMap.get(id);
          if (!r) return undefined;
          const ext = materialise(r as E);
          target.set(id, ext);
          return ext;
        };
      }
      if (prop === "size") {
        return raw.length;
      }
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });

  return {
    get PLURAL() { return getPlural(); },
    MAP_PLURAL,
    registerOverlay(id, claims) {
      const cur = _overlays[id] ?? {};
      for (const key of Object.keys(claims) as Array<keyof CulturalClaims>) {
        const next = claims[key] as Claim<unknown>[] | undefined;
        if (!next) continue;
        const prev = (cur[key] as Claim<unknown>[] | undefined) ?? [];
        (cur as Record<string, Claim<unknown>[]>)[key] = [...prev, ...next];
      }
      _overlays[id] = cur;
      _overlayGenById.set(id, (_overlayGenById.get(id) ?? 0) + 1);
      // Drop the per-id cache so the next read re-materialises with overlays.
      _materialised.delete(id);
      _pluralCache = null;
    },
    resolve(id, ctx = {}) {
      const e = MAP_PLURAL.get(id) ?? (rawMap.get(id) ? materialise(rawMap.get(id) as E) : null);
      if (!e?.claims) return null;
      const c = e.claims;
      const desc = resolve(c.description, ctx);
      const reson = resolve(c.resonance, ctx);
      const resR = consensusResonance(c.resonance, ctx);
      return {
        id: e.id,
        description: desc.value ?? e.description ?? "",
        poeticDescription: resolve(c.poeticDescription, ctx).value ?? e.poeticDescription ?? "",
        resonance: resR ?? e.resonance,
        culture: resolve(c.culture, ctx).value ?? e.culture ?? "",
        atmosphereTags: consensusList(c.atmosphereTags, ctx),
        contested: { description: desc.contested, resonance: reson.contested },
        alternatives: { description: desc.alternatives[0] ?? null },
      };
    },
    listLensesPresent(id) {
      const e = MAP_PLURAL.get(id);
      if (!e?.claims) return [];
      const s = new Set<LensKey>();
      for (const field of Object.values(e.claims)) {
        for (const claim of field as Claim<unknown>[]) if (claim.lens) s.add(claim.lens);
      }
      return [...s];
    },
  };
}
