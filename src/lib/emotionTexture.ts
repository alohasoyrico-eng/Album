/**
 * Dramatic per-emotion ground texture.
 *
 * Earlier version was timid: low alphas + screen blend washed everything
 * to grey. This one swings hard: large saturated radials, conic spokes,
 * heavy noise — the page surface SHOULD feel like the emotion.
 */

import type { ResonanceAxes, ColorResonance } from "@/types";
import { resonanceToColor } from "./resonanceColor";

function noiseDataUri(opacity: number, frequency: number, octaves = 2): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="280">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="${frequency.toFixed(2)}" numOctaves="${octaves}" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity.toFixed(2)} 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>`.trim();
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function alpha(n01: number): string {
  const v = Math.round(Math.max(0, Math.min(1, n01)) * 255);
  return v.toString(16).padStart(2, "0");
}

export interface EmotionTexture {
  /** Goes on the body backdrop. Heavy gradient stack. */
  background: string;
  /** Optional second layer to render on top with mix-blend. */
  overlay: string;
  /** Mix-blend mode for the overlay layer. */
  overlayBlend: "screen" | "multiply" | "overlay" | "soft-light";
  textShadow: string;
  surfaceTint: string;
  /** Body backdrop suggested colour: dark grain for dense emotions, bright for clear. */
  baseColor: string;
}

export function deriveTexture(
  resonance: ResonanceAxes,
  emergentPalette: ColorResonance[],
): EmotionTexture {
  // Always derive primary tint from axes — guarantees uniqueness even if
  // the palette comes in empty.
  const derived = resonanceToColor(resonance);

  const c0 = derived.hex;
  const c1 = emergentPalette[1]?.hex ?? derived.hex;
  const c2 = emergentPalette[3]?.hex ?? derived.hex;
  const c3 = emergentPalette[6]?.hex ?? c1;
  const c4 = emergentPalette[9]?.hex ?? c2;

  // ─── Axes → composition ─────────────────────────────────────────────
  const tension = resonance.tension / 100;
  const density = resonance.density / 100;
  const movement = resonance.movement / 100;
  const energy = resonance.energy / 100;
  const temperature = resonance.temperature / 100;
  const clarity = resonance.clarity / 100;
  const intimacy = resonance.intimacy / 100;

  // Dramatic alphas — visible, not whispered
  const a0 = alpha(0.42 + density * 0.30);  // primary radial
  const a1 = alpha(0.30 + tension * 0.30);  // secondary radial
  const a2 = alpha(0.20 + (1 - clarity) * 0.35);
  const a3 = alpha(0.18 + temperature * 0.25);
  const a4 = alpha(0.16 + energy * 0.30);

  // Focal geometry
  const focalX = Math.round(28 + intimacy * 45);
  const focalY = Math.round(18 + (1 - energy) * 30);
  const focalSpread = Math.round(38 + (1 - intimacy) * 32);

  const angle = Math.round(movement * 360);
  const conicStart = Math.round(angle - 90);

  // Noise: tense and unclear → fine, dense grain. Serene & clear → none.
  const noiseOpacity = Math.max(0.05, Math.min(0.72, tension * 0.50 + (1 - clarity) * 0.32));
  const noiseFreq = 0.55 + tension * 1.05;
  const noiseOct = tension > 0.55 ? 3 : 2;
  const noise = noiseDataUri(noiseOpacity, noiseFreq, noiseOct);

  // ─── Background stack (under emergent atmosphere) ───────────────────
  // Order: noise on top of gradients reads like film grain over a painting.
  const background = [
    `radial-gradient(ellipse at ${focalX}% ${focalY}%, ${c0}${a0} 0%, transparent ${focalSpread}%)`,
    `radial-gradient(ellipse at ${100 - focalX}% ${100 - focalY}%, ${c1}${a1} 0%, transparent ${focalSpread + 12}%)`,
    `radial-gradient(circle at 18% 86%, ${c2}${a2} 0%, transparent 48%)`,
    `radial-gradient(circle at 84% 12%, ${c3}${a3} 0%, transparent 46%)`,
    `linear-gradient(${angle}deg, ${c4}${a4} 0%, transparent 68%)`,
  ].join(", ");

  // ─── Overlay layer — conic for high tension, soft warm wash otherwise
  let overlay = "";
  let overlayBlend: EmotionTexture["overlayBlend"] = "soft-light";
  if (tension >= 0.6 || energy >= 0.7) {
    // Conic spokes — feels like radiation / vibration / heat. Strong.
    overlay = `conic-gradient(from ${conicStart}deg at ${focalX}% ${focalY}%, ${c0}${alpha(0.18 + tension * 0.2)} 0deg, transparent 35deg, ${c1}${alpha(0.10 + energy * 0.2)} 90deg, transparent 130deg, ${c2}${alpha(0.12)} 200deg, transparent 250deg, ${c0}${alpha(0.18 + tension * 0.2)} 360deg), ${noise}`;
    overlayBlend = energy >= 0.6 ? "overlay" : "soft-light";
  } else if (temperature >= 0.6 && intimacy >= 0.55) {
    // Warm intimate wash — radial + soft noise
    overlay = `radial-gradient(circle at ${focalX}% ${focalY}%, ${c0}${alpha(0.28)} 0%, transparent 70%), ${noise}`;
    overlayBlend = "soft-light";
  } else if (temperature <= 0.35 && clarity >= 0.55) {
    // Cold + clear — geometric stripes (architectural)
    overlay = `repeating-linear-gradient(${angle}deg, transparent 0px, transparent 18px, ${c1}${alpha(0.06)} 18px, ${c1}${alpha(0.06)} 19px), ${noise}`;
    overlayBlend = "multiply";
  } else {
    // Otherwise: just film grain
    overlay = noise;
    overlayBlend = density >= 0.55 ? "multiply" : "soft-light";
  }

  // Background base colour: dense + cold → near-black; bright + clear → near-white
  const baseColor = density >= 0.6 && temperature <= 0.4
    ? "#0a0a0c"
    : (density <= 0.35 && clarity >= 0.65 ? "#f4f0e8" : "#15131a");

  return {
    background,
    overlay,
    overlayBlend,
    textShadow: `0 0 ${Math.round(28 + energy * 60)}px ${c0}${alpha(0.35 + energy * 0.3)}`,
    surfaceTint: c0,
    baseColor,
  };
}
