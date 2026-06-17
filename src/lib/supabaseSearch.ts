/**
 * Unified fulltext search via Supabase.
 *
 * Replaces the in-memory searchIndex.ts for live, dynamic search
 * across emotions, clans, tribes, colors, and typography.
 *
 * Queries the `search_all()` function on the server.
 */

import { supabase } from "./supabaseClient";

export interface SearchResult {
  id: string;
  kind: "emotion" | "clan" | "tribe" | "color" | "typography";
  title: string;
  subtitle: string;
  href: string;
  accent?: string;
  rank: number;
}

/**
 * Search across all entities. Returns results ranked by relevance.
 *
 * @param query - The search query (e.g. "tristeza", "melancolia")
 * @param limit - Max results to return (default 20)
 * @returns Array of SearchResult sorted by relevance
 */
export async function searchSupabase(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const client = supabase();
  if (!client) return []; // Supabase not configured

  const { data, error } = await client.rpc("search_all", {
    query: query.trim(),
    limit_count: limit,
  });

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    accent: row.accent,
    rank: row.rank,
  }));
}
