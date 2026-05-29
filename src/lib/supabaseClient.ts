/**
 * Supabase client singleton.
 *
 * The URL and anon key are public-safe: the anon role is bound by the
 * row-level security policies defined in supabase/migrations/0001_init.sql.
 * Anyone can SELECT claims/votes/sessions, anyone can INSERT a claim
 * tagged with a user session id, and anyone can vote ±1 once per claim.
 *
 * If the env vars are absent (e.g. dev forks without the Supabase
 * project linked), every read returns empty and every write is a no-op.
 * The Marina canonical readings keep working as the default.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!url || !key) return null;
  _client = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 8 } },
  });
  return _client;
}

export function isParticipationEnabled(): boolean {
  return Boolean(url && key);
}
