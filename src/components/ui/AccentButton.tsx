/**
 * AccentButton — primary / secondary actions, color used as affordance.
 *
 * The previous pattern wrote coloured TEXT on a tinted background
 * (`color: accent, backgroundColor: accent + "22"`). That signals
 * "interactive" by repeating the accent on both layers, but in
 * practice the text rides on top of a colour that's only 13 % opaque
 * — i.e. it sits on the page background with a vague tint, which is
 * roughly the worst possible contrast surface.
 *
 * Here the colour does the affordance job differently:
 *   - `primary`   — accent fills the button (solid), ink is auto-
 *                   picked WCAG-safe. Reads at a glance, contrast
 *                   guaranteed. Use for the page's main CTA.
 *   - `secondary` — neutral background, accent on the border, ink
 *                   neutral. The colour registers without competing
 *                   with the label. Use for adjacent / counter actions.
 *   - `quiet`     — text-only with a hover lift. No colour at all.
 *                   Use for "cancel" / "back" affordances that should
 *                   stay out of the way.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { pickInkFor } from "@/lib/contrast";

type Variant = "primary" | "secondary" | "quiet";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  children: ReactNode;
  variant?: Variant;
  accent?: string;
  /** sm = compact pill (h≈36), md = full pill (h≈44 → iOS tap target). */
  size?: "sm" | "md";
  leadingIcon?: string;
  trailingIcon?: string;
}

const SIZE: Record<"sm" | "md", string> = {
  sm: "text-xs px-4 py-2 gap-2 min-h-[36px]",
  md: "text-sm px-5 py-2.5 gap-2 min-h-[44px]",
};

export function AccentButton({
  children,
  variant = "secondary",
  accent,
  size = "md",
  leadingIcon,
  trailingIcon,
  className = "",
  style,
  ...rest
}: Props) {
  const ink = accent ? pickInkFor(accent) : null;
  const variantStyle: React.CSSProperties = (() => {
    switch (variant) {
      case "primary":
        return accent && ink
          ? {
              backgroundColor: accent,
              color: ink.ink,
              border: "1px solid transparent",
            }
          : {};
      case "secondary":
        return {
          backgroundColor: "transparent",
          color: "var(--album-ink)",
          border: `1.5px solid ${accent ?? "var(--album-border)"}`,
        };
      case "quiet":
        return {
          backgroundColor: "transparent",
          color: "var(--album-ink-muted)",
          border: "1px solid transparent",
        };
    }
  })();

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${SIZE[size]} ${className}`}
      style={{
        fontFamily: "var(--font-technical)",
        letterSpacing: "0.08em",
        ...variantStyle,
        ...style,
      }}
    >
      {leadingIcon && <span className="icon icon-sm" aria-hidden>{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span className="icon icon-sm" aria-hidden>{trailingIcon}</span>}
    </button>
  );
}
