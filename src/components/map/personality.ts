import type { MapNode } from "@/types";

// Stable 0..1 hash for deterministic per-node phase/seed
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

export interface Offset {
  dx: number;
  dy: number;
  scale: number;
  glow: number;
}

const ZERO: Offset = { dx: 0, dy: 0, scale: 1, glow: 0 };

/**
 * Each entity type has its own material behavior.
 * The motion is layered on top of D3's structural placement —
 * it's pure visual personality, not simulation drift.
 *
 * Emotion: resonance-driven motion — tense emotions jitter,
 *   melancholic ones drift slowly, ecstatic ones orbit.
 * Color: diffuse breathing halo.
 * Music: rhythmic pulse (faster, smaller).
 * Artwork: nearly stable, very slow heave.
 */
export function personalityOffset(node: MapNode, tMs: number): Offset {
  const seed = hash01(node.id) * Math.PI * 2;
  const t = tMs / 1000;

  if (node.type === "emotion" && node.resonance) {
    const r = node.resonance;
    const tension = r.tension / 100;
    const energy = r.energy / 100;
    const movement = r.movement / 100;
    const temporality = r.temporality / 100; // high = past/slow
    const clarity = r.clarity / 100;

    // High tension → nervous micro-jitter
    const jAmp = tension * 1.6 * (1 - clarity * 0.5);
    const jx = Math.sin(t * 11 + seed * 3) * jAmp;
    const jy = Math.cos(t * 13 + seed * 4) * jAmp;

    // Low energy or high temporality → slow gravitational drift
    const dAmp = (1 - energy) * 2.2 + temporality * 1.6;
    const dx = Math.sin(t * 0.32 + seed) * dAmp;
    const dy = Math.cos(t * 0.27 + seed * 1.4) * dAmp;

    // High movement → orbital sway
    const oAmp = movement * 1.4;
    const ox = Math.cos(t * 0.7 + seed * 2.1) * oAmp;
    const oy = Math.sin(t * 0.7 + seed * 2.1) * oAmp;

    // Breathing scale — energy-driven pulse
    const breath = 1 + Math.sin(t * (0.6 + energy * 0.6) + seed) * (0.04 + energy * 0.06);

    // Glow: passion/desire/love emit warmth; cold emotions stay dim
    const glow = (energy * 0.55 + (r.humanity / 100) * 0.45) * (0.6 + 0.4 * Math.sin(t * 0.8 + seed));

    return {
      dx: jx + dx + ox,
      dy: jy + dy + oy,
      scale: breath,
      glow,
    };
  }

  if (node.type === "color") {
    // Slow diffuse breathing
    const breath = 1 + Math.sin(t * 0.45 + seed) * 0.05;
    const dx = Math.sin(t * 0.18 + seed) * 0.8;
    const dy = Math.cos(t * 0.22 + seed * 1.3) * 0.8;
    const glow = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.7 + seed));
    return { dx, dy, scale: breath, glow };
  }

  if (node.type === "music") {
    // Rhythmic pulse
    const beat = Math.sin(t * 2.2 + seed) ** 2;
    const breath = 1 + beat * 0.18;
    const dx = Math.sin(t * 0.5 + seed) * 0.4;
    const dy = Math.cos(t * 0.5 + seed) * 0.4;
    return { dx, dy, scale: breath, glow: beat * 0.7 };
  }

  if (node.type === "artwork") {
    // Stable anchor — barely moves
    const dx = Math.sin(t * 0.12 + seed) * 0.3;
    const dy = Math.cos(t * 0.1 + seed) * 0.3;
    return { dx, dy, scale: 1, glow: 0.2 };
  }

  return ZERO;
}

/**
 * Ambiguity-driven link instability: returns an opacity multiplier in [0.4, 1].
 * Higher ambiguity → more flickering.
 */
export function linkInstability(ambiguity: number, sourceId: string, targetId: string, tMs: number): number {
  if (ambiguity < 0.2) return 1;
  const seed = hash01(sourceId + targetId) * Math.PI * 2;
  const t = tMs / 1000;
  const flicker = 0.5 + 0.5 * Math.sin(t * (1 + ambiguity * 3) + seed);
  return 1 - ambiguity * 0.55 * flicker;
}
