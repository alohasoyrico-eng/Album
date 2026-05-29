/**
 * Contrast guarantee layer.
 *
 * Every dynamic-color surface (EmotionDetail, ClanView, TribeView,
 * ColorView, NodePreview...) passes through here before render so its
 * ink colours satisfy WCAG AA against whatever background the emergent
 * system produced. The texture/colour system stays expressive; ink
 * automatically adapts.
 *
 * APIs:
 *   relativeLuminance(hex)            — WCAG formula
 *   contrastRatio(fg, bg)             — symmetric (always ≥ 1)
 *   pickInkFor(bgHex)                 — { ink, inkMuted, inkFaint } guaranteed
 *   inkVars(bgHex)                    — CSS variables ready to spread on a node
 *   safeOverlayAlpha(bgHex, textHex, requested) — caps overlay opacity to
 *                                       preserve contrast against `bgHex`
 */

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Candidate inks — light pool (for dark backgrounds) and dark pool
// (for light backgrounds). Multiple variants per pool let us scale
// emphasis without breaking contrast.
const LIGHT_POOL = ["#FFFFFF", "#FBF8F2", "#F4F0E8", "#E8E2D4", "#D8CFBC"];
const DARK_POOL  = ["#050508", "#15131A", "#221E2A", "#3A3340", "#5C5260"];

export interface InkScheme {
  /** Highest-emphasis ink. WCAG AA ≥ 7:1 when possible, ≥ 4.5:1 always. */
  ink: string;
  /** Body / supportive emphasis. ≥ 4.5:1 target. */
  inkMuted: string;
  /** Captions, metadata. ≥ 3:1 target (UI elements). */
  inkFaint: string;
  /** Which pool was chosen — useful for downstream decisions. */
  scheme: "light-on-dark" | "dark-on-light";
}

function pickFromPool(pool: string[], bg: string, targetRatio: number): string {
  // Walk the pool in order; first colour that meets the target ratio wins.
  // Fall back to the most-contrasting of the pool if none satisfies.
  let best = pool[0];
  let bestRatio = contrastRatio(best, bg);
  for (const c of pool) {
    const r = contrastRatio(c, bg);
    if (r >= targetRatio) return c;
    if (r > bestRatio) { best = c; bestRatio = r; }
  }
  return best;
}

export function pickInkFor(bgHex: string): InkScheme {
  const bgLum = relativeLuminance(bgHex);
  // Below 0.45 we treat as dark (use light inks); above as light.
  const useLight = bgLum < 0.45;
  const pool = useLight ? LIGHT_POOL : DARK_POOL;

  return {
    ink: pickFromPool(pool, bgHex, 7),
    inkMuted: pickFromPool(pool, bgHex, 4.5),
    inkFaint: pickFromPool(pool, bgHex, 3.0),
    scheme: useLight ? "light-on-dark" : "dark-on-light",
  };
}

/**
 * Returns CSS variable overrides to spread on a container so all
 * descendants that use `var(--album-ink)` etc. automatically re-tint
 * with WCAG-safe colours for this background.
 */
function hexToRgbTriplet(hex: string): string {
  const { r, g, b } = parseHex(hex);
  return `${r} ${g} ${b}`;
}

export function inkVars(bgHex: string): Record<string, string> {
  const s = pickInkFor(bgHex);
  return {
    "--album-ink": s.ink,
    "--album-ink-muted": s.inkMuted,
    "--album-ink-faint": s.inkFaint,
    "--album-ink-scheme": s.scheme,
    // Tailwind's text-ink / text-ink-muted / text-ink-faint classes use
    // these RGB triplet variables. Override them too so every existing
    // `text-ink-*` className re-tints to the contrast-safe ink.
    "--album-ink-actual-rgb": hexToRgbTriplet(s.ink),
    "--album-ink-muted-rgb":  hexToRgbTriplet(s.inkMuted),
    "--album-ink-faint-rgb":  hexToRgbTriplet(s.inkFaint),
  } as Record<string, string>;
}

/**
 * Cap an overlay alpha so the resulting effective background still
 * preserves contrast with `textHex`. Used by the texture layer to
 * dramatically tint dark surfaces without ever pushing readable text
 * below 4.5:1.
 *
 *   requestedAlpha — 0..1, what the texture wanted
 *   returns         — 0..1, capped to safe value
 */
export function safeOverlayAlpha(bgHex: string, textHex: string, requestedAlpha: number): number {
  if (requestedAlpha <= 0) return 0;
  if (requestedAlpha >= 1) return 1;
  // Binary-search the alpha that keeps contrastRatio(textHex, blendedBg) ≥ 4.5
  const { r: br, g: bg, b: bb } = parseHex(bgHex);
  const { r: tr, g: tg, b: tb } = parseHex(textHex);

  function blend(a: number): string {
    const r = Math.round(br * (1 - a) + tr * a);
    const g = Math.round(bg * (1 - a) + tg * a);
    const b = Math.round(bb * (1 - a) + tb * a);
    const h = (v: number) => v.toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  }

  let lo = 0;
  let hi = requestedAlpha;
  let safe = 0;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const blended = blend(mid);
    if (contrastRatio(textHex, blended) >= 4.5) {
      safe = mid; lo = mid;
    } else {
      hi = mid;
    }
  }
  return safe;
}

/**
 * Mix two hexes by alpha (alpha=1 returns top, alpha=0 returns bottom).
 * Used to compute the effective background of a textured surface.
 */
export function blendHex(bottom: string, top: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const { r: br, g: bg, b: bb } = parseHex(bottom);
  const { r: tr, g: tg, b: tb } = parseHex(top);
  const r = Math.round(br * (1 - a) + tr * a);
  const g = Math.round(bg * (1 - a) + tg * a);
  const b = Math.round(bb * (1 - a) + tb * a);
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
