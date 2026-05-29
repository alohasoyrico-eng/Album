/**
 * Emotional behavior system.
 *
 * Each emotion's resonance produces a BEHAVIOR PROFILE that the interface
 * uses to perform — not describe — the emotion. The page itself becomes
 * tender, or anxious, or melancholic, or enraged.
 *
 * The mapping from axes to behavior:
 *
 *   - energy        → reveal speed, motion velocity, pulse frequency
 *   - tension       → micro-jitter, hover instability, easing harshness
 *   - density       → spacing compression, ambient mass
 *   - movement      → drift speed, breathing rhythm
 *   - temporality   → reveal slowness, trail persistence (the past lingers)
 *   - humanity      → softness of transitions, warmth of glow
 *   - intimacy      → spacing generosity, hover lift, gravitational pull
 *   - control       → easing predictability (low control → interrupted curves)
 *   - clarity       → atmospheric haze (low clarity → blurred periphery)
 *   - temperature   → glow chromatic warmth bias (handled in chromatics)
 */

import type { ResonanceAxes } from "@/types";

export interface EmotionBehavior {
  // ─── Temporal pacing ──────────────────────────────────────────────────
  /** Base ms between sequenced reveals. Low energy + high temporality slow this. */
  revealDelay: number;
  /** ms of randomness on top of revealDelay. Anxious emotions add jitter to the timing itself. */
  revealJitter: number;
  /** ms the section takes to fade in once triggered. */
  fadeDuration: number;
  /** ms a section lingers in fade-out (melancholy persists; rage snaps away). */
  trailDuration: number;
  /** cubic-bezier curve as 4 numbers. Tender = smooth, anxious = sharp, melancholic = slow-slow-slow. */
  ease: [number, number, number, number];

  // ─── Spatial composition ──────────────────────────────────────────────
  /** Scale factor applied to section gaps (1 = neutral). Intimate emotions expand; dense ones compress. */
  sectionGapScale: number;
  /** Px hover lift on cards (tenderness rises gently; rage stays put). */
  hoverLift: number;

  // ─── Atmospheric layer ────────────────────────────────────────────────
  /** 0..1 — how strongly the emotion's color washes the page. */
  atmosphereIntensity: number;
  /** s — period of the breathing background animation. Low energy = slow breath. */
  breathPeriod: number;
  /** Px — backdrop-filter blur on peripheral content (low clarity = more haze). */
  peripheryBlur: number;
  /** Px — ambient halo radius around accent elements. Humanity/intimacy boost this. */
  glowRadius: number;

  // ─── Micro-motion ─────────────────────────────────────────────────────
  /** Px amplitude of subtle jitter applied to titles/labels in tense emotions. */
  jitterAmplitude: number;
  /** Hz — frequency of subtle pulse on rhythmic elements (music section, etc.). */
  pulseFreq: number;

  // ─── Cognitive tone ───────────────────────────────────────────────────
  /** A short keyword the page can use as a label/hint (e.g. "íntimo", "tenso", "suspendido"). */
  temperament: string;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

/**
 * Derive a behavior profile from a 10-axis resonance.
 *
 * The mappings are intentionally bold — anxiety should *feel* visibly different
 * from tenderness or melancholy. Subtle, but visible.
 */
export function deriveBehavior(r: ResonanceAxes): EmotionBehavior {
  const energy        = r.energy / 100;
  const tension       = r.tension / 100;
  const density       = r.density / 100;
  const movement      = r.movement / 100;
  const temporality   = r.temporality / 100;
  const humanity      = r.humanity / 100;
  const intimacy      = r.intimacy / 100;
  const control       = r.control / 100;
  const clarity       = r.clarity / 100;

  // Composite axes useful for behavior derivation
  const slowness     = clamp01((1 - energy) * 0.55 + temporality * 0.45);
  const nervousness  = clamp01(tension * 0.6 + (1 - control) * 0.4);
  const warmth       = clamp01(humanity * 0.5 + intimacy * 0.5);
  const compactness  = clamp01(density);
  const intimateness = clamp01(intimacy);

  // Temporal pacing
  const revealDelay   = 80 + slowness * 360 - nervousness * 60;
  const revealJitter  = nervousness * 220;
  const fadeDuration  = 500 + slowness * 900;
  const trailDuration = 200 + slowness * 1400;

  // Easing curve — three distinct curve families based on dominant axis
  let ease: [number, number, number, number];
  if (nervousness > 0.65) {
    // Sharp, interrupted (anxiety, anger, fear)
    ease = [0.85, 0, 0.4, 1];
  } else if (slowness > 0.65) {
    // Slow-slow (melancholy, nostalgia, soledad)
    ease = [0.45, 0, 0.35, 1];
  } else if (warmth > 0.7) {
    // Soft, gentle (tenderness, gratitud, compassion)
    ease = [0.16, 1, 0.3, 1];
  } else {
    // Default contemplative
    ease = [0.22, 0.9, 0.3, 1];
  }

  // Spatial
  const sectionGapScale = 1 + intimateness * 0.4 - compactness * 0.18;
  const hoverLift       = 2 + warmth * 5;

  // Atmosphere
  const atmosphereIntensity = clamp01(0.16 + warmth * 0.12 + tension * 0.05);
  const breathPeriod        = 5 + slowness * 4 - movement * 1.5; // 3.5s..10s range
  const peripheryBlur       = (1 - clarity) * 5;
  const glowRadius          = warmth * 28 + tension * 6;

  // Micro-motion
  const jitterAmplitude = nervousness * 1.4;
  const pulseFreq       = 0.25 + movement * 0.8;

  // Temperament keyword (for editorial copy hooks)
  let temperament = "contemplativo";
  if (nervousness > 0.7) temperament = "vibrante";
  else if (slowness > 0.7) temperament = "suspendido";
  else if (warmth > 0.75) temperament = "íntimo";
  else if (density > 0.7) temperament = "denso";
  else if (movement > 0.7) temperament = "kinético";

  return {
    revealDelay,
    revealJitter,
    fadeDuration,
    trailDuration,
    ease,
    sectionGapScale,
    hoverLift,
    atmosphereIntensity,
    breathPeriod,
    peripheryBlur,
    glowRadius,
    jitterAmplitude,
    pulseFreq,
    temperament,
  };
}

/**
 * Build the CSS variable map that the EmotionDetail root can apply via inline
 * style. Children sections read these to inherit emotional pacing.
 */
export function behaviorCssVars(b: EmotionBehavior): React.CSSProperties {
  return {
    ["--em-reveal-delay" as string]:    `${b.revealDelay}ms`,
    ["--em-reveal-jitter" as string]:   `${b.revealJitter}ms`,
    ["--em-fade-duration" as string]:   `${b.fadeDuration}ms`,
    ["--em-trail-duration" as string]:  `${b.trailDuration}ms`,
    ["--em-ease" as string]:            `cubic-bezier(${b.ease.join(",")})`,
    ["--em-section-gap-scale" as string]: String(b.sectionGapScale),
    ["--em-hover-lift" as string]:      `${b.hoverLift}px`,
    ["--em-atmosphere-intensity" as string]: String(b.atmosphereIntensity),
    ["--em-breath-period" as string]:   `${b.breathPeriod}s`,
    ["--em-periphery-blur" as string]:  `${b.peripheryBlur}px`,
    ["--em-glow-radius" as string]:     `${b.glowRadius}px`,
    ["--em-jitter-amplitude" as string]: `${b.jitterAmplitude}px`,
    ["--em-pulse-freq" as string]:      String(b.pulseFreq),
  };
}

/**
 * Compute a per-index reveal delay with jitter — used to stagger sections.
 * Deterministic per index so the page is stable across renders.
 */
export function staggerDelay(b: EmotionBehavior, index: number): number {
  // Pseudo-random but deterministic
  const seed = ((index * 9301 + 49297) % 233280) / 233280;
  return b.revealDelay * index + (seed - 0.5) * b.revealJitter;
}
