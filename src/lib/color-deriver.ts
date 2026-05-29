/**
 * Color resonance deriver.
 *
 * Given a hex color, name and optional Heller ranking, produces a full
 * `ColorResonance` object whose vector is computed from HSL properties.
 *
 * Mapping rationale:
 *   - hue        → temperature (red/orange/yellow warm; blue/violet cool;
 *                  green/turquoise neutral; magenta/pink ambivalent)
 *   - saturation → energy + clarity (vivid colors feel alive; muted colors
 *                  feel weathered)
 *   - lightness  → density (inverse: bright = airy; dark = dense)
 *                  also affects humanity (mid-tones feel more bodily)
 *   - chroma     → tension (high chroma vibrates; greys settle)
 *   - color family → atmospheric tags (e.g. blues get "marítimo, cielo, frío")
 *
 * Hand-authored ColorResonance entries already in colorResonance.ts override
 * these for the 13 canonical colors. The deriver fills in the rest of the
 * spectrum without requiring per-color authoring.
 */

import type { ColorResonance, ResonanceAxes } from "@/types";

// ─── Math helpers ────────────────────────────────────────────────────────────

interface HSL { h: number; s: number; l: number; }

export function hexToHSL(hex: string): HSL {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue *= 60;
  }
  return { h: hue, s: s * 100, l: l * 100 };
}

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }
function round(n: number) { return Math.round(n); }

// ─── Hue → temperature curve ─────────────────────────────────────────────────
// Reds (0°) maximally warm; cyans (180°) maximally cool. Greens neutral.
function temperatureFromHue(h: number, s: number): number {
  // Cosine curve centred so red→hot, cyan→cold
  const t = 50 + Math.cos((h * Math.PI) / 180) * 38;
  // Desaturated colors converge to neutral
  return clamp(50 + (t - 50) * (s / 100), 14, 92);
}

// ─── Family classification (for tags + extra axis nudges) ────────────────────

export type ColorFamily =
  | "red" | "pink" | "orange" | "yellow"
  | "yellow-green" | "green" | "teal"
  | "blue" | "violet" | "magenta"
  | "brown" | "neutral" | "metallic";

export function familyOfHSL({ h, s, l }: HSL): ColorFamily {
  if (s < 8) return "neutral";
  if (l < 22 && s < 35) return "neutral";
  // Brown: low-saturation warm-orange territory
  if (h >= 15 && h <= 50 && s < 60 && l < 55) return "brown";
  if (h < 15 || h >= 345) return "red";
  if (h < 30) return "orange";
  if (h < 50) return "yellow";       // amber-yellow
  if (h < 70) return "yellow-green";
  if (h < 165) return "green";
  if (h < 195) return "teal";
  if (h < 250) return "blue";
  if (h < 290) return "violet";
  if (h < 345) return "magenta";
  return "red";
}

// Pink: light + magenta/red — separated post-hoc
function isPink(hsl: HSL, family: ColorFamily): boolean {
  if (family !== "magenta" && family !== "red") return false;
  return hsl.l > 60 && hsl.s > 25;
}

// Metallic detection isn't from HSL alone — we let the caller pass the flag

// ─── Atmospheric tags by family ──────────────────────────────────────────────

const FAMILY_TAGS: Record<ColorFamily, string[]> = {
  red:           ["sanguíneo", "vivo", "alarma", "amoroso", "carnal"],
  pink:          ["tierno", "infantil", "ingenuo", "rosáceo", "dulce"],
  orange:        ["solar", "fruta", "calidez", "fuego", "atardecer"],
  yellow:        ["solar", "luminoso", "diurno", "mostaza", "advertencia"],
  "yellow-green": ["bilis", "ácido", "primaveral", "inestable", "joven"],
  green:         ["vegetal", "esperanza", "fresco", "vida", "envidia"],
  teal:          ["marítimo", "frío", "moderno", "cristalino", "abierto"],
  blue:          ["cielo", "marítimo", "distancia", "verdad", "frío"],
  violet:        ["místico", "ambiguo", "espiritual", "noble", "transicional"],
  magenta:       ["energético", "saturado", "artificial", "pop", "vivo"],
  brown:         ["tierra", "madera", "humilde", "rústico", "otoñal"],
  neutral:       ["neutro", "indeciso", "callado", "espacial", "ascético"],
  metallic:      ["metálico", "reflectivo", "frío", "moderno", "valioso"],
};

const FAMILY_DESCRIPTION_HINT: Record<ColorFamily, string> = {
  red:           "El rojo recorre el cuerpo entero.",
  pink:          "El rosa pertenece a la zona que la sociedad reservó para la dulzura — y por eso mismo carga su propia rebeldía.",
  orange:        "El naranja vive entre el sol y el fuego doméstico.",
  yellow:        "El amarillo se contradice solo: es alegría y peligro a la vez.",
  "yellow-green": "El verde-amarillento es el color del que no se sabe si está sano o enfermo.",
  green:         "El verde es la vida que continúa.",
  teal:          "El turquesa es la respiración del frío.",
  blue:          "El azul es la distancia hecha color.",
  violet:        "El violeta no termina de decidirse entre el calor y el frío.",
  magenta:       "El magenta no existe en el arcoíris — sólo en la percepción que dobla los extremos del espectro.",
  brown:         "El marrón es el tiempo que cubre todo.",
  neutral:       "El gris es la conciencia sin sentencia.",
  metallic:      "Los metales convierten el color en superficie.",
};

// ─── Per-family resonance bias ───────────────────────────────────────────────
// Slight nudge to the auto-derived vector based on cultural associations.

const FAMILY_BIAS: Record<ColorFamily, Partial<ResonanceAxes>> = {
  red:           { tension: +12, humanity: +6 },
  pink:          { humanity: +14, intimacy: +12, tension: -6 },
  orange:        { energy: +8, temperature: +6 },
  yellow:        { clarity: +8, tension: +4 },
  "yellow-green": { tension: +6, clarity: -6 },
  green:         { humanity: +6, control: +4 },
  teal:          { clarity: +8, control: +6, intimacy: -6 },
  blue:          { clarity: +6, intimacy: -4, temporality: +8 },
  violet:        { clarity: -8, temporality: +8, control: -4 },
  magenta:       { energy: +10, tension: +6 },
  brown:         { temporality: +14, density: +10, humanity: +6 },
  neutral:       { energy: -8, clarity: -4 },
  metallic:      { control: +10, clarity: +8, intimacy: -8 },
};

// ─── Public deriver ──────────────────────────────────────────────────────────

export interface DeriveColorInput {
  id: string;                // kebab-case Spanish
  name: string;              // English
  nameEs: string;            // Spanish (display)
  hex: string;
  /** Optional family override (e.g. "metallic" can't be inferred from HSL). */
  family?: ColorFamily;
  /** Eva Heller dual ranking, if applicable. */
  appreciatedRank?: number | null;
  lessAppreciatedRank?: number | null;
  /** Optional human-authored description / quote to override the auto hint. */
  description?: string;
  hellerQuote?: string;
  /** Extra atmosphere/symbolism tags appended to the family defaults. */
  extraTags?: string[];
}

export function deriveColorResonance(input: DeriveColorInput): ColorResonance {
  const hsl = hexToHSL(input.hex);
  let family = input.family ?? familyOfHSL(hsl);
  if (family !== "metallic" && family !== "neutral" && isPink(hsl, family)) {
    family = "pink";
  }

  // Base axes from HSL
  const temperature = round(temperatureFromHue(hsl.h, hsl.s));
  const energy      = round(clamp(hsl.s * 0.7 + hsl.l * 0.25 + 8));
  const clarity     = round(clamp(hsl.s * 0.4 + (100 - hsl.l) * 0.18 + 35));
  const density     = round(clamp((100 - hsl.l) * 0.85 + 15));
  const movement    = round(clamp(hsl.s * 0.4 + 25));
  const tension     = round(clamp(hsl.s * 0.5 + 18));
  const temporality = round(clamp(60 - hsl.s * 0.2 + (100 - hsl.l) * 0.15));
  const humanity    = round(clamp(55 - Math.abs(hsl.l - 55) * 0.4 + (hsl.s > 50 ? 6 : 0)));
  const intimacy    = round(clamp(50 - hsl.s * 0.15 + (hsl.l > 60 ? 12 : -6)));
  const control     = round(clamp(55 - hsl.s * 0.25 + (Math.abs(hsl.l - 50) * 0.18)));

  const base: ResonanceAxes = {
    energy, temperature, tension, density, movement,
    temporality, humanity, clarity, intimacy, control,
  };

  // Apply family bias
  const bias = FAMILY_BIAS[family];
  for (const k of Object.keys(bias) as Array<keyof ResonanceAxes>) {
    base[k] = clamp(base[k] + (bias[k] ?? 0));
  }

  // Atmosphere / cultural tags
  const tags = [...FAMILY_TAGS[family], ...(input.extraTags ?? [])];

  const description = input.description ?? FAMILY_DESCRIPTION_HINT[family];
  const quote = input.hellerQuote ?? "—";

  return {
    id: input.id,
    name: input.name,
    nameEs: input.nameEs,
    hex: input.hex,
    hsl: { h: round(hsl.h), s: round(hsl.s), l: round(hsl.l) },
    hellerRank: input.appreciatedRank ?? 999,
    appreciatedRank: input.appreciatedRank ?? null,
    lessAppreciatedRank: input.lessAppreciatedRank ?? null,
    primaryEmotions: [],
    contradictoryEmotions: [],
    culturalMeanings: tags.slice(0, 6),
    resonance: base,
    description,
    hellerQuote: quote,
    symbolism: tags,
  };
}
