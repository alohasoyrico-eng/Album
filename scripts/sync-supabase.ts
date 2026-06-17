#!/usr/bin/env node
/**
 * Sincroniza los archivos seed (.ts) a Supabase.
 *
 * Uso:
 *   npx tsx scripts/sync-supabase.ts
 *
 * Variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_KEY (optional, para write con permisos elevados)
 */

import { createClient } from "@supabase/supabase-js";
import { EMOTIONS } from "../src/data/ontology/emotions";
import { CLANS } from "../src/data/ontology/clans";
import { TRIBES } from "../src/data/ontology/tribes";
import { COLORS } from "../src/data/colors/colorResonance";
import { TYPOGRAPHY } from "../src/data/typography/fonts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_KEY env vars required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function syncTribes() {
  console.log("🌍 Syncing tribes...");
  const rows = TRIBES.map((t) => ({
    id: t.id,
    name: t.name,
    name_en: t.nameEn,
    description: t.description,
    color: t.color,
    text_color: t.textColor,
  }));

  const { error } = await supabase
    .from("tribes")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
  console.log(`✅ Synced ${rows.length} tribes`);
}

async function syncClans() {
  console.log("🏛️  Syncing clans...");
  const rows = CLANS.map((c) => ({
    id: c.id,
    name: c.name,
    tribe: c.tribe,
    description: c.description,
    feelings: c.feelings || [],
    antonyms: c.antonyms || [],
    canonical_emotion: c.canonicalEmotion,
  }));

  const { error } = await supabase
    .from("clans")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
  console.log(`✅ Synced ${rows.length} clans`);
}

async function syncEmotions() {
  console.log("💫 Syncing emotions...");
  const rows = EMOTIONS.map((e) => ({
    id: e.id,
    name: e.name,
    name_en: e.nameEn,
    tribe: e.tribe,
    clan: e.clan,
    description: e.description,
    etymology: e.etymology,
    poetic_intro: e.poeticIntro,
    antonyms: e.antonyms || [],
    neighbors: e.neighbors || [],
    resonance: e.resonance,
    color_resonance: e.colorResonance || [],
    typography_resonance: e.typographyResonance || [],
    artwork_resonance: e.artworkResonance || [],
    music_resonance: e.musicResonance || [],
    film_resonance: e.filmResonance || [],
    poetry_resonance: e.poetryResonance || [],
    sculpture_resonance: e.sculptureResonance || [],
    dance_resonance: e.danceResonance || [],
    architecture_resonance: e.architectureResonance || [],
    photography_resonance: e.photographyResonance || [],
    literature_resonance: e.literatureResonance || [],
    ritual_resonance: e.ritualResonance || [],
    theater_resonance: e.theaterResonance || [],
    atmosphere_tags: e.atmosphereTags || [],
  }));

  const { error } = await supabase
    .from("emotions")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
  console.log(`✅ Synced ${rows.length} emotions`);
}

async function syncColors() {
  console.log("🎨 Syncing colors...");
  const rows = COLORS.map((c) => ({
    id: c.id,
    name_es: c.nameEs,
    name_en: c.name, // fallback: use name if nameEn doesn't exist
    hex: c.hex,
    description: c.description,
  }));

  const { error } = await supabase
    .from("colors")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
  console.log(`✅ Synced ${rows.length} colors`);
}

async function syncTypography() {
  console.log("📝 Syncing typography...");
  const rows = TYPOGRAPHY.map((t) => ({
    id: t.id,
    name: t.name,
    family: t.googleFontFamily || t.name,
    weights: [], // not present in source data
    styles: [], // not present in source data
    axis: null, // not present in source data
    google_family: t.googleFontFamily,
    description: t.description,
  }));

  const { error } = await supabase
    .from("typography")
    .upsert(rows, { onConflict: "id" });

  if (error) throw error;
  console.log(`✅ Synced ${rows.length} typography entries`);
}

async function main() {
  try {
    await syncTribes();
    await syncClans();
    await syncEmotions();
    await syncColors();
    await syncTypography();
    console.log("\n🎉 All seed data synced to Supabase!");
  } catch (err) {
    console.error("\n❌ Sync failed:", err);
    process.exit(1);
  }
}

main();
