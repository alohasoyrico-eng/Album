import type { ResonanceAxes, Emotion, ColorResonance, TypographyResonance } from "@/types";
import { EMOTIONS, EMOTION_MAP } from "@/data/ontology/emotions";
import { COLORS } from "@/data/colors/colorResonance";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { ARTWORKS } from "@/data/seed/artworks";
import { TRACKS } from "@/data/seed/music";
import { FILMS } from "@/data/seed/films";

// ─── Resonance Computation ───────────────────────────────────────────────────

export function resonanceDistance(a: ResonanceAxes, b: ResonanceAxes): number {
  const keys = Object.keys(a) as (keyof ResonanceAxes)[];
  const sum = keys.reduce((acc, key) => acc + Math.pow(a[key] - b[key], 2), 0);
  return Math.sqrt(sum / keys.length) / 100;
}

export function resonanceSimilarity(a: ResonanceAxes, b: ResonanceAxes): number {
  return 1 - resonanceDistance(a, b);
}

export function resonanceGravity(emotion: Emotion): number {
  return (
    emotion.neighbors.length * 0.4 +
    emotion.transitions.reduce((acc, t) => acc + t.strength, 0) * 0.3 +
    emotion.artworkResonance.length * 0.15 +
    emotion.musicResonance.length * 0.15
  );
}

// ─── Atmosphere Generation ───────────────────────────────────────────────────

export interface GeneratedAtmosphere {
  name: string;
  poeticDescription: string;
  dominantAxis: keyof ResonanceAxes;
  recessiveAxis: keyof ResonanceAxes;
  resonanceProfile: ResonanceAxes;
  tags: string[];
}

const ATMOSPHERE_NAMES: Record<string, string[]> = {
  cold_still: ["Glacial Stillness", "Winter Silence", "Frozen Contemplation", "Arctic Clarity"],
  hot_moving: ["Solar Surge", "Burning Rush", "Incandescent Motion", "Ignition"],
  dark_dense: ["Midnight Weight", "Obsidian Depth", "The Abyss Breathes", "Shadow Archive"],
  light_airy: ["Dawn Fragment", "Diaphanous", "Morning Aperture", "Liquid Light"],
  warm_intimate: ["Amber Interior", "Ember Language", "Hearth Chronicle", "Soft Gravity"],
  cold_vast: ["Oceanic Distance", "The Peripheral", "Horizon of No Return", "Spatial Elegy"],
  tense_dark: ["Pressure Before Thunder", "Suspended Catastrophe", "Taut Darkness", "Anticipatory Void"],
  calm_clear: ["Crystalline Absence", "Still Observatory", "Transparent Architecture", "Resolved Space"],
};

function classifyAtmosphere(r: ResonanceAxes): string {
  const isHot = r.temperature > 55;
  const isCold = r.temperature < 45;
  const isDark = r.clarity < 45;
  const isClear = r.clarity > 65;
  const isDense = r.density > 55;
  const isAiry = r.density < 35;
  const isMoving = r.movement > 55;
  const isStill = r.movement < 35;
  const isTense = r.tension > 60;
  const isIntimate = r.intimacy > 65;
  const isVast = r.intimacy < 35;

  if (isTense && isDark) return "tense_dark";
  if (isHot && isMoving) return "hot_moving";
  if (isCold && isStill) return "cold_still";
  if (isDark && isDense) return "dark_dense";
  if (isClear && isAiry) return "light_airy";
  if (isHot && isIntimate) return "warm_intimate";
  if (isCold && isVast) return "cold_vast";
  return "calm_clear";
}

function pickName(category: string): string {
  const names = ATMOSPHERE_NAMES[category] ?? ATMOSPHERE_NAMES["calm_clear"];
  return names[Math.floor(Math.random() * names.length)];
}

function dominantAxis(r: ResonanceAxes): keyof ResonanceAxes {
  return (Object.keys(r) as (keyof ResonanceAxes)[]).reduce((a, b) =>
    r[a] > r[b] ? a : b
  );
}

function recessiveAxis(r: ResonanceAxes): keyof ResonanceAxes {
  return (Object.keys(r) as (keyof ResonanceAxes)[]).reduce((a, b) =>
    r[a] < r[b] ? a : b
  );
}

function blendResonance(...axes: ResonanceAxes[]): ResonanceAxes {
  const keys = Object.keys(axes[0]) as (keyof ResonanceAxes)[];
  return keys.reduce(
    (acc, key) => ({
      ...acc,
      [key]: Math.round(axes.reduce((sum, r) => sum + r[key], 0) / axes.length),
    }),
    {} as ResonanceAxes
  );
}

export function generateAtmosphere(
  emotionId: string,
  colorId: string,
  fontId: string
): GeneratedAtmosphere {
  const emotion = EMOTION_MAP.get(emotionId);
  const color = COLORS.find((c) => c.id === colorId);
  const font = TYPOGRAPHY.find((t) => t.id === fontId);

  if (!emotion || !color || !font) {
    return {
      name: "Unknown Atmosphere",
      poeticDescription: "The combination resists description.",
      dominantAxis: "humanity",
      recessiveAxis: "control",
      resonanceProfile: { energy: 50, temperature: 50, tension: 50, density: 50, movement: 50, temporality: 50, humanity: 50, clarity: 50, intimacy: 50, control: 50 },
      tags: [],
    };
  }

  const blended = blendResonance(emotion.resonance, color.resonance, font.resonance);
  const category = classifyAtmosphere(blended);
  const name = pickName(category);
  const dom = dominantAxis(blended);
  const rec = recessiveAxis(blended);

  const tags = Array.from(new Set([
    ...emotion.atmosphereTags,
    ...color.symbolism.slice(0, 2),
  ])).slice(0, 6);

  const descriptions: string[] = [
    `${emotion.name} filtered through ${color.nameEs.toLowerCase()}: ${emotion.poeticIntro}`,
    `The typography of ${font.name} holds what neither the emotion nor the color can contain alone.`,
    `${color.hellerQuote}`,
  ];

  return {
    name,
    poeticDescription: descriptions.join(" "),
    dominantAxis: dom,
    recessiveAxis: rec,
    resonanceProfile: blended,
    tags,
  };
}

// ─── Finding Related Entities ─────────────────────────────────────────────────

export function findRelatedArtworks(emotionId: string, limit = 3) {
  return ARTWORKS.filter((a) => a.emotionResonance.includes(emotionId)).slice(0, limit);
}

export function findRelatedTracks(emotionId: string, limit = 3) {
  return TRACKS.filter((t) => t.emotionResonance.includes(emotionId)).slice(0, limit);
}

export function findRelatedFilms(emotionId: string, limit = 3) {
  return FILMS.filter((f) => f.emotionResonance.includes(emotionId)).slice(0, limit);
}

export function findRelatedColors(emotionId: string, limit = 3) {
  return COLORS.filter((c) => c.primaryEmotions.includes(emotionId)).slice(0, limit);
}

export function findRelatedFonts(emotionId: string, limit = 3) {
  return TYPOGRAPHY.filter((t) => t.emotionResonance.includes(emotionId)).slice(0, limit);
}

// ─── Semantic Scoring ────────────────────────────────────────────────────────

export function computeResonanceScore(
  source: ResonanceAxes,
  target: ResonanceAxes,
  validations: number,
  contradictions: number
): number {
  const similarity = resonanceSimilarity(source, target);
  const confidence = validations / (validations + contradictions + 1);
  return similarity * 0.6 + confidence * 0.4;
}

export function computeAmbiguity(contradictions: number, validations: number): number {
  const total = contradictions + validations;
  if (total === 0) return 0.5;
  const ratio = contradictions / total;
  return ratio * 2 * (1 - ratio) * 2; // peaks at 0.5 contradiction ratio
}

export function computePolarization(distribution: Record<string, number>): number {
  const values = Object.values(distribution);
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const proportions = values.map((v) => v / total);
  const entropy = -proportions.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
  const maxEntropy = Math.log2(values.length);
  return maxEntropy > 0 ? 1 - entropy / maxEntropy : 0;
}

// ─── Emotional Gravity Map ───────────────────────────────────────────────────

export function buildGravityMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const emotion of EMOTIONS) {
    map.set(emotion.id, resonanceGravity(emotion));
  }
  return map;
}

export function getEmotionalPathway(
  fromId: string,
  toId: string,
  maxDepth = 4
): string[] {
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(current: string, depth: number): boolean {
    if (depth > maxDepth) return false;
    if (current === toId) {
      path.push(current);
      return true;
    }
    if (visited.has(current)) return false;
    visited.add(current);

    const emotion = EMOTION_MAP.get(current);
    if (!emotion) return false;

    const candidates = [...emotion.neighbors, ...emotion.transitions.map((t) => t.to)];
    for (const next of candidates) {
      if (dfs(next, depth + 1)) {
        path.unshift(current);
        return true;
      }
    }
    return false;
  }

  dfs(fromId, 0);
  return path;
}
