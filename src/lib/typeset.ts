/**
 * Per-emotion typographic SET — four coordinated voices, chosen by
 * RESONANCE BAND rather than pure cosine similarity. Cosine alone collapses
 * to similar fonts for similar emotions; bands inject categorical contrast
 * so amor and ira don't share a single visible glyph.
 *
 * Roles:
 *   display    — title voice
 *   body       — long-form reading
 *   literary   — italic/poetic register
 *   technical  — caption/UI/labels
 *
 * Selection: for each role we determine the PREFERRED font category from
 * the resonance signature (e.g. high temperature + humanity → handwriting
 * for display; high tension + low temperature → display/serif heavy slab),
 * then we pick within that category the font whose vector resonates best.
 */

import type { ResonanceAxes, TypographyResonance } from "@/types";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { buildVector, cosineSimilarity } from "./resonance-vector";
import { emotionTypeSet } from "./emotionFonts";

export interface EmotionTypeSet {
  display: TypographyResonance | null;
  body: TypographyResonance | null;
  literary: TypographyResonance | null;
  technical: TypographyResonance | null;
}

type Category = TypographyResonance["category"];

// ─── Band classification ────────────────────────────────────────────────

function displayCategoryFor(r: ResonanceAxes): Category[] {
  // The display role is always meant to PROCLAIM the emotion. We bias HARD
  // toward expressive categories (display, handwriting, blackletter-style)
  // so the page's title genuinely changes face per emotion — not "Garamond
  // for melancolía, Garamond for nostalgia, Garamond for sadness".
  //
  // Hot + intimate + human → handwriting (love letter, hand of a person)
  if (r.temperature >= 55 && (r.humanity >= 60 || r.intimacy >= 65)) return ["handwriting", "display", "serif"];
  // Cold + tense → display heavy (Bodoni Moda, Anton, Abril Fatface)
  if (r.tension >= 55 && r.temperature <= 50) return ["display", "serif"];
  // High energy / movement → display bold (poster lettering)
  if (r.energy >= 60 || r.movement >= 65) return ["display", "sans-serif"];
  // Ancient + dense → display serif with weight (DM Serif Display, Playfair)
  if (r.temporality >= 65 && r.density >= 50) return ["display", "serif"];
  // Cold + clear + controlled → neo-grotesque / geometric sans
  if (r.clarity >= 65 && r.control >= 60 && r.temperature <= 45) return ["sans-serif", "display"];
  // Murky + low clarity → display / handwriting (irregular)
  if (r.clarity <= 35) return ["handwriting", "display", "serif"];
  // Default — even here prefer display before quiet body serif
  return ["display", "serif"];
}

function bodyCategoryFor(r: ResonanceAxes): Category[] {
  // Clarity + control → sans-serif legibility
  if (r.clarity >= 70 && r.control >= 65) return ["sans-serif"];
  // Warm + intimate → soft humanist serif
  if (r.temperature >= 55 && r.humanity >= 60) return ["serif"];
  // Tense → serif with weight (no handwriting bodies)
  if (r.tension >= 65) return ["serif", "sans-serif"];
  // Ancient → classical serif
  if (r.temporality >= 70) return ["serif"];
  return ["serif", "sans-serif"];
}

function literaryCategoryFor(r: ResonanceAxes): Category[] {
  // Hot + intimate → handwriting (love letter)
  if (r.temperature >= 55 && r.intimacy >= 60) return ["handwriting", "serif"];
  // High humanity, mid temperature → italic literary serif
  if (r.humanity >= 65) return ["serif", "handwriting"];
  // Cold + tense → display (anti-poetic, dramatic)
  if (r.temperature <= 35 && r.tension >= 60) return ["display", "serif"];
  return ["serif", "handwriting"];
}

function technicalCategoryFor(r: ResonanceAxes): Category[] {
  // Tense + controlled → monospace (clinical, surveillance)
  if (r.tension >= 60 && r.control >= 60) return ["monospace"];
  // Cold + clear → mono / neo-grotesque
  if (r.temperature <= 40 && r.clarity >= 65) return ["monospace", "sans-serif"];
  // Warm + human → small sans-serif (less clinical)
  if (r.temperature >= 60) return ["sans-serif"];
  return ["monospace", "sans-serif"];
}

// ─── Picker ─────────────────────────────────────────────────────────────

/**
 * Per-emotion fingerprint hash. Two emotions with slightly different axes
 * produce different hashes, which we use to bias selection inside cosine-
 * ranked shortlists. Result: when 10 emotions all score "best display" as
 * Cormorant, the hash spreads them across Cormorant / Bodoni Moda / DM
 * Serif Display / Playfair / Marcellus instead of all picking Cormorant.
 */
function fingerprint(r: ResonanceAxes): number {
  const xs = [r.energy, r.temperature, r.tension, r.density, r.movement,
              r.temporality, r.humanity, r.clarity, r.intimacy, r.control];
  let h = 2166136261;
  for (const x of xs) {
    h ^= Math.round(x * 7);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickBestInCategories(
  resonance: ResonanceAxes,
  allowed: Category[],
  excludeIds: Set<string>,
): TypographyResonance | null {
  const target = buildVector(resonance);
  const fp = fingerprint(resonance);

  for (const cat of allowed) {
    const pool = TYPOGRAPHY.filter((t) => t.category === cat && !excludeIds.has(t.id));
    if (pool.length === 0) continue;

    // Rank by cosine, take top-N, then let the fingerprint choose among
    // them. Top-N (~6) keeps the choice semantically appropriate while
    // breaking up the "everyone picks Garamond" collapse.
    const ranked = pool
      .map((t) => ({ font: t, sim: cosineSimilarity(target, buildVector(t.resonance)) }))
      .sort((a, b) => b.sim - a.sim);

    const topN = ranked.slice(0, Math.min(6, ranked.length));
    if (topN.length > 0) {
      const idx = fp % topN.length;
      return topN[idx].font;
    }
  }

  return TYPOGRAPHY.find((t) => !excludeIds.has(t.id)) ?? null;
}

export function deriveTypeSet(
  resonance: ResonanceAxes,
  emotionId?: string,
  ctx?: import("@/types/claims").ReadContext,
): EmotionTypeSet {
  // If a lens is active AND it materially shifts the emotion's resonance,
  // bypass the unique global assignment and re-derive from the live
  // resonance via the band picker. Otherwise the canonical assignment
  // wins (guaranteeing each canonical emotion has a unique typeset).
  if (emotionId) {
    let useAssigned = true;
    if (ctx?.lens) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { lensShiftsResonance, liveResonance } = require("@/data/ontology/emotions-claims") as
        typeof import("@/data/ontology/emotions-claims");
      if (lensShiftsResonance(emotionId, ctx)) {
        useAssigned = false;
        resonance = liveResonance(emotionId, ctx);
      }
    }
    if (useAssigned) {
      const assigned = emotionTypeSet(emotionId);
      if (assigned.display && assigned.body) return assigned;
    }
  }
  const used = new Set<string>();

  const display = pickBestInCategories(resonance, displayCategoryFor(resonance), used);
  if (display) used.add(display.id);

  const body = pickBestInCategories(resonance, bodyCategoryFor(resonance), used);
  if (body) used.add(body.id);

  const literary = pickBestInCategories(resonance, literaryCategoryFor(resonance), used);
  if (literary) used.add(literary.id);

  const technical = pickBestInCategories(resonance, technicalCategoryFor(resonance), used);

  return { display, body, literary, technical };
}

export function typeSetToCssVars(set: EmotionTypeSet): Record<string, string> {
  const vars: Record<string, string> = {};
  if (set.display) {
    vars["--font-display"] = `"${set.display.googleFontFamily}", "Cormorant Garamond", serif`;
  }
  if (set.body) {
    vars["--font-body"] = `"${set.body.googleFontFamily}", Georgia, serif`;
    vars["--font-editorial"] = `"${set.body.googleFontFamily}", Georgia, serif`;
  }
  if (set.literary) {
    vars["--font-literary"] = `"${set.literary.googleFontFamily}", Georgia, serif`;
  }
  if (set.technical) {
    vars["--font-technical"] = `"${set.technical.googleFontFamily}", "JetBrains Mono", monospace`;
  }
  return vars;
}
