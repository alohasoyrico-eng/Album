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
 * Build a Google Fonts CSS API URL for a list of family names. Stable
 * sort so equal inputs produce equal URLs (cache friendliness).
 *
 * `display` strategy:
 *   - "swap"     — text shows in fallback, then re-renders when the
 *                  custom font arrives (FOUT). Use sparingly — only
 *                  where the typographic identity matters visually.
 *   - "optional" — browser gives the font ~100 ms; if it isn't ready,
 *                  the fallback is used for the whole page load and
 *                  NEVER swaps. On subsequent visits the font is in
 *                  cache and shows reliably. No layout shift, no
 *                  mid-paint twitch. Right for body / supporting text.
 */
export function buildFontStylesheetUrl(
  families: string[],
  display: "swap" | "optional" | "block" | "fallback" = "swap",
): string | null {
  const uniq = Array.from(new Set(families.filter(Boolean))).sort();
  if (uniq.length === 0) return null;
  const params = uniq.map((f) => `family=${f.replace(/\s+/g, "+")}`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=${display}`;
}

/**
 * Build two stylesheet URLs for the emergent typeset:
 *   - `primary`     — display (title) font on `display=swap`. The page
 *                     title is the most visible expression of "this
 *                     emotion's typeface". Worth one FOUT so visitors
 *                     see Marina's choice on first paint.
 *   - `supporting`  — body / literary / technical on `display=optional`.
 *                     These are running text; mid-paint font swaps here
 *                     read as jank. With "optional" the page sticks
 *                     with the fallback if the woff2 doesn't arrive in
 *                     ~100 ms, and gains the custom font on subsequent
 *                     visits (browser cache).
 */
export function buildTypeSetUrls(set: {
  display?: TypographyResonance | null;
  body?: TypographyResonance | null;
  literary?: TypographyResonance | null;
  technical?: TypographyResonance | null;
}): { primary: string | null; supporting: string | null } {
  const primary = set.display
    ? buildFontStylesheetUrl([set.display.googleFontFamily], "swap")
    : null;
  const supporting: string[] = [];
  if (set.body)      supporting.push(set.body.googleFontFamily);
  if (set.literary)  supporting.push(set.literary.googleFontFamily);
  if (set.technical) supporting.push(set.technical.googleFontFamily);
  return {
    primary,
    supporting: buildFontStylesheetUrl(supporting, "optional"),
  };
}

/**
 * @deprecated Prefer `buildTypeSetUrls` (splits swap vs. optional).
 * Kept so existing pages compile until each one migrates.
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
  return buildFontStylesheetUrl(families, "swap");
}
