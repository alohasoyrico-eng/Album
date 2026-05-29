/**
 * Per-page Google Fonts loader.
 *
 * Each emotion / clan / tribe / colour page emits one <link rel="stylesheet">
 * that loads ONLY the 4 fonts its typeset assigns. This is what lets the
 * catalogue scale from 80 to 5,000 fonts without changing the per-page cost
 * for users.
 *
 * The Google Fonts CSS API edge-caches each unique URL, so navigating
 * between pages reuses cached responses. The browser caches each WOFF2
 * by file URL, so shared fonts across pages download only once.
 */

import type { TypographyResonance } from "@/types";

export interface FontFamilyLink {
  family: string;
  /** Encoded family token for the CSS API. */
  token: string;
}

/**
 * Build the Google Fonts CSS API URL for a list of family names. Stable
 * sort so equal inputs produce equal URLs (cache friendliness).
 */
export function buildFontStylesheetUrl(families: string[]): string | null {
  const uniq = Array.from(new Set(families.filter(Boolean))).sort();
  if (uniq.length === 0) return null;
  const params = uniq.map((f) => `family=${f.replace(/\s+/g, "+")}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Convenience: pass the four emergent typeset fonts and get the URL +
 * the family strings (for fontFamily inline styles).
 */
export function buildTypeSetUrl(set: {
  display?: TypographyResonance | null;
  body?: TypographyResonance | null;
  literary?: TypographyResonance | null;
  technical?: TypographyResonance | null;
}): string | null {
  const families: string[] = [];
  if (set.display)   families.push(set.display.googleFontFamily);
  if (set.body)      families.push(set.body.googleFontFamily);
  if (set.literary)  families.push(set.literary.googleFontFamily);
  if (set.technical) families.push(set.technical.googleFontFamily);
  return buildFontStylesheetUrl(families);
}
