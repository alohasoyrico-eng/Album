"use client";

import { useEffect, useRef } from "react";
import type { EmotionBehavior } from "@/lib/behavior";

interface EmotionalAtmosphereProps {
  /** The emotion's derived color signature — the recipe result. */
  color: string;
  /** Behavior profile that drives motion/intensity. */
  behavior: EmotionBehavior;
  /** Optional secondary color for layered drift (usually tribal). */
  secondaryColor?: string;
}

/**
 * A fixed full-viewport layer that emanates from the emotion's color and
 * breathes at the rhythm derived from its resonance. Sits behind all editorial
 * content. Combines:
 *
 *   - a slow-drifting radial wash (the emotional fog)
 *   - a faint secondary tint at the opposite corner
 *   - a soft breathing scale animation tied to the emotion's breath period
 *
 * The visual is deliberately ambient — never narrative. Just enough to make
 * the user feel that the room they entered has the temperature of this
 * emotion.
 */
export function EmotionalAtmosphere({ color, behavior, secondaryColor }: EmotionalAtmosphereProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync CSS animation duration via inline style so it reacts to behavior changes
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.setProperty("--em-breath-period", `${behavior.breathPeriod}s`);
    ref.current.style.setProperty("--em-atmosphere-intensity", String(behavior.atmosphereIntensity));
  }, [behavior.breathPeriod, behavior.atmosphereIntensity]);

  const intensityHex = Math.round(behavior.atmosphereIntensity * 255).toString(16).padStart(2, "0");
  const secondaryHex = Math.round(behavior.atmosphereIntensity * 0.6 * 255).toString(16).padStart(2, "0");

  return (
    <div
      ref={ref}
      aria-hidden
      className="emotional-atmosphere pointer-events-none fixed inset-0 z-0"
      style={{
        background: `
          radial-gradient(ellipse at 35% 18%, ${color}${intensityHex} 0%, transparent 55%),
          radial-gradient(ellipse at 80% 80%, ${(secondaryColor ?? color)}${secondaryHex} 0%, transparent 60%)
        `,
        animation: `emotional-breathe var(--em-breath-period, 7s) ease-in-out infinite`,
      }}
    >
      <style>{`
        @keyframes emotional-breathe {
          0%, 100% {
            transform: scale(1) translate3d(0, 0, 0);
            filter: brightness(1) saturate(1);
          }
          50% {
            transform: scale(1.04) translate3d(8px, -6px, 0);
            filter: brightness(1.06) saturate(1.05);
          }
        }
      `}</style>
    </div>
  );
}
