/**
 * EmotionalAtmosphere — pure-CSS ambient layer behind the editorial pages.
 *
 * What it does
 * ─────────────
 * Renders a single fixed full-viewport `<div>` with a two-stop radial
 * gradient in the emotion's colour. A slow opacity-only "breath" pulses
 * the gradient subtly, tied to the emotion's `breathPeriod` via a CSS
 * custom property.
 *
 * Why the rewrite
 * ────────────────
 * The previous implementation was a `"use client"` component running a
 * `transform: scale + translate3d` + `filter: brightness saturate`
 * animation forever. Transform and filter forces full compositor passes
 * on every keyframe — on phones, while scrolling, the GPU was already
 * busy compositing the page and adding atmosphere passes on top is
 * what made the editorial routes feel slow.
 *
 * Now:
 *   - Pure RSC (no `"use client"`, no hydration cost).
 *   - Opacity-only animation. Browsers composite opacity for free.
 *   - No `useEffect` setting CSS properties; the breath period flows
 *     through `style={{ "--em-breath-period": ... }}` straight from
 *     the server payload.
 *   - Animation is guarded by `prefers-reduced-motion: no-preference`,
 *     so visitors who opt out get the gradient frozen at full opacity.
 */

import type { EmotionBehavior } from "@/lib/behavior";
import type { CSSProperties } from "react";

interface EmotionalAtmosphereProps {
  /** The emotion's derived color signature — the recipe result. */
  color: string;
  /** Behavior profile that drives breath rhythm + intensity. */
  behavior: EmotionBehavior;
  /** Optional secondary color for layered drift (usually tribal). */
  secondaryColor?: string;
}

export function EmotionalAtmosphere({ color, behavior, secondaryColor }: EmotionalAtmosphereProps) {
  const intensityHex = Math.round(behavior.atmosphereIntensity * 255).toString(16).padStart(2, "0");
  const secondaryHex = Math.round(behavior.atmosphereIntensity * 0.6 * 255).toString(16).padStart(2, "0");
  const style: CSSProperties = {
    background: `
      radial-gradient(ellipse at 35% 18%, ${color}${intensityHex} 0%, transparent 55%),
      radial-gradient(ellipse at 80% 80%, ${(secondaryColor ?? color)}${secondaryHex} 0%, transparent 60%)
    `,
    // Custom prop typed as string to satisfy TS' CSSProperties.
    ["--em-breath-period" as string]: `${behavior.breathPeriod}s`,
  };
  return (
    <div
      aria-hidden
      className="em-atmosphere pointer-events-none fixed inset-0 z-0"
      style={style}
    />
  );
}
