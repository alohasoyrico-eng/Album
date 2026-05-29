"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Intersection-based "emerge" hook. A section attaches the returned ref;
 * once it enters the viewport (with a generous margin) it sets `isVisible`
 * to true and stays true thereafter (we don't want sections to fade back
 * out on scroll — that's hostile).
 *
 * Combine with the `.em-emerge.is-visible` CSS pair: the element starts
 * translated/transparent, then snaps to its rest state with the emotion's
 * easing curve and fade duration.
 */
export function useEmerge<T extends HTMLElement = HTMLDivElement>(
  options: { rootMargin?: string; threshold?: number } = {},
): { ref: React.RefObject<T | null>; isVisible: boolean } {
  const ref = useRef<T | null>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin ?? "0px 0px -10% 0px",
        threshold: options.threshold ?? 0.05,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, options.rootMargin, options.threshold]);

  return { ref, isVisible };
}
