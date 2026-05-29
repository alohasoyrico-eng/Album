#!/usr/bin/env node
/**
 * Generate an expanded typography catalogue (~80 Google Fonts) with a real
 * structural classification: axis (humanist / transitional / modern / slab /
 * neo-grotesque / geometric-sans / humanist-sans / mono / display / handwriting
 * / blackletter), era, voice.
 *
 * Each font's resonance vector is derived from these formal attributes
 * (no hand-authored per-font vector). The 8 canonical fonts already in
 * src/data/typography/fonts.ts survive as the curated baseline; this
 * adds the rest.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Structural axis → vector bias ──────────────────────────────────────────

const AXIS_BASE = {
  // humanist serif — calligraphic origins, organic, warm
  "humanist-serif": {
    energy: 38, temperature: 65, tension: 35, density: 60, movement: 45,
    temporality: 85, humanity: 88, clarity: 65, intimacy: 75, control: 60,
  },
  // transitional serif — between humanist and modern: balanced, formal
  "transitional-serif": {
    energy: 42, temperature: 55, tension: 38, density: 62, movement: 38,
    temporality: 82, humanity: 78, clarity: 78, intimacy: 60, control: 78,
  },
  // modern serif — vertical stress, high contrast, neoclassical (Bodoni / Didot)
  "modern-serif": {
    energy: 52, temperature: 45, tension: 65, density: 65, movement: 32,
    temporality: 80, humanity: 60, clarity: 82, intimacy: 48, control: 88,
  },
  // slab serif — industrial age, sturdy, journalistic
  "slab-serif": {
    energy: 58, temperature: 55, tension: 35, density: 75, movement: 35,
    temporality: 65, humanity: 65, clarity: 80, intimacy: 45, control: 78,
  },
  // neo-grotesque sans — Helvetica / Univers — neutral, modernist
  "neo-grotesque": {
    energy: 55, temperature: 48, tension: 32, density: 58, movement: 45,
    temporality: 35, humanity: 50, clarity: 88, intimacy: 38, control: 92,
  },
  // geometric sans — Futura / Avenir — circles and straight lines
  "geometric-sans": {
    energy: 62, temperature: 45, tension: 30, density: 50, movement: 55,
    temporality: 38, humanity: 45, clarity: 90, intimacy: 35, control: 90,
  },
  // humanist sans — Gill Sans / Optima — calligraphic-inflected sans
  "humanist-sans": {
    energy: 48, temperature: 58, tension: 28, density: 55, movement: 45,
    temporality: 65, humanity: 80, clarity: 78, intimacy: 65, control: 75,
  },
  // monospace — typewriter / coding
  "monospace": {
    energy: 45, temperature: 42, tension: 48, density: 65, movement: 32,
    temporality: 55, humanity: 60, clarity: 88, intimacy: 52, control: 92,
  },
  // display — strong personality, attention-grabbing
  "display": {
    energy: 78, temperature: 62, tension: 65, density: 68, movement: 75,
    temporality: 42, humanity: 70, clarity: 65, intimacy: 55, control: 55,
  },
  // handwriting — script / casual
  "handwriting": {
    energy: 52, temperature: 70, tension: 38, density: 50, movement: 75,
    temporality: 62, humanity: 92, clarity: 55, intimacy: 88, control: 32,
  },
  // blackletter — gothic / fraktur
  "blackletter": {
    energy: 55, temperature: 38, tension: 75, density: 85, movement: 35,
    temporality: 95, humanity: 68, clarity: 45, intimacy: 55, control: 78,
  },
};

const AXIS_TONE = {
  "humanist-serif":     "Calígrafico, orgánico, cálido: el libro como cosa hecha a mano.",
  "transitional-serif": "Equilibrio entre tradición y razón ilustrada: la página neoclásica.",
  "modern-serif":       "Contraste extremo y eje vertical: el siglo XIX racionalista, frío.",
  "slab-serif":         "Industria, periódico, máquina: lo robusto que se planta sin disculpa.",
  "neo-grotesque":      "Modernismo suizo: claridad sin afecto.",
  "geometric-sans":     "Círculo y recta: la utopía Bauhaus, lo platónico.",
  "humanist-sans":      "Sans con memoria calígrafica: humano y limpio a la vez.",
  "monospace":          "Pulso de máquina de escribir: lo técnico convertido en honestidad.",
  "display":            "Personalidad por encima de la legibilidad: el titular en voz alta.",
  "handwriting":        "Mano humana visible: lo personal, lo precario, lo cariñoso.",
  "blackletter":        "Edad media tardía: peso, oscuridad, ritualidad escrita.",
};

const ERA_OFFSET = {
  "ancient":    { temporality: +8 },          // Roman square caps, etc.
  "renaissance":{ temporality: +6 },
  "baroque":    { temporality: +3 },
  "enlightenment": { temporality: +0 },
  "industrial": { temporality: -2 },
  "modernist":  { temporality: -8 },
  "postmodern": { temporality: -10 },
  "contemporary":{ temporality: -12 },
};

const VOICE_OFFSET = {
  "literary":   { intimacy: +6, humanity: +6 },
  "editorial":  { clarity: +4, control: +4 },
  "technical":  { clarity: +8, control: +6, intimacy: -4 },
  "neutral":    { humanity: -4, intimacy: -4 },
  "expressive": { energy: +8, tension: +6 },
  "ceremonial": { control: +6, temporality: +6, density: +4 },
  "casual":     { humanity: +6, control: -6, tension: -4 },
};

function clamp(n, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }

// ─── 80 fonts with classification ───────────────────────────────────────────

const FONTS = [
  // ── Humanist serifs ─────────────────────────────────────────────────────
  { id: "centaur",      name: "Centaur",         google: "Cormorant Garamond",  category: "serif", axis: "humanist-serif", era: "renaissance", voice: "literary" },
  { id: "bembo",        name: "Bembo",           google: "Cormorant",           category: "serif", axis: "humanist-serif", era: "renaissance", voice: "literary" },
  { id: "garamond",     name: "Garamond",        google: "EB Garamond",         category: "serif", axis: "humanist-serif", era: "renaissance", voice: "literary" },
  { id: "sabon",        name: "Sabon",           google: "Cormorant Infant",    category: "serif", axis: "humanist-serif", era: "modernist", voice: "editorial" },
  { id: "minion",       name: "Minion",          google: "Cormorant Upright",   category: "serif", axis: "humanist-serif", era: "contemporary", voice: "editorial" },
  { id: "jenson",       name: "Jenson",          google: "Marcellus",           category: "serif", axis: "humanist-serif", era: "renaissance", voice: "ceremonial" },
  { id: "cormorant",    name: "Cormorant",       google: "Cormorant SC",        category: "serif", axis: "humanist-serif", era: "contemporary", voice: "literary" },

  // ── Transitional serifs ─────────────────────────────────────────────────
  { id: "caslon",       name: "Caslon",          google: "Libre Caslon Text",   category: "serif", axis: "transitional-serif", era: "enlightenment", voice: "literary" },
  { id: "baskerville",  name: "Baskerville",     google: "Libre Baskerville",   category: "serif", axis: "transitional-serif", era: "enlightenment", voice: "literary" },
  { id: "lora",         name: "Lora",            google: "Lora",                category: "serif", axis: "transitional-serif", era: "contemporary", voice: "editorial" },
  { id: "crimson",      name: "Crimson Text",    google: "Crimson Text",        category: "serif", axis: "transitional-serif", era: "contemporary", voice: "literary" },
  { id: "merriweather", name: "Merriweather",    google: "Merriweather",        category: "serif", axis: "transitional-serif", era: "contemporary", voice: "editorial" },
  { id: "ptserif",      name: "PT Serif",        google: "PT Serif",            category: "serif", axis: "transitional-serif", era: "contemporary", voice: "editorial" },
  { id: "source-serif", name: "Source Serif",    google: "Source Serif 4",      category: "serif", axis: "transitional-serif", era: "contemporary", voice: "editorial" },

  // ── Modern serifs ───────────────────────────────────────────────────────
  { id: "bodoni",       name: "Bodoni",          google: "Bodoni Moda",         category: "serif", axis: "modern-serif", era: "enlightenment", voice: "ceremonial" },
  { id: "didot",        name: "Didot",           google: "GFS Didot",           category: "serif", axis: "modern-serif", era: "enlightenment", voice: "ceremonial" },
  { id: "playfair",     name: "Playfair Display",google: "Playfair Display",    category: "serif", axis: "modern-serif", era: "contemporary", voice: "expressive" },
  { id: "walbaum",      name: "Walbaum",         google: "Bellefair",           category: "serif", axis: "modern-serif", era: "industrial", voice: "ceremonial" },
  { id: "tinos",        name: "Tinos",           google: "Tinos",               category: "serif", axis: "modern-serif", era: "contemporary", voice: "neutral" },
  { id: "dm-serif",     name: "DM Serif Display",google: "DM Serif Display",    category: "serif", axis: "modern-serif", era: "contemporary", voice: "expressive" },

  // ── Slab serifs ─────────────────────────────────────────────────────────
  { id: "clarendon",    name: "Clarendon",       google: "Roboto Slab",         category: "serif", axis: "slab-serif", era: "industrial", voice: "editorial" },
  { id: "roboto-slab",  name: "Roboto Slab",     google: "Roboto Slab",         category: "serif", axis: "slab-serif", era: "contemporary", voice: "editorial" },
  { id: "arvo",         name: "Arvo",            google: "Arvo",                category: "serif", axis: "slab-serif", era: "contemporary", voice: "neutral" },
  { id: "bree-serif",   name: "Bree Serif",      google: "Bree Serif",          category: "serif", axis: "slab-serif", era: "contemporary", voice: "casual" },
  { id: "bevan",        name: "Bevan",           google: "Bevan",               category: "serif", axis: "slab-serif", era: "industrial", voice: "expressive" },
  { id: "rockwell",     name: "Rockwell",        google: "Ultra",               category: "serif", axis: "slab-serif", era: "industrial", voice: "expressive" },
  { id: "alfa-slab",    name: "Alfa Slab One",   google: "Alfa Slab One",       category: "serif", axis: "slab-serif", era: "contemporary", voice: "expressive" },

  // ── Neo-grotesque sans ──────────────────────────────────────────────────
  { id: "helvetica",    name: "Helvetica",       google: "Inter",               category: "sans-serif", axis: "neo-grotesque", era: "modernist", voice: "neutral" },
  { id: "inter",        name: "Inter",           google: "Inter",               category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "neutral" },
  { id: "roboto",       name: "Roboto",          google: "Roboto",              category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "neutral" },
  { id: "ibm-plex-sans",name: "IBM Plex Sans",   google: "IBM Plex Sans",       category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "technical" },
  { id: "work-sans",    name: "Work Sans",       google: "Work Sans",           category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "neutral" },
  { id: "barlow",       name: "Barlow",          google: "Barlow",              category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "neutral" },
  { id: "manrope",      name: "Manrope",         google: "Manrope",             category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "neutral" },
  { id: "rubik",        name: "Rubik",           google: "Rubik",               category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "casual" },

  // ── Geometric sans ──────────────────────────────────────────────────────
  { id: "futura",       name: "Futura",          google: "Outfit",              category: "sans-serif", axis: "geometric-sans", era: "modernist", voice: "ceremonial" },
  { id: "avenir",       name: "Avenir",          google: "Nunito",              category: "sans-serif", axis: "geometric-sans", era: "modernist", voice: "neutral" },
  { id: "poppins",      name: "Poppins",         google: "Poppins",             category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "neutral" },
  { id: "montserrat",   name: "Montserrat",      google: "Montserrat",          category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "neutral" },
  { id: "quicksand",    name: "Quicksand",       google: "Quicksand",           category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "casual" },
  { id: "comfortaa",    name: "Comfortaa",       google: "Comfortaa",           category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "casual" },
  { id: "raleway",      name: "Raleway",         google: "Raleway",             category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "expressive" },
  { id: "josefin",      name: "Josefin Sans",    google: "Josefin Sans",        category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "expressive" },
  { id: "outfit",       name: "Outfit",          google: "Outfit",              category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "neutral" },

  // ── Humanist sans ───────────────────────────────────────────────────────
  { id: "gill-sans",    name: "Gill Sans",       google: "Cabin",               category: "sans-serif", axis: "humanist-sans", era: "modernist", voice: "literary" },
  { id: "optima",       name: "Optima",          google: "Marcellus Sans",      category: "sans-serif", axis: "humanist-sans", era: "modernist", voice: "ceremonial" },
  { id: "frutiger",     name: "Frutiger",        google: "Mulish",              category: "sans-serif", axis: "humanist-sans", era: "modernist", voice: "neutral" },
  { id: "source-sans",  name: "Source Sans 3",   google: "Source Sans 3",       category: "sans-serif", axis: "humanist-sans", era: "contemporary", voice: "editorial" },
  { id: "open-sans",    name: "Open Sans",       google: "Open Sans",           category: "sans-serif", axis: "humanist-sans", era: "contemporary", voice: "neutral" },
  { id: "nunito-sans",  name: "Nunito Sans",     google: "Nunito Sans",         category: "sans-serif", axis: "humanist-sans", era: "contemporary", voice: "casual" },
  { id: "fira-sans",    name: "Fira Sans",       google: "Fira Sans",           category: "sans-serif", axis: "humanist-sans", era: "contemporary", voice: "technical" },
  { id: "karla",        name: "Karla",           google: "Karla",               category: "sans-serif", axis: "humanist-sans", era: "contemporary", voice: "editorial" },

  // ── Monospace ───────────────────────────────────────────────────────────
  { id: "courier",      name: "Courier",         google: "Courier Prime",       category: "monospace", axis: "monospace", era: "industrial", voice: "technical" },
  { id: "ibm-plex-mono",name: "IBM Plex Mono",   google: "IBM Plex Mono",       category: "monospace", axis: "monospace", era: "contemporary", voice: "technical" },
  { id: "jetbrains-mono",name: "JetBrains Mono", google: "JetBrains Mono",      category: "monospace", axis: "monospace", era: "contemporary", voice: "technical" },
  { id: "inconsolata",  name: "Inconsolata",     google: "Inconsolata",         category: "monospace", axis: "monospace", era: "contemporary", voice: "technical" },
  { id: "space-mono",   name: "Space Mono",      google: "Space Mono",          category: "monospace", axis: "monospace", era: "contemporary", voice: "expressive" },
  { id: "fira-mono",    name: "Fira Mono",       google: "Fira Mono",           category: "monospace", axis: "monospace", era: "contemporary", voice: "technical" },

  // ── Display ─────────────────────────────────────────────────────────────
  { id: "bungee",       name: "Bungee",          google: "Bungee",              category: "display", axis: "display", era: "contemporary", voice: "expressive" },
  { id: "lobster",      name: "Lobster",         google: "Lobster",             category: "display", axis: "display", era: "contemporary", voice: "casual" },
  { id: "abril-fatface",name: "Abril Fatface",   google: "Abril Fatface",       category: "display", axis: "display", era: "contemporary", voice: "expressive" },
  { id: "anton",        name: "Anton",           google: "Anton",               category: "display", axis: "display", era: "contemporary", voice: "expressive" },
  { id: "oswald",       name: "Oswald",          google: "Oswald",              category: "display", axis: "display", era: "contemporary", voice: "expressive" },
  { id: "bebas-neue",   name: "Bebas Neue",      google: "Bebas Neue",          category: "display", axis: "display", era: "contemporary", voice: "expressive" },
  { id: "monoton",      name: "Monoton",         google: "Monoton",             category: "display", axis: "display", era: "contemporary", voice: "expressive" },
  { id: "fjalla-one",   name: "Fjalla One",      google: "Fjalla One",          category: "display", axis: "display", era: "contemporary", voice: "neutral" },
  { id: "righteous",    name: "Righteous",       google: "Righteous",           category: "display", axis: "display", era: "contemporary", voice: "expressive" },

  // ── Handwriting / script ────────────────────────────────────────────────
  { id: "caveat",       name: "Caveat",          google: "Caveat",              category: "handwriting", axis: "handwriting", era: "contemporary", voice: "casual" },
  { id: "pacifico",     name: "Pacifico",        google: "Pacifico",            category: "handwriting", axis: "handwriting", era: "contemporary", voice: "casual" },
  { id: "kalam",        name: "Kalam",           google: "Kalam",               category: "handwriting", axis: "handwriting", era: "contemporary", voice: "casual" },
  { id: "amatic-sc",    name: "Amatic SC",       google: "Amatic SC",           category: "handwriting", axis: "handwriting", era: "contemporary", voice: "casual" },
  { id: "shadows-into-light",name: "Shadows Into Light", google: "Shadows Into Light", category: "handwriting", axis: "handwriting", era: "contemporary", voice: "casual" },
  { id: "dancing-script",name: "Dancing Script", google: "Dancing Script",      category: "handwriting", axis: "handwriting", era: "contemporary", voice: "expressive" },
  { id: "great-vibes",  name: "Great Vibes",     google: "Great Vibes",         category: "handwriting", axis: "handwriting", era: "contemporary", voice: "ceremonial" },
  { id: "satisfy",      name: "Satisfy",         google: "Satisfy",             category: "handwriting", axis: "handwriting", era: "contemporary", voice: "casual" },

  // ── Blackletter ─────────────────────────────────────────────────────────
  { id: "uncialantiqua",name: "Uncial Antiqua",  google: "Uncial Antiqua",      category: "display", axis: "blackletter", era: "ancient", voice: "ceremonial" },
  { id: "metamorphous", name: "Metamorphous",    google: "Metamorphous",        category: "display", axis: "blackletter", era: "renaissance", voice: "ceremonial" },
  { id: "macondo",      name: "Macondo",         google: "Macondo",             category: "display", axis: "blackletter", era: "renaissance", voice: "expressive" },
  { id: "pirata-one",   name: "Pirata One",      google: "Pirata One",          category: "display", axis: "blackletter", era: "ancient", voice: "expressive" },

  // ── A few extras for breadth ─────────────────────────────────────────────
  { id: "space-grotesk",name: "Space Grotesk",   google: "Space Grotesk",       category: "sans-serif", axis: "neo-grotesque", era: "contemporary", voice: "technical" },
  { id: "syne",         name: "Syne",            google: "Syne",                category: "sans-serif", axis: "geometric-sans", era: "contemporary", voice: "expressive" },
  { id: "spectral",     name: "Spectral",        google: "Spectral",            category: "serif", axis: "transitional-serif", era: "contemporary", voice: "literary" },
  { id: "noto-serif",   name: "Noto Serif",      google: "Noto Serif",          category: "serif", axis: "transitional-serif", era: "contemporary", voice: "neutral" },
];

// ─── Build vector for each font ─────────────────────────────────────────────

function buildVector(axis, era, voice) {
  const base = { ...AXIS_BASE[axis] };
  const eraOff = ERA_OFFSET[era] ?? {};
  const voiceOff = VOICE_OFFSET[voice] ?? {};
  for (const k of Object.keys(eraOff)) base[k] = clamp(base[k] + eraOff[k]);
  for (const k of Object.keys(voiceOff)) base[k] = clamp(base[k] + voiceOff[k]);
  return base;
}

// ─── Emit ───────────────────────────────────────────────────────────────────

const collected = FONTS.map((f) => ({
  id: f.id,
  name: f.name,
  googleFontFamily: f.google,
  category: f.category,
  description: AXIS_TONE[f.axis],
  emotionalTone: AXIS_TONE[f.axis],
  resonance: buildVector(f.axis, f.era, f.voice),
  emotionResonance: [],
  specimen: "Álbum",
  sampleText: "El álbum es la cartografía de lo que sentimos.",
  designerEra: f.era,
  historicalContext: AXIS_TONE[f.axis],
}));

console.log(`Generated ${collected.length} fonts`);

const outPath = path.join(__dirname, "..", "src/data/typography/fonts-extended.ts");
const body =
`import type { TypographyResonance } from "@/types";

/**
 * Extended typography catalogue (Google Fonts) classified by structural
 * axis (humanist-serif, transitional-serif, modern-serif, slab-serif,
 * neo-grotesque, geometric-sans, humanist-sans, monospace, display,
 * handwriting, blackletter), era and voice.
 *
 * Each font's resonance vector is derived from these formal attributes —
 * no hand-authored per-font vector. The 8 canonical fonts already in
 * fonts.ts survive as the curated baseline; this fills the rest of the
 * typographic space.
 *
 * Generated by scripts/generate-fonts.mjs.
 * Total: ${collected.length} fonts.
 */
export const TYPOGRAPHY_EXTENDED: TypographyResonance[] = ${JSON.stringify(collected, null, 2)};
`;
await fs.writeFile(outPath, body, "utf8");
console.log(`Wrote ${outPath}`);
