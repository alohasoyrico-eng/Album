#!/usr/bin/env node
/**
 * Generates an expanded color catalogue (~130 entries) by combining:
 *   1. ~55 culturally-named colors with hand-picked hex (Heller / Pantone /
 *      design-history conventions in Spanish).
 *   2. A systematic HSL grid sample to fill out the perceptual space.
 *
 * Each color's resonance vector is derived from HSL via the same rules the
 * deriver in src/lib/color-deriver.ts uses — see that file for the full
 * mapping rationale.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── HSL helpers ─────────────────────────────────────────────────────────────

function hexToHSL(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0, hue = 0;
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

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
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
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function clamp(n, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }
function r(n) { return Math.round(n); }

// ─── Family classification ───────────────────────────────────────────────────

function familyOfHSL({ h, s, l }) {
  if (s < 8) return "neutral";
  if (l < 22 && s < 35) return "neutral";
  if (h >= 15 && h <= 50 && s < 60 && l < 55) return "brown";
  if (h < 15 || h >= 345) return "red";
  if (h < 30) return "orange";
  if (h < 50) return "yellow";
  if (h < 70) return "yellow-green";
  if (h < 165) return "green";
  if (h < 195) return "teal";
  if (h < 250) return "blue";
  if (h < 290) return "violet";
  if (h < 345) return "magenta";
  return "red";
}

function isPink(hsl, family) {
  if (family !== "magenta" && family !== "red") return false;
  return hsl.l > 60 && hsl.s > 25;
}

const FAMILY_TAGS = {
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

const FAMILY_DESCRIPTION = {
  red:           "El rojo recorre el cuerpo entero.",
  pink:          "El rosa carga la dulzura que la sociedad le impuso — y la rebeldía que de ahí se desprende.",
  orange:        "El naranja vive entre el sol y el fuego doméstico.",
  yellow:        "El amarillo se contradice solo: es alegría y peligro a la vez.",
  "yellow-green": "El verde-amarillento es la salud que sospecha de sí misma.",
  green:         "El verde es la vida que continúa.",
  teal:          "El turquesa es la respiración del frío.",
  blue:          "El azul es la distancia hecha color.",
  violet:        "El violeta no termina de decidirse entre el calor y el frío.",
  magenta:       "El magenta vive entre los extremos del espectro.",
  brown:         "El marrón es el tiempo que cubre todo.",
  neutral:       "El gris es la conciencia sin sentencia.",
  metallic:      "Los metales convierten el color en superficie.",
};

const FAMILY_BIAS = {
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

function temperatureFromHue(h, s) {
  const t = 50 + Math.cos((h * Math.PI) / 180) * 38;
  return clamp(50 + (t - 50) * (s / 100), 14, 92);
}

function derive({ id, name, nameEs, hex, family: famOverride, appreciatedRank, lessAppreciatedRank, description, hellerQuote, extraTags }) {
  const hsl = hexToHSL(hex);
  let family = famOverride ?? familyOfHSL(hsl);
  if (family !== "metallic" && family !== "neutral" && isPink(hsl, family)) family = "pink";

  const base = {
    energy:      r(clamp(hsl.s * 0.7 + hsl.l * 0.25 + 8)),
    temperature: r(temperatureFromHue(hsl.h, hsl.s)),
    tension:     r(clamp(hsl.s * 0.5 + 18)),
    density:     r(clamp((100 - hsl.l) * 0.85 + 15)),
    movement:    r(clamp(hsl.s * 0.4 + 25)),
    temporality: r(clamp(60 - hsl.s * 0.2 + (100 - hsl.l) * 0.15)),
    humanity:    r(clamp(55 - Math.abs(hsl.l - 55) * 0.4 + (hsl.s > 50 ? 6 : 0))),
    clarity:     r(clamp(hsl.s * 0.4 + (100 - hsl.l) * 0.18 + 35)),
    intimacy:    r(clamp(50 - hsl.s * 0.15 + (hsl.l > 60 ? 12 : -6))),
    control:     r(clamp(55 - hsl.s * 0.25 + (Math.abs(hsl.l - 50) * 0.18))),
  };
  const bias = FAMILY_BIAS[family];
  for (const k of Object.keys(bias)) base[k] = clamp(base[k] + bias[k]);

  const tags = [...FAMILY_TAGS[family], ...(extraTags ?? [])];

  return {
    id, name, nameEs, hex,
    hsl: { h: r(hsl.h), s: r(hsl.s), l: r(hsl.l) },
    hellerRank: appreciatedRank ?? 999,
    appreciatedRank: appreciatedRank ?? null,
    lessAppreciatedRank: lessAppreciatedRank ?? null,
    primaryEmotions: [],
    contradictoryEmotions: [],
    culturalMeanings: tags.slice(0, 6),
    resonance: base,
    description: description ?? FAMILY_DESCRIPTION[family],
    hellerQuote: hellerQuote ?? "—",
    symbolism: tags,
  };
}

// ─── 55 culturally-named colors (Spanish color tradition) ───────────────────

const NAMED = [
  // Reds
  { id: "rojo-carmesi",    nameEs: "Rojo carmesí",    name: "Crimson",       hex: "#9B1B30" },
  { id: "rojo-bermellon",  nameEs: "Rojo bermellón",  name: "Vermillion",    hex: "#E34234" },
  { id: "rojo-borgona",    nameEs: "Rojo borgoña",    name: "Burgundy",      hex: "#591125" },
  { id: "rojo-coral",      nameEs: "Coral",           name: "Coral",         hex: "#FF6F61" },
  { id: "rojo-teja",       nameEs: "Rojo teja",       name: "Brick Red",     hex: "#A8412B" },
  { id: "rojo-sangre",     nameEs: "Sangre",          name: "Blood Red",     hex: "#6B0D0D" },
  { id: "rojo-cereza",     nameEs: "Cereza",          name: "Cherry",        hex: "#B0091E" },
  // Pinks
  { id: "rosa-fucsia",     nameEs: "Fucsia",          name: "Fuchsia",       hex: "#D62A80" },
  { id: "rosa-salmon",     nameEs: "Salmón",          name: "Salmon",        hex: "#F1A493" },
  { id: "rosa-palo",       nameEs: "Rosa palo",       name: "Pale Pink",     hex: "#F4C2C2" },
  { id: "rosa-magenta",    nameEs: "Magenta",         name: "Magenta",       hex: "#CC2E70" },
  { id: "rosa-bebe",       nameEs: "Rosa bebé",       name: "Baby Pink",     hex: "#F8D2DA" },
  // Oranges
  { id: "naranja-melocoton", nameEs: "Melocotón",     name: "Peach",         hex: "#FFC8A2" },
  { id: "naranja-calabaza",  nameEs: "Calabaza",      name: "Pumpkin",       hex: "#D86E1E" },
  { id: "naranja-ocre",      nameEs: "Ocre",          name: "Ochre",         hex: "#CC7A29" },
  { id: "naranja-terracota", nameEs: "Terracota",     name: "Terracotta",    hex: "#A55A38" },
  { id: "naranja-zanahoria", nameEs: "Zanahoria",     name: "Carrot",        hex: "#ED9121" },
  // Yellows
  { id: "amarillo-limon",   nameEs: "Limón",          name: "Lemon",         hex: "#F0E441" },
  { id: "amarillo-mostaza", nameEs: "Mostaza",        name: "Mustard",       hex: "#C5A030" },
  { id: "amarillo-ambar",   nameEs: "Ámbar",          name: "Amber",         hex: "#E0A22A" },
  { id: "amarillo-azufre",  nameEs: "Azufre",         name: "Sulfur",        hex: "#F2D33A" },
  { id: "amarillo-trigo",   nameEs: "Trigo",          name: "Wheat",         hex: "#E6C58A" },
  // Yellow-greens
  { id: "verde-lima",       nameEs: "Lima",           name: "Lime",          hex: "#9BC53D" },
  { id: "verde-oliva",      nameEs: "Oliva",          name: "Olive",         hex: "#7A752C" },
  { id: "verde-acido",      nameEs: "Verde ácido",    name: "Acid Green",    hex: "#B0D32E" },
  // Greens
  { id: "verde-esmeralda",  nameEs: "Esmeralda",      name: "Emerald",       hex: "#1A8048" },
  { id: "verde-menta",      nameEs: "Menta",          name: "Mint",          hex: "#A4DECC" },
  { id: "verde-militar",    nameEs: "Verde militar",  name: "Military Green",hex: "#4A5320" },
  { id: "verde-botella",    nameEs: "Verde botella",  name: "Bottle Green",  hex: "#0D5934" },
  { id: "verde-musgo",      nameEs: "Musgo",          name: "Moss",          hex: "#7F8A4A" },
  { id: "verde-jade",       nameEs: "Jade",           name: "Jade",          hex: "#3A9D5C" },
  // Teals
  { id: "verde-turquesa",   nameEs: "Turquesa",       name: "Turquoise",     hex: "#33A6A8" },
  { id: "verde-azulado",    nameEs: "Verde azulado",  name: "Teal",          hex: "#1F7A7A" },
  { id: "azul-aguamarina",  nameEs: "Aguamarina",     name: "Aquamarine",    hex: "#7AC8C8" },
  // Blues
  { id: "azul-cielo",       nameEs: "Azul cielo",     name: "Sky Blue",      hex: "#82B6E9" },
  { id: "azul-marino",      nameEs: "Azul marino",    name: "Navy",          hex: "#1B2A4E" },
  { id: "azul-cobalto",     nameEs: "Azul cobalto",   name: "Cobalt",        hex: "#0048BA" },
  { id: "azul-klein",       nameEs: "Azul Klein",     name: "Yves Klein",    hex: "#002FA7", description: "El azul que Yves Klein patentó como propio." },
  { id: "azul-prusia",      nameEs: "Azul prusia",    name: "Prussian Blue", hex: "#003153" },
  { id: "azul-acero",       nameEs: "Azul acero",     name: "Steel Blue",    hex: "#4682B4" },
  { id: "azul-petroleo",    nameEs: "Petróleo",       name: "Petrol Blue",   hex: "#1F3A4D" },
  // Violets
  { id: "violeta-lila",     nameEs: "Lila",           name: "Lilac",         hex: "#C8A2C8" },
  { id: "violeta-malva",    nameEs: "Malva",          name: "Mauve",         hex: "#9E7BB5" },
  { id: "violeta-lavanda",  nameEs: "Lavanda",        name: "Lavender",      hex: "#B57EDC" },
  { id: "violeta-purpura",  nameEs: "Púrpura",        name: "Purple",        hex: "#5D3A6B" },
  { id: "violeta-berenjena",nameEs: "Berenjena",      name: "Aubergine",     hex: "#3E2444" },
  { id: "violeta-amatista", nameEs: "Amatista",       name: "Amethyst",      hex: "#7A4CAA" },
  // Browns
  { id: "marron-sepia",     nameEs: "Sepia",          name: "Sepia",         hex: "#704214" },
  { id: "marron-caoba",     nameEs: "Caoba",          name: "Mahogany",      hex: "#5C3317" },
  { id: "marron-cafe",      nameEs: "Café",           name: "Coffee",        hex: "#6B4F3A" },
  { id: "marron-canela",    nameEs: "Canela",         name: "Cinnamon",      hex: "#A0522D" },
  { id: "marron-chocolate", nameEs: "Chocolate",      name: "Chocolate",     hex: "#3E2723" },
  { id: "marron-castano",   nameEs: "Castaño",        name: "Chestnut",      hex: "#7A3E1D" },
  { id: "marron-arena",     nameEs: "Arena",          name: "Sand",          hex: "#C2B280" },
  { id: "marron-tabaco",    nameEs: "Tabaco",         name: "Tobacco",       hex: "#6D5638" },
  // Neutrals
  { id: "neutro-crudo",     nameEs: "Crudo",          name: "Ecru",          hex: "#C9B79C" },
  { id: "neutro-hueso",     nameEs: "Hueso",          name: "Bone",          hex: "#E3DAC9" },
  { id: "neutro-antracita", nameEs: "Antracita",      name: "Anthracite",    hex: "#2C2E33" },
  { id: "neutro-pizarra",   nameEs: "Pizarra",        name: "Slate",         hex: "#54626F" },
  { id: "neutro-perla",     nameEs: "Perla",          name: "Pearl",         hex: "#E5E2D6" },
  { id: "neutro-piedra",    nameEs: "Piedra",         name: "Stone",         hex: "#928E85" },
  { id: "neutro-ceniza",    nameEs: "Ceniza",         name: "Ash",           hex: "#7C7C77" },
  // Metallics
  { id: "metal-bronce",     nameEs: "Bronce",         name: "Bronze",        hex: "#8C6F4A", family: "metallic" },
  { id: "metal-cobre",      nameEs: "Cobre",          name: "Copper",        hex: "#B87333", family: "metallic" },
  { id: "metal-laton",      nameEs: "Latón",          name: "Brass",         hex: "#B5A642", family: "metallic" },
  { id: "metal-acero",      nameEs: "Acero",          name: "Steel",         hex: "#797E84", family: "metallic" },
  { id: "metal-platino",    nameEs: "Platino",        name: "Platinum",      hex: "#C8C5BD", family: "metallic" },
];

// ─── Build catalogue ─────────────────────────────────────────────────────────

const collected = NAMED.map(derive);

// HSL grid sampling — fill perceptual space with synthetic colors
// We use carefully spaced steps so neighboring entries are perceptibly different
const HUE_STEPS  = [10, 25, 40, 55, 70, 90, 110, 130, 150, 170, 190, 210, 230, 250, 270, 290, 310, 330];
const LIGHT_STEPS = [25, 45, 65, 80];
const SAT_STEPS = [55, 85];

for (const h of HUE_STEPS) {
  for (const l of LIGHT_STEPS) {
    for (const s of SAT_STEPS) {
      const hex = hslToHex(h, s, l);
      const id = `grid-h${h}-s${s}-l${l}`;
      // Name is "tono-{family}-{lightness}{saturation}"
      const hsl = { h, s, l };
      const fam = familyOfHSL(hsl);
      const pinkFam = isPink(hsl, fam) ? "pink" : fam;
      const lightName = l < 35 ? "oscuro" : l < 60 ? "medio" : l < 75 ? "claro" : "muy claro";
      const satName = s > 75 ? "saturado" : "moderado";
      const familyEs = {
        red: "rojo", pink: "rosa", orange: "naranja", yellow: "amarillo",
        "yellow-green": "verde-amarillo", green: "verde", teal: "turquesa",
        blue: "azul", violet: "violeta", magenta: "magenta",
        brown: "marrón", neutral: "neutro", metallic: "metal",
      }[pinkFam];
      const nameEs = `Tono ${familyEs} ${lightName}`;
      collected.push(derive({
        id,
        nameEs,
        name: `${familyEs[0].toUpperCase()}${familyEs.slice(1)} ${lightName}`,
        hex,
        extraTags: [satName, lightName],
      }));
    }
  }
}

// Deduplicate by id (in case grid overlaps a named color)
const byId = new Map();
for (const c of collected) byId.set(c.id, c);
const final = Array.from(byId.values());

console.log(`Generated ${final.length} colors (${NAMED.length} named + ${final.length - NAMED.length} grid).`);

// Emit TS file
const outPath = path.join(ROOT, "src/data/colors/colors-derived.ts");
const body =
`import type { ColorResonance } from "@/types";

/**
 * Derived color catalogue. Combines:
 *   - 55 culturally-named Spanish colors (Heller / Pantone / design history)
 *   - HSL grid samples for full perceptual coverage
 *
 * Generated by scripts/generate-colors.mjs. Each color's resonance vector
 * is derived from HSL via the rules in src/lib/color-deriver.ts — hue maps
 * to temperature, saturation to energy/clarity, lightness to density,
 * with per-family cultural bias applied on top.
 *
 * Total: ${final.length} colors.
 */
export const COLORS_DERIVED: ColorResonance[] = ${JSON.stringify(final, null, 2)};
`;
await fs.writeFile(outPath, body, "utf8");
console.log(`Wrote ${outPath}`);
