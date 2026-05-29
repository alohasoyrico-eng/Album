/**
 * Participation API — the bridge between Supabase and the in-memory
 * claim adapters.
 *
 * Three responsibilities:
 *
 *   1. HYDRATE: on entity page mount, fetch all claims about that entity
 *      from Supabase, transform each row into a Claim<T>, and push it
 *      into the corresponding adapter via its `register*Overlay` API.
 *      The next consensus read (resolveEmotion / resolveColor / etc.)
 *      sees the remote claims alongside Marina canonical.
 *
 *   2. SUBSCRIBE: open a realtime channel scoped to the entity and feed
 *      future inserts/updates/deletes back through the same registration
 *      path. When another visitor submits a reading on this same page,
 *      it appears live.
 *
 *   3. WRITE: `submitClaim` (new reading) and `voteClaim` (±1 thumb)
 *      take care of (a) optimistically pushing into the adapter so the
 *      author sees their own claim immediately, (b) persisting in
 *      Supabase, and (c) tagging with the session id so retraction +
 *      vote-uniqueness work.
 *
 * Failure mode: if the Supabase env vars are absent, every function is a
 * no-op and the Marina canonical readings remain authoritative.
 */

import { supabase, isParticipationEnabled } from "./supabaseClient";
import { ensureSessionRow, getSessionId } from "./sessionId";
import type { Claim, ClaimSource, LensKey } from "@/types/claims";
import { registerOverlay as registerEmotionOverlay } from "@/data/ontology/emotions-claims";
import { registerColorOverlay } from "@/data/colors/colors-claims";
import { registerClanOverlay } from "@/data/ontology/clans-claims";
import { registerTribeOverlay } from "@/data/ontology/tribes-claims";
import { registerCulturalOverlay, type CulturalKind } from "@/data/seed/cultural-claims";
import type { CulturalClaims } from "./makeClaimAdapter";

// ─── Entity kinds we accept claims for ────────────────────────────────

export type ParticipationKind =
  | "emotion" | "color" | "clan" | "tribe"
  | CulturalKind;

// ─── DB row → Claim<T> ────────────────────────────────────────────────

interface ClaimRow {
  id: string;
  entity_kind: ParticipationKind;
  entity_id: string;
  field_path: string;
  source_kind: "user" | "curator" | "inference" | "import";
  source_id: string | null;
  lens: string | null;
  value: unknown;
  weight: number;
  evidence: string | null;
  vote_score: number;
  vote_total: number;
  created_at: string;
}

function rowToClaim(row: ClaimRow): Claim<unknown> {
  let source: ClaimSource;
  switch (row.source_kind) {
    case "user":      source = { kind: "user",   id: row.source_id ?? "anon" }; break;
    case "curator":   source = { kind: "curator", id: row.source_id ?? "anon" }; break;
    case "inference": source = { kind: "inference", method: row.source_id ?? "unknown" }; break;
    case "import":    source = { kind: "import", provenance: row.source_id ?? "unknown" }; break;
  }
  // Vote score nudges effective weight ±20 % through votes field; the
  // base weight in the DB is the authored confidence.
  return {
    id: row.id,
    source,
    value: row.value,
    weight: row.weight,
    evidence: row.evidence ?? undefined,
    lens: (row.lens as LensKey | null) ?? undefined,
    votes: row.vote_total > 0
      ? { up: Math.max(0, (row.vote_score + row.vote_total) / 2),
          down: Math.max(0, (row.vote_total - row.vote_score) / 2) }
      : undefined,
    createdAt: row.created_at,
  };
}

// ─── Push a row into the right adapter ────────────────────────────────

function pushToAdapter(row: ClaimRow) {
  const claim = rowToClaim(row);
  // Each adapter takes Partial<XClaims> shaped { fieldPath: [claim] }.
  const overlay: Record<string, Claim<unknown>[]> = {
    [row.field_path]: [claim],
  };
  switch (row.entity_kind) {
    case "emotion":
      registerEmotionOverlay(row.entity_id, overlay as Parameters<typeof registerEmotionOverlay>[1]);
      break;
    case "color":
      registerColorOverlay(row.entity_id, overlay as Parameters<typeof registerColorOverlay>[1]);
      break;
    case "clan":
      registerClanOverlay(row.entity_id, overlay as Parameters<typeof registerClanOverlay>[1]);
      break;
    case "tribe":
      registerTribeOverlay(row.entity_id, overlay as Parameters<typeof registerTribeOverlay>[1]);
      break;
    default:
      registerCulturalOverlay(
        row.entity_kind as CulturalKind,
        row.entity_id,
        overlay as Partial<CulturalClaims>,
      );
  }
}

// ─── Listener registry — components subscribe to be notified ─────────

const _listeners = new Set<() => void>();
function notifyChanged() { _listeners.forEach((l) => l()); }

export function subscribeToClaimsChanges(cb: () => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

// ─── Hydration ────────────────────────────────────────────────────────

/**
 * Load every remote claim about (kind, id) and feed it into the in-memory
 * adapter. Returns the number of rows hydrated. Safe to call multiple times.
 */
export async function hydrateClaims(
  kind: ParticipationKind,
  entityId: string,
): Promise<number> {
  const sb = supabase();
  if (!sb) return 0;
  try {
    const { data, error } = await sb
      .from("claims")
      .select("*")
      .eq("entity_kind", kind)
      .eq("entity_id", entityId);
    if (error || !data) return 0;
    for (const row of data as ClaimRow[]) pushToAdapter(row);
    if (data.length > 0) notifyChanged();
    return data.length;
  } catch {
    return 0;
  }
}

// ─── Realtime subscription ────────────────────────────────────────────

/**
 * Open a realtime channel scoped to the entity. Returns an unsubscribe.
 * Every insert/update merges into the adapter and notifies listeners.
 */
export function subscribeToEntity(
  kind: ParticipationKind,
  entityId: string,
): () => void {
  const sb = supabase();
  if (!sb) return () => {};
  const channel = sb
    .channel(`claims:${kind}:${entityId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "claims",
        filter: `entity_id=eq.${entityId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as ClaimRow | undefined;
        if (!row) return;
        if (row.entity_kind !== kind) return;
        if (payload.eventType === "DELETE") {
          // Soft: we don't have a "remove claim" path in the adapter, so
          // the deleted claim simply lingers in memory until reload.
          // Acceptable for MVP.
          return;
        }
        pushToAdapter(row);
        notifyChanged();
      },
    )
    .subscribe();
  return () => { void sb.removeChannel(channel); };
}

// ─── Write: submit a new claim ────────────────────────────────────────

export interface SubmitClaimArgs {
  kind: ParticipationKind;
  entityId: string;
  fieldPath: string;          // 'description' | 'name' | 'poeticIntro' | …
  value: unknown;             // string for prose; ResonanceAxes for vector; etc.
  lens?: LensKey;
  evidence?: string;
  weight?: number;
}

export async function submitClaim(args: SubmitClaimArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isParticipationEnabled()) {
    return { ok: false, error: "participation backend not configured" };
  }
  const sb = supabase();
  if (!sb) return { ok: false, error: "no client" };

  await ensureSessionRow();
  const sessionId = getSessionId();

  try {
    const { data, error } = await sb.from("claims").insert({
      entity_kind: args.kind,
      entity_id: args.entityId,
      field_path: args.fieldPath,
      source_kind: "user",
      source_id: sessionId,
      lens: args.lens ?? null,
      value: args.value,
      weight: args.weight ?? 0.5,
      evidence: args.evidence ?? null,
    }).select("*").single();
    if (error || !data) return { ok: false, error: error?.message };
    // Optimistic merge so the author sees their claim immediately.
    pushToAdapter(data as ClaimRow);
    notifyChanged();
    return { ok: true, id: (data as ClaimRow).id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "submit failed" };
  }
}

// ─── Write: vote ±1 on a claim ────────────────────────────────────────

export async function voteClaim(
  claimId: string,
  direction: 1 | -1,
): Promise<{ ok: boolean }> {
  if (!isParticipationEnabled()) return { ok: false };
  const sb = supabase();
  if (!sb) return { ok: false };
  await ensureSessionRow();
  const voterId = getSessionId();
  try {
    // upsert so changing direction overwrites the previous vote
    const { error } = await sb.from("claim_votes").upsert(
      { claim_id: claimId, voter_id: voterId, direction },
      { onConflict: "claim_id,voter_id" },
    );
    if (error) return { ok: false };
    notifyChanged();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function retractVote(claimId: string): Promise<{ ok: boolean }> {
  if (!isParticipationEnabled()) return { ok: false };
  const sb = supabase();
  if (!sb) return { ok: false };
  const voterId = getSessionId();
  try {
    await sb.from("claim_votes")
      .delete()
      .eq("claim_id", claimId)
      .eq("voter_id", voterId);
    notifyChanged();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ─── React hook: re-render when claims change ─────────────────────────
// Components consume this to invalidate their useMemo() deps. Pair it
// with a `version` counter in the dep array.

import { useEffect, useState } from "react";
export function useClaimsVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => subscribeToClaimsChanges(() => setV((x) => x + 1)), []);
  return v;
}
