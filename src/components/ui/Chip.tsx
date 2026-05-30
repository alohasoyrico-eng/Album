/**
 * Chip — the single source of truth for tag-shaped UI in Álbum.
 *
 * Why this exists
 * ────────────────
 * Earlier code rendered chips as inline-styled `<span>` / `<Link>` blocks
 * that mixed accent colour into both background AND text:
 *
 *     style={{
 *       backgroundColor: `${tribeColor}15`,  // 8% tint, near-invisible
 *       color: tribeColor,                   // accent text on a tinted bg
 *       border: `1px solid ${tribeColor}30`,
 *     }}
 *
 * That pattern fails legibility in two ways:
 *   1. A 8-15 % alpha tint of the accent ≠ a usable background. The
 *      contrast against the ink colour is whatever the accent happens
 *      to be — sometimes WCAG AA, often not.
 *   2. Coloured text on a tinted background is the worst case for low-
 *      vision and high-glare reading.
 *
 * The principle we apply here:
 *   - Colour belongs to identity (page atmosphere) and to data
 *     visualisation (resonance profile, palette). It does *not* belong
 *     to running text.
 *   - When a chip needs to carry colour identity, it does so with a
 *     SOLID background and an auto-picked WCAG-safe ink — never with a
 *     coloured text on a tint.
 *   - When a chip is decorative (a category label, a count), it stays
 *     in the neutral ink scale and lets the surrounding atmosphere
 *     carry the colour.
 *
 * Variants
 * ────────
 *   solid    — accent fills the chip; ink is WCAG-picked. Use for
 *              identity badges (tribe + clan in the header) or for the
 *              one "primary" tag in a row.
 *   outline  — accent on the border only; ink is neutral. Use when the
 *              chip is informational, links somewhere, and you want
 *              the accent to register without dominating.
 *   ghost    — no accent at all. Pure neutral text + subtle border.
 *              Use for counts, low-emphasis metadata.
 */

import Link from "next/link";
import type { ReactNode, CSSProperties } from "react";
import { pickInkFor } from "@/lib/contrast";

type Variant = "solid" | "outline" | "ghost";

interface BaseProps {
  children: ReactNode;
  /** Required for solid + outline variants; ignored by ghost. */
  accent?: string;
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  title?: string;
  size?: "sm" | "md";
}

interface LinkProps extends BaseProps {
  href: string;
  onClick?: never;
}
interface ButtonProps extends BaseProps {
  href?: never;
  onClick?: () => void;
}
type Props = LinkProps | ButtonProps;

const SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
};

function variantStyle(variant: Variant, accent: string | undefined): CSSProperties {
  switch (variant) {
    case "solid": {
      if (!accent) return {};
      const ink = pickInkFor(accent);
      return {
        backgroundColor: accent,
        color: ink.ink,
        border: "1px solid transparent",
      };
    }
    case "outline":
      return {
        backgroundColor: "transparent",
        // Neutral ink — colour stays on the border so the text reads
        // crisp regardless of the accent's lightness.
        color: "var(--album-ink)",
        border: `1.5px solid ${accent ?? "var(--album-border)"}`,
      };
    case "ghost":
      return {
        backgroundColor: "transparent",
        color: "var(--album-ink-muted)",
        border: "1px solid var(--album-border)",
      };
  }
}

export function Chip(props: Props) {
  const { children, accent, variant = "outline", className = "", style, title, size = "sm" } = props;
  const baseClasses = `inline-flex items-center rounded-full transition-all duration-200 ${SIZE_CLASSES[size]} ${className}`;
  const computedStyle: CSSProperties = {
    fontFamily: "var(--font-technical)",
    letterSpacing: "0.08em",
    lineHeight: 1.2,
    ...variantStyle(variant, accent),
    ...style,
  };

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        className={`${baseClasses} hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2`}
        style={computedStyle}
        title={title}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`${baseClasses} hover:scale-[1.02]`}
      style={computedStyle}
      title={title}
    >
      {children}
    </button>
  );
}
