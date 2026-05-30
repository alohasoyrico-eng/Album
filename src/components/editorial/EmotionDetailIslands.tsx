"use client";

/**
 * Small interactive islands consumed by the (server-rendered)
 * EmotionDetail. Each one carries the smallest possible client surface
 * for one specific behavior; together they replace the giant
 * `"use client"` monolith that used to wrap the entire page.
 *
 * Hydration cost is roughly proportional to the size of the client
 * component tree. Pinning the islands to ~10-20 lines each (instead of
 * 1100) is what makes the page feel fast: the browser parses the HTML,
 * paints it, and only then commits a few tiny React subtrees to make
 * the participation / lens / save-to-collection bits interactive.
 */

import { useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { AccentButton } from "@/components/ui/AccentButton";
import { trackEvent } from "@/lib/analytics";
import { useCollectionsStore } from "@/lib/store";
import { resolveEmotion } from "@/data/ontology/emotions-claims";
import { useReadContext } from "@/lib/ReadContextProvider";
import {
  hydrateClaims,
  subscribeToEntity,
  useClaimsVersion,
} from "@/lib/participation";

// ─── Bootstrap effects ──────────────────────────────────────────────
// Fires analytics + participation hydration + realtime subscription on
// mount. Renders nothing — it's just a hook holder so the surrounding
// JSX can stay as static server-rendered HTML.

interface BootstrapProps {
  emotionId: string;
  tribeId: string;
}

export function EmotionPageBootstrap({ emotionId, tribeId }: BootstrapProps) {
  useEffect(() => {
    trackEvent("editorial_page_opened", { emotionId, tribe: tribeId });
  }, [emotionId, tribeId]);

  useEffect(() => {
    let cancelled = false;
    void hydrateClaims("emotion", emotionId).then((n) => {
      if (cancelled) return;
      void n;
    });
    const unsub = subscribeToEntity("emotion", emotionId);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [emotionId]);

  return null;
}

// ─── Lens-driven live text ─────────────────────────────────────────
// Reads the active lens from context and swaps a single field's value
// (description / poeticIntro / etymology / name / ...) at runtime.
// Three of these on the page = three subscribers, but each is a
// stateless function over the cached resolveEmotion → effectively a
// hashmap lookup. Cheap.

type EmotionLensField =
  | "description"
  | "poeticIntro"
  | "etymology"
  | "name";

interface LensTextProps {
  emotionId: string;
  field: EmotionLensField;
  /** Canonical value rendered when no lens is active (or no overlay
   *  exists for this emotion). Also the SSR fallback. */
  fallback: string;
  /** The HTML element to render. Defaults to <p>. */
  as?: "p" | "span" | "h1" | "h2";
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function EmotionLensText({
  emotionId,
  field,
  fallback,
  as: Tag = "p",
  className,
  style,
  title,
}: LensTextProps) {
  const { lens } = useReadContext();
  const claimsVersion = useClaimsVersion();
  const resolved = useMemo(
    () => resolveEmotion(emotionId, { lens }),
    // claimsVersion bumps when remote claims merge in; including it
    // forces re-read without React thinking the handle changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emotionId, lens, claimsVersion],
  );
  const value = resolved?.[field] ?? fallback;
  return (
    <Tag className={className} style={style} title={title}>
      {value}
    </Tag>
  );
}

// ─── Save-to-collection button ─────────────────────────────────────
// Tiny island for the only piece of the page that mutates client
// state. The button text + styling come from the server-rendered
// parent via props, so the island stays minimal.

interface SaveButtonProps {
  emotionId: string;
  accent: string;
}

export function SaveCollectionButton({ emotionId, accent }: SaveButtonProps) {
  const { saveEmotion } = useCollectionsStore();
  // Primary action — solid accent fill, WCAG-picked ink. The accent
  // doubles as the page's identity colour, so the CTA reads as "this
  // is THE thing to do on this page" without the old tinted-button
  // ambiguity.
  return (
    <AccentButton
      onClick={() => saveEmotion(emotionId)}
      variant="primary"
      accent={accent}
      leadingIcon="bookmark_add"
      size="md"
    >
      Guardar en colección
    </AccentButton>
  );
}
