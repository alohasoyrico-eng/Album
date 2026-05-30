"use client";

/**
 * CulturalImage — a thin wrapper around next/image with a graceful
 * fallback for broken cultural source URLs.
 *
 * Why this exists
 * ────────────────
 * The editorial pages reference ~370 images from 4 external hosts:
 *   - images.metmuseum.org  → ~297, all work
 *   - upload.wikimedia.org  →  ~57, 400 (UA/Referer policy)
 *   - www.artic.edu/iiif    →  ~25, 403 (hotlink protection)
 *   - image.tmdb.org        →  ~16, 404 (expired ids)
 *
 * Two wins by routing every image through next/image:
 *   1. Vercel's image proxy fetches the source from its own IP — no
 *      browser-side Referer / UA policies kick in. That recovers
 *      most ARTIC / Wikimedia / TMDB images.
 *   2. Automatic responsive `srcSet` + WebP/AVIF. Mobile devices
 *      download images sized for ~400 px instead of the full 800-1200
 *      px source, which cuts payload ~5×.
 *
 * When a fetch genuinely fails (host is down, or the image was deleted),
 * the component renders an iconographic block: a soft gradient in the
 * page's accent colour with the Material Symbols glyph for the
 * discipline. The composition stays intact and the page leans into the
 * project's color + typography + iconography identity instead of
 * showing a torn icon.
 */

import { useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

/** Discipline → Material Symbols glyph used by the fallback tile. */
const KIND_GLYPH: Record<string, string> = {
  artwork:      "palette",
  film:         "movie",
  music:        "music_note",
  poem:         "menu_book",
  sculpture:    "diamond",
  dance:        "directions_run",
  architecture: "domain",
  photography:  "photo_camera",
  literature:   "auto_stories",
  ritual:       "local_fire_department",
  theater:      "theater_comedy",
  generic:      "image",
};

type Kind = keyof typeof KIND_GLYPH | string;

interface CommonProps {
  // Accept undefined / empty so callers can pass through optional
  // `imageUrl` fields directly. When src is falsy we render the
  // FallbackTile straight away, skipping the failed next/image fetch.
  src?: string;
  alt: string;
  /** Discipline name for the fallback icon. */
  kind?: Kind;
  /** Accent color (hex) painted as a gradient when the image fails. */
  accentColor?: string;
  /** Pass-through className. */
  className?: string;
  /** Pass-through style. */
  style?: CSSProperties;
  /** next/image sizes hint. Important for responsive payload — set
   *  this to whatever the rendered width is at each breakpoint. */
  sizes?: string;
}

interface FillProps extends CommonProps {
  /** Use fill layout — parent must be `position: relative` + have a
   *  fixed height. The image stretches to its parent. */
  fill: true;
  width?: never;
  height?: never;
}

interface SizedProps extends CommonProps {
  fill?: false;
  width: number;
  height: number;
}

type Props = FillProps | SizedProps;

export function CulturalImage(props: Props) {
  const {
    src,
    alt,
    kind = "generic",
    accentColor = "#888",
    className,
    style,
    sizes,
  } = props;
  const [failed, setFailed] = useState(false);
  // Treat missing/empty src the same as a failed load — render the
  // iconographic fallback directly. The diversity-expansion entries
  // ship without imageUrl for many disciplines, so this short-circuit
  // is the hot path for them.
  const noSrc = !src;

  if (failed || noSrc) {
    // CRITICAL: when `fill` is set, the next/image element had
    // `position:absolute; inset:0` so it filled the parent (which had
    // `position:relative` + an explicit height). The fallback div
    // doesn't get those absolute styles by default, so without this
    // branch it would collapse to 0 px and the user would see nothing
    // — which was the bug behind "todas las imágenes están rotas".
    if (props.fill) {
      return (
        <FallbackTile
          kind={kind}
          accentColor={accentColor}
          className={className}
          style={{ position: "absolute", inset: 0, ...style }}
          alt={alt}
        />
      );
    }
    return (
      <FallbackTile
        kind={kind}
        accentColor={accentColor}
        className={className}
        // For sized variants the className already carries the explicit
        // w-/h- dimensions, so no positioning override is needed.
        style={style}
        alt={alt}
      />
    );
  }

  // After the `noSrc` early return src is guaranteed truthy; assert
  // it for next/image's strict signature.
  const commonImgProps = {
    src: src as string,
    alt,
    className,
    style,
    sizes,
    onError: () => setFailed(true),
    // Vercel's optimiser handles the proxy fetch + WebP/AVIF + srcSet.
    // Quality 75 is the sweet spot for editorial photography.
    quality: 75,
  };

  if (props.fill) {
    return <Image {...commonImgProps} fill />;
  }
  return <Image {...commonImgProps} width={props.width} height={props.height} />;
}

// ─── Fallback tile ─────────────────────────────────────────────────

function FallbackTile({
  kind,
  accentColor,
  className,
  style,
  alt,
}: {
  kind: Kind;
  accentColor: string;
  className?: string;
  style?: CSSProperties;
  alt: string;
}) {
  const glyph = KIND_GLYPH[kind] ?? KIND_GLYPH.generic;
  // A two-stop gradient + the discipline glyph. Keeps the layout
  // (parent already controls dimensions via className/style) and
  // signals "image unavailable" without showing a torn-image icon.
  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        ...style,
        background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}12 60%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        className="icon"
        style={{
          color: accentColor,
          opacity: 0.55,
          fontSize: "1.5em",
        }}
        aria-hidden
      >
        {glyph}
      </span>
    </div>
  );
}
