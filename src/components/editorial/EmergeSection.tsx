"use client";

import { useEmerge } from "@/lib/useEmerge";
import clsx from "clsx";

interface EmergeSectionProps {
  /** Stagger index — multiplied by the emotion's revealDelay. */
  index?: number;
  /** Total delay (ms) applied as transition-delay. Overrides index if set. */
  delayMs?: number;
  /** Tailwind classes for the wrapper. */
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article" | "aside";
}

/**
 * A section that fades up on scroll using the host emotion's behavior CSS
 * variables. The transition curve and duration are inherited from the
 * EmotionDetail root via `--em-fade-duration` and `--em-ease`.
 *
 * For anxious emotions, the parent root sets `--em-reveal-jitter` so we
 * compose a deterministic jitter into the delay (handled at the call site).
 */
export function EmergeSection({
  index = 0,
  delayMs,
  className,
  children,
  as: Tag = "section",
}: EmergeSectionProps) {
  const { ref, isVisible } = useEmerge<HTMLDivElement>();

  const delay = delayMs ?? `calc(var(--em-reveal-delay, 60ms) * ${index})`;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={clsx("em-emerge", isVisible && "is-visible", className)}
      style={{ transitionDelay: typeof delay === "string" ? delay : `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
