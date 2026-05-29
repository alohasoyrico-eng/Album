/**
 * Per-emotion color system as RECIPES, not transformations.
 *
 * A color isn't an HSL value you shift — it's a mixture. A green is yellow
 * + blue. A muted green adds its complement (red). A dark green adds black.
 * A warm green adds yellow; a cool one adds blue. This is how Heller's
 * cromatic system actually works, and how pigments combine in painting.
 *
 * So each emotion's color is a RECIPE that mixes the tribal base with
 * ingredients selected by the emotion's resonance axes. The recipe is the
 * explanation — you can read it directly:
 *
 *   rencor   = 60% obstáculo-rojo + 20% negro + 12% marrón + 8% blanco
 *   furia    = 55% obstáculo-rojo + 30% amarillo + 15% blanco
 *   ira      = 75% obstáculo-rojo + 25% blanco
 *   enfado   = 55% obstáculo-rojo + 30% amarillo + 15% blanco
 *
 * The mix happens in Oklab — a perceptually uniform color space where
 * red+green gives brown (not gray) and equal steps look equal.
 *
 * See https://bottosson.github.io/posts/oklab/ for the math.
 */

import type { Emotion, ResonanceAxes, ColorResonance } from "@/types";
import { COLORS } from "@/data/colors/colorResonance";
import { buildVector, cosineSimilarity, type ResonanceVector } from "./resonance-vector";
import { emotionAssignedHex as _emotionAssignedHex } from "./emotionPalette";

// ─── sRGB ↔ Oklab ────────────────────────────────────────────────────────────

interface RGB { r: number; g: number; b: number; }
interface Oklab { L: number; a: number; b: number; }

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToOklab({ r, g, b }: RGB): Oklab {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);

  return {
    L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  };
}

function oklabToRgb({ L, a, b }: Oklab): RGB {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rl =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gl = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return {
    r: linearToSrgb(rl),
    g: linearToSrgb(gl),
    b: linearToSrgb(bl),
  };
}

export function hexToOklab(hex: string): Oklab {
  return rgbToOklab(hexToRgb(hex));
}

export function oklabToHex(lab: Oklab): string {
  return rgbToHex(oklabToRgb(lab));
}

/**
 * Mix any number of Oklab colors with weights.
 * Weights are normalized internally — they don't have to sum to 1.
 */
export function mixOklab(parts: Array<{ lab: Oklab; weight: number }>): Oklab {
  let totalW = 0;
  let L = 0, a = 0, b = 0;
  for (const p of parts) {
    totalW += p.weight;
    L += p.lab.L * p.weight;
    a += p.lab.a * p.weight;
    b += p.lab.b * p.weight;
  }
  return { L: L / totalW, a: a / totalW, b: b / totalW };
}

// ─── Ingredient palette ──────────────────────────────────────────────────────
//
// Heller-meaningful pigments that the recipe can call on. Each ingredient is
// chosen by an axis driver in the recipe builder.

const PALETTE = {
  black:    "#0A0A0E", // absolute black for density
  white:    "#FBF5E8", // warm parchment white for energy/lightness
  gray:     "#9A9DA6", // neutral gray for fatigue / aging
  yellow:   "#F0B428", // sun-yellow for warmth/energy
  brown:    "#6A3A1A", // earth-brown for temporality (past, sediment)
  blue:     "#3060C8", // cool sky-blue for coldness
  violet:   "#7A3A8A", // violet for shame / depth / mystery
  rose:     "#D58FA0", // warm rose for tenderness / nostalgia
  amber:    "#C8935A", // warm amber for golden hour / fulfillment
};

// Naive complementary in Oklab: flip a and b around 0.
// Useful for high-tension emotions that "vibrate" against their tribal hue.
function complementaryLab(lab: Oklab): Oklab {
  return { L: lab.L, a: -lab.a, b: -lab.b };
}

// ─── Recipe ───────────────────────────────────────────────────────────────────

export type AxisDriver =
  | "tribal-base"
  | "density"
  | "energy"
  | "temperature-warm"
  | "temperature-cold"
  | "tension"
  | "temporality"
  | "humanity"
  | "movement"
  | "clarity"
  | "intimacy"
  | "control";

export interface Ingredient {
  hex: string;
  name: string;        // human-readable name of the pigment
  weight: number;      // 0..1, normalized inside the recipe
  axisDriver: AxisDriver;
  reason: string;      // why this ingredient is here — readable copy
}

export interface ColorRecipe {
  /** The tribal color the recipe starts from. */
  tribalBase: { hex: string; weight: number };
  /** Additional ingredients chosen by the resonance profile. */
  ingredients: Ingredient[];
  /** Final mixed color. */
  finalHex: string;
  /** Total weight (tribal + ingredients) — for normalizing display. */
  totalWeight: number;
}

// ─── Catalogue-driven ingredient bank ───────────────────────────────────────
// Instead of hard-coding 9 ingredient hexes, each axis-direction draws from
// a SHORTLIST of catalogue colours most aligned with that direction. Per
// emotion, we pick from the shortlist the colour whose full vector resonates
// best with the emotion's. Result: the same axis ("density-high") can pull
// "carbón", "antracita", "ébano" or "verde-noche" for different emotions
// — the catalogue's diversity surfaces in the recipe.

type Direction =
  | "density-high" | "density-low"
  | "energy-high" | "energy-low"
  | "temperature-warm" | "temperature-cold"
  | "tension-high"
  | "temporality-high"
  | "humanity-high"
  | "movement-high"
  | "clarity-low"
  | "intimacy-high"
  | "control-high" | "control-low";

function probeAxes(overrides: Partial<ResonanceAxes>): ResonanceAxes {
  return {
    energy: 50, temperature: 50, tension: 50, density: 50, movement: 50,
    temporality: 50, humanity: 50, clarity: 50, intimacy: 50, control: 50,
    ...overrides,
  };
}

const PROBE: Record<Direction, ResonanceAxes> = {
  "density-high":      probeAxes({ density: 95, energy: 30, clarity: 30 }),
  "density-low":       probeAxes({ density: 8, energy: 80, clarity: 78 }),
  "energy-high":       probeAxes({ energy: 95, clarity: 80, movement: 75 }),
  "energy-low":        probeAxes({ energy: 8, density: 70, movement: 18 }),
  "temperature-warm":  probeAxes({ temperature: 95, humanity: 78, intimacy: 65 }),
  "temperature-cold":  probeAxes({ temperature: 8, control: 78, intimacy: 32 }),
  "tension-high":      probeAxes({ tension: 95, control: 28, clarity: 38 }),
  "temporality-high":  probeAxes({ temporality: 95, density: 70, energy: 32 }),
  "humanity-high":     probeAxes({ humanity: 95, intimacy: 75, temperature: 62 }),
  "movement-high":     probeAxes({ movement: 95, energy: 75, clarity: 65 }),
  "clarity-low":       probeAxes({ clarity: 8, tension: 60, density: 60 }),
  "intimacy-high":     probeAxes({ intimacy: 95, humanity: 78, temperature: 60 }),
  "control-high":      probeAxes({ control: 95, clarity: 80, tension: 32 }),
  "control-low":       probeAxes({ control: 8, tension: 75, energy: 78 }),
};

// Pre-compute vectors for every catalogue colour (lazy: once per process)
let _colorVectors: Array<{ color: ColorResonance; vec: ResonanceVector }> | null = null;
function colorVectors() {
  if (!_colorVectors) {
    _colorVectors = COLORS.map((c) => ({ color: c, vec: buildVector(c.resonance) }));
  }
  return _colorVectors;
}

// Shortlist cache: top-12 catalogue colours per direction
const _shortlists = new Map<Direction, ColorResonance[]>();
function shortlist(dir: Direction): ColorResonance[] {
  const cached = _shortlists.get(dir);
  if (cached) return cached;
  const probeVec = buildVector(PROBE[dir]);
  const ranked = colorVectors()
    .map(({ color, vec }) => ({ color, sim: cosineSimilarity(probeVec, vec) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 12)
    .map((x) => x.color);
  _shortlists.set(dir, ranked);
  return ranked;
}

// Fingerprint of the emotion's vector, used to break the "same ingredient
// for everyone" collapse when many emotions are similar in shortlist space.
function vecFingerprint(v: ResonanceVector): number {
  let h = 2166136261;
  for (const k of Object.keys(v) as Array<keyof ResonanceVector>) {
    h ^= Math.round((v[k] as number) * 1000);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Pick from a direction's shortlist: rank by cosine similarity to the
// emotion's full vector, then let a fingerprint choose among the top-K.
// Different emotions in the same direction land on different catalogue
// entries even when their vectors are very close.
function pickIngredient(emotionVec: ResonanceVector, dir: Direction): ColorResonance | null {
  const list = shortlist(dir);
  if (list.length === 0) return null;

  const ranked = list
    .map((c) => ({ color: c, sim: cosineSimilarity(emotionVec, buildVector(c.resonance)) }))
    .sort((a, b) => b.sim - a.sim);

  const topN = ranked.slice(0, Math.min(8, ranked.length));
  if (topN.length === 0) return null;
  const fp = vecFingerprint(emotionVec);
  return topN[fp % topN.length].color;
}

/**
 * Build a recipe for an emotion. Each axis of the resonance shapes the mix:
 *
 *   density      → adds black if dense, white if airy
 *   energy       → high → adds white (luminosity); low → adds gray (fatigue)
 *   temperature  → warm → adds yellow/amber; cold → adds blue
 *   tension      → adds the complement (visual instability)
 *   temporality  → high → adds brown (sediment of time)
 *   humanity     → high → slight rose (intimacy, warmth of flesh)
 *
 * The base weight is always ~55%, so the tribal identity remains dominant.
 * Ingredients are added at 0–25% each. The total is normalized when mixed.
 */
export function buildRecipe(tribalHex: string, resonance: ResonanceAxes): ColorRecipe {
  const ingredients: Ingredient[] = [];
  const baseWeight = 0.32;
  const r = resonance;
  const emoVec = buildVector(r);

  // Helper: push an ingredient drawn from the 224-colour catalogue. If
  // the catalogue yields nothing (very unlikely), we silently skip — the
  // recipe still works on the remaining ingredients + tribal base.
  const addFromCatalogue = (dir: Direction, weight: number, axis: AxisDriver, reason: string) => {
    const pick = pickIngredient(emoVec, dir);
    if (!pick) return;
    ingredients.push({
      hex: pick.hex,
      name: pick.nameEs,           // readable: "carbón", "ámbar tostado", "ciruela"
      weight,
      axisDriver: axis,
      reason,
    });
  };

  // ─── DENSITY ──────────────────────────────────────────────────────────────
  if (r.density > 60) {
    addFromCatalogue("density-high", ((r.density - 60) / 40) * 0.48, "density",
      "Densidad alta — el peso de la emoción se sedimenta");
  } else if (r.density < 40) {
    addFromCatalogue("density-low", ((40 - r.density) / 40) * 0.36, "density",
      "Densidad baja — ligereza, aire, etereidad");
  }

  // ─── ENERGY ───────────────────────────────────────────────────────────────
  if (r.energy > 60) {
    addFromCatalogue("energy-high", ((r.energy - 60) / 40) * 0.38, "energy",
      "Energía alta — luminosidad, intensidad expansiva");
  } else if (r.energy < 40) {
    addFromCatalogue("energy-low", ((40 - r.energy) / 40) * 0.40, "energy",
      "Energía baja — apagamiento, retirada de la luz");
  }

  // ─── TEMPERATURE ──────────────────────────────────────────────────────────
  if (r.temperature > 60) {
    addFromCatalogue("temperature-warm", ((r.temperature - 60) / 40) * 0.45, "temperature-warm",
      "Temperatura cálida — el sol, la sangre, el fuego doméstico");
  } else if (r.temperature < 40) {
    addFromCatalogue("temperature-cold", ((40 - r.temperature) / 40) * 0.42, "temperature-cold",
      "Temperatura fría — el cielo, el hielo, la distancia");
  }

  // ─── TENSION → catalogue colour vibrating against the tribal hue ──────────
  if (r.tension > 70) {
    addFromCatalogue("tension-high", ((r.tension - 70) / 30) * 0.22, "tension",
      "Tensión alta — vibración contra la familia tribal");
  }

  // ─── TEMPORALITY → brown sediment from the catalogue ─────────────────────
  if (r.temporality > 70) {
    addFromCatalogue("temporality-high", ((r.temporality - 70) / 30) * 0.34, "temporality",
      "Temporalidad alta — el tiempo se asienta, oxidación, memoria");
  }

  // ─── HUMANITY → warm flesh tone ──────────────────────────────────────────
  if (r.humanity > 75) {
    addFromCatalogue("humanity-high", ((r.humanity - 75) / 25) * 0.20, "humanity",
      "Humanidad alta — la temperatura de la piel, la intimidad");
  }

  // ─── MOVEMENT → dynamic amber/orange register ───────────────────────────
  if (r.movement > 65) {
    addFromCatalogue("movement-high", ((r.movement - 65) / 35) * 0.22, "movement",
      "Movimiento alto — el río que corre, el gesto inacabado");
  }

  // ─── CLARITY → murky violet when low ────────────────────────────────────
  if (r.clarity < 40) {
    addFromCatalogue("clarity-low", ((40 - r.clarity) / 40) * 0.24, "clarity",
      "Claridad baja — neblina, ambivalencia, lo no resuelto");
  }

  // ─── INTIMACY → very close, warm tone ───────────────────────────────────
  if (r.intimacy > 70) {
    addFromCatalogue("intimacy-high", ((r.intimacy - 70) / 30) * 0.18, "intimacy",
      "Intimidad alta — el rostro a milímetros, el aliento");
  }

  // ─── CONTROL ────────────────────────────────────────────────────────────
  if (r.control > 75) {
    addFromCatalogue("control-high", ((r.control - 75) / 25) * 0.16, "control",
      "Control alto — la mano firme, la calma estructural");
  } else if (r.control < 30) {
    addFromCatalogue("control-low", ((30 - r.control) / 30) * 0.20, "control",
      "Control bajo — el desborde, lo que se sale del cauce");
  }

  // ─── Compute final mix in Oklab ───────────────────────────────────────────
  const tribalLab = hexToOklab(tribalHex);
  const parts: Array<{ lab: Oklab; weight: number }> = [
    { lab: tribalLab, weight: baseWeight },
    ...ingredients.map((i) => ({ lab: hexToOklab(i.hex), weight: i.weight })),
  ];
  const mixedLab = mixOklab(parts);

  // SNAP TO CATALOGUE — the mixed Oklab averaging suppresses the
  // catalogue's chromatic extremes (rosa-bebé becomes mid-pink, fucsia
  // becomes muted, lila becomes grey). Instead of using the mixed hex
  // directly, we find the catalogue colour whose Oklab is closest to
  // the mix AND whose vector resonates with this emotion, then output
  // ITS hex. The recipe still tells the story; the output really uses
  // the 224's diversity.
  const finalHex = snapMixedToCatalogue(mixedLab, emoVec) ?? oklabToHex(mixedLab);

  const totalWeight = baseWeight + ingredients.reduce((s, i) => s + i.weight, 0);

  return {
    tribalBase: { hex: tribalHex, weight: baseWeight },
    ingredients,
    finalHex,
    totalWeight,
  };
}

// Snap the mixed Oklab to the nearest catalogue colour. We combine two
// signals: Oklab perceptual distance (must look right) and resonance
// cosine (must FEEL right for this emotion). Among the top-K closest by
// perceptual distance, the one most resonant wins. This is what surfaces
// rosa-bebé, fucsia, coral, lila, rosa-palo, etc. for distinct emotions.
function snapMixedToCatalogue(mixed: Oklab, emoVec: ResonanceVector): string | null {
  const cands = colorVectors().map(({ color, vec }) => {
    const lab = hexToOklab(color.hex);
    const dL = lab.L - mixed.L, da = lab.a - mixed.a, db = lab.b - mixed.b;
    const labDist = Math.sqrt(dL * dL + da * da + db * db);
    return { color, vec, labDist };
  });
  cands.sort((a, b) => a.labDist - b.labDist);
  const topK = cands.slice(0, 8);
  if (topK.length === 0) return null;
  let best = topK[0];
  let bestScore = -Infinity;
  for (const c of topK) {
    const sim = cosineSimilarity(emoVec, c.vec);
    // Weighted combination: Oklab proximity AND resonance.
    // labDist is small (≤0.5 typically); invert via -labDist.
    const score = sim * 1.0 - c.labDist * 0.6;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return best.color.hex;
}

// ─── Convenience wrapper ──────────────────────────────────────────────────────

const _recipeCache = new Map<string, ColorRecipe>();

/**
 * Build the chromatic recipe for an emotion. When `ctx` carries a lens
 * and the emotion has lens-aware claims, the recipe runs against the
 * LIVE resonance (consensus over claims under the active context), not
 * the Marina canonical. The visual identity of the page actually shifts
 * with the lens, not just the prose.
 *
 * Cache key includes the lens so the same emotion can hold multiple
 * recipes simultaneously — one per active perspective.
 */
export function emotionRecipe(
  emotion: Emotion,
  tribalHex: string,
  ctx?: import("@/types/claims").ReadContext,
): ColorRecipe {
  const lensKey = ctx?.lens ?? "default";
  const key = `${emotion.id}::${tribalHex}::${lensKey}`;
  const cached = _recipeCache.get(key);
  if (cached) return cached;

  // Live resonance routes through the claims engine. With no lens active,
  // this returns Marina's canonical vector and we get the same hex as
  // before. With a lens active, axis values shift and the recipe changes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { liveResonance, lensShiftsResonance } = require("@/data/ontology/emotions-claims") as
    typeof import("@/data/ontology/emotions-claims");
  const resonance = ctx?.lens ? liveResonance(emotion.id, ctx) : emotion.resonance;

  const recipe = buildRecipe(tribalHex, resonance);

  // Globally-assigned catalogue hex is the canonical answer when no lens
  // (or the lens didn't materially shift the vector). When the lens does
  // shift it, fall back to live "nearest catalogue hex" via cosine.
  if (!ctx?.lens || !lensShiftsResonance(emotion.id, ctx)) {
    const assigned = _emotionAssignedHex(emotion.id);
    if (assigned) recipe.finalHex = assigned;
  }

  _recipeCache.set(key, recipe);
  return recipe;
}

/** Drop-in replacement that returns the final hex + the recipe. */
export function emotionColor(
  emotion: Emotion,
  tribalHex: string,
  ctx?: import("@/types/claims").ReadContext,
): { hex: string; recipe: ColorRecipe } {
  const recipe = emotionRecipe(emotion, tribalHex, ctx);
  return { hex: recipe.finalHex, recipe };
}
