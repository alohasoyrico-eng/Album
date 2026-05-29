/**
 * Deterministic emotion-to-hex from the 10-axis resonance signature.
 *
 * The catalogue look-up was sticky: similar vectors collapsed to the same
 * top-1 hex. This deriver bypasses the catalogue entirely and synthesises
 * a unique HSL for every emotion, guaranteeing chromatic diversity because
 * every emotion has a unique combination of axes.
 *
 *   hue        ← temperature + small movement modulation (so movement
 *                axis shifts the colour along the wheel — running emotions
 *                land at slightly different hues from static ones with
 *                similar temperatures)
 *   saturation ← energy + tension  (vivid feelings are saturated)
 *   lightness  ← inverse(density), boosted by clarity
 *
 * The result is a wheel: cool low-energy emotions cluster blue-violet;
 * warm tense emotions cluster red-orange; clear high-energy ones land in
 * yellow-green; intimate temperate ones in rose-magenta.
 */

import type { ResonanceAxes } from "@/types";

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Maps temperature (0=cold, 100=hot) to a hue on the colour wheel.
 *   0..15   → cyan/blue-cold       (200°)
 *   15..35  → blue-violet           (240°)
 *   35..50  → violet-magenta        (290°)
 *   50..65  → green-yellow neutral  (90°)
 *   65..80  → orange                (30°)
 *   80..100 → red-hot               (0°)
 */
function temperatureToHue(temp: number): number {
  const t = Math.max(0, Math.min(100, temp));
  // Piecewise-linear hue mapping
  if (t < 15) return 200;
  if (t < 35) return 200 + ((t - 15) / 20) * 40;       // 200 → 240
  if (t < 50) return 240 + ((t - 35) / 15) * 50;       // 240 → 290
  if (t < 65) {
    // 290 → 90 jumps across the wheel; instead drop to green
    return 90 + ((65 - t) / 15) * 30;                  // 65→90 ; 50→120
  }
  if (t < 80) return 30 + ((80 - t) / 15) * 30;        // 80→30 ; 65→60
  return Math.max(0, 30 - ((t - 80) / 20) * 30);       // 80→30 ; 100→0
}

export interface DerivedColor {
  hex: string;
  hue: number;
  saturation: number;
  lightness: number;
}

export function resonanceToColor(r: ResonanceAxes): DerivedColor {
  // Base hue from temperature
  let hue = temperatureToHue(r.temperature);

  // Movement shifts hue ±20° so two emotions with same temperature but
  // different motion land at different colours. Sign comes from clarity:
  // clear → shift +ward (more towards yellow-green / orange)
  //                                   ; murky → shift backward.
  const moveShift = ((r.movement - 50) / 50) * 18;
  const claritySign = r.clarity >= 50 ? 1 : -1;
  hue += moveShift * claritySign;

  // Humanity nudges toward warmer tones (skin/blood); control toward cooler
  hue += ((r.humanity - 50) / 50) * 8;
  hue -= ((r.control - 50) / 50) * 6;

  // Saturation: energy + tension drive vividness; muted by temporality drift
  const saturation = Math.max(
    18,
    Math.min(94,
      30 + r.energy * 0.32 + r.tension * 0.28 - (r.temporality - 50) * 0.18,
    ),
  );

  // Lightness: dense feelings are dark; clarity boosts a bit; intimacy
  // pulls into the mid-tones (skin range)
  let lightness =
    72 - r.density * 0.45 + (r.clarity - 50) * 0.18 - Math.abs(r.intimacy - 60) * 0.12;
  lightness = Math.max(18, Math.min(82, lightness));

  return { hex: hslToHex(hue, saturation, lightness), hue, saturation, lightness };
}

/**
 * Build N supporting colours by sampling the derived hue ± offsets and
 * lightness/saturation variations. Used for the emergent palette display.
 */
export function resonancePalette(r: ResonanceAxes, count = 12): string[] {
  const base = resonanceToColor(r);
  const out: string[] = [];
  // Triadic + analogous fan around base
  const offsets = [0, -28, 24, -56, 48, -84, 72, 120, -120, 180, -16, 16];
  for (let i = 0; i < Math.min(count, offsets.length); i++) {
    const offs = offsets[i];
    const lJitter = (i % 3 - 1) * 8;
    const sJitter = (i % 2 === 0) ? 6 : -6;
    out.push(hslToHex(base.hue + offs, base.saturation + sJitter, base.lightness + lJitter));
  }
  return out;
}
