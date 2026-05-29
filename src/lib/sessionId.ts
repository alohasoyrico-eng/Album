/**
 * Anonymous per-visitor session identity.
 *
 * No authentication in the participation MVP. Each visitor gets a ULID
 * generated locally on first visit, persisted in localStorage. The
 * session id is used to:
 *   - tag claims this visitor submits
 *   - cap voting (one vote per claim per session — enforced by the
 *     UNIQUE constraint on claim_votes)
 *   - mark "your own claims" in the UI for retraction
 *
 * The session row is created in Supabase lazily on first write so cold
 * visitors don't generate empty rows.
 */

import { ulid } from "ulid";
import { supabase, isParticipationEnabled } from "./supabaseClient";

const STORAGE_KEY = "album:session-id";

let _cached: string | null = null;
let _ensuredRemote = false;

export function getSessionId(): string {
  if (_cached) return _cached;
  if (typeof window === "undefined") {
    // SSR: return a placeholder; client will overwrite after hydration.
    return "ssr-placeholder";
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored.length >= 8) {
      _cached = stored;
      return stored;
    }
  } catch {
    /* storage blocked */
  }
  const fresh = ulid();
  try { window.localStorage.setItem(STORAGE_KEY, fresh); } catch { /* storage blocked */ }
  _cached = fresh;
  return fresh;
}

/**
 * Idempotent — create the session row in Supabase if we haven't yet.
 * Safe to call before every write. Failures are silent (no participation
 * backend → no-op).
 */
export async function ensureSessionRow(): Promise<void> {
  if (_ensuredRemote) return;
  if (!isParticipationEnabled()) return;
  const sb = supabase();
  if (!sb) return;
  const id = getSessionId();
  if (id === "ssr-placeholder") return;
  try {
    await sb.from("sessions").upsert(
      { id, user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 256) : null },
      { onConflict: "id", ignoreDuplicates: true },
    );
    _ensuredRemote = true;
  } catch {
    /* swallow — participation degraded but app still works */
  }
}
