/**
 * Server-only queries to Supabase.
 * These functions are called from Server Components.
 * They are NOT available on the client.
 */

import { supabase } from "@/lib/supabaseClient";

export interface EmotionRow {
  id: string;
  name: string;
  tribe: string;
  clan: string | null;
  description: string | null;
  poetic_intro: string | null;
  resonance: Record<string, number> | null;
}

export interface ClanRow {
  id: string;
  name: string;
  tribe: string;
  description: string | null;
}

export interface TribeRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

export interface ColorRow {
  id: string;
  name_es: string;
  hex: string | null;
  description: string | null;
}

/**
 * Fetch a single emotion by ID.
 * Returns null if not found.
 */
export async function fetchEmotion(id: string): Promise<EmotionRow | null> {
  const client = supabase();
  if (!client) return null;

  const { data, error } = await client
    .from("emotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as EmotionRow;
}

/**
 * Fetch a single clan by ID.
 */
export async function fetchClan(id: string): Promise<ClanRow | null> {
  const client = supabase();
  if (!client) return null;

  const { data, error } = await client
    .from("clans")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ClanRow;
}

/**
 * Fetch a single tribe by ID.
 */
export async function fetchTribe(id: string): Promise<TribeRow | null> {
  const client = supabase();
  if (!client) return null;

  const { data, error } = await client
    .from("tribes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as TribeRow;
}

/**
 * Fetch a single color by ID.
 */
export async function fetchColor(id: string): Promise<ColorRow | null> {
  const client = supabase();
  if (!client) return null;

  const { data, error } = await client
    .from("colors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as ColorRow;
}

/**
 * Fetch all emotion IDs (for validation in fallback cases).
 */
export async function fetchAllEmotionIds(): Promise<string[]> {
  const client = supabase();
  if (!client) return [];

  const { data, error } = await client
    .from("emotions")
    .select("id");

  if (error || !data) return [];
  return data.map((row) => (row as { id: string }).id);
}

/**
 * Fetch all clan IDs.
 */
export async function fetchAllClanIds(): Promise<string[]> {
  const client = supabase();
  if (!client) return [];

  const { data, error } = await client
    .from("clans")
    .select("id");

  if (error || !data) return [];
  return data.map((row) => (row as { id: string }).id);
}

/**
 * Fetch all tribe IDs.
 */
export async function fetchAllTribeIds(): Promise<string[]> {
  const client = supabase();
  if (!client) return [];

  const { data, error } = await client
    .from("tribes")
    .select("id");

  if (error || !data) return [];
  return data.map((row) => (row as { id: string }).id);
}

/**
 * Fetch all color IDs.
 */
export async function fetchAllColorIds(): Promise<string[]> {
  const client = supabase();
  if (!client) return [];

  const { data, error } = await client
    .from("colors")
    .select("id");

  if (error || !data) return [];
  return data.map((row) => (row as { id: string }).id);
}
