"use client";

import { useState } from "react";
import clsx from "clsx";

interface YouTubeEmbedProps {
  youtubeId: string;
  title: string;
  variant?: "audio" | "video";
  posterUrl?: string;
  className?: string;
}

export function YouTubeEmbed({ youtubeId, title, variant = "video", posterUrl, className }: YouTubeEmbedProps) {
  const [activated, setActivated] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumb = posterUrl ?? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

  if (activated) {
    if (thumbFailed) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
      return (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-deep via-surface to-raised text-xs text-ink-muted hover:text-amber transition-colors",
            variant === "video" ? "aspect-video" : "aspect-[16/3]",
            className
          )}
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
        >
          BUSCAR EN YOUTUBE →
        </a>
      );
    }
    return (
      <div className={clsx("relative w-full overflow-hidden rounded-lg bg-black", variant === "video" ? "aspect-video" : "aspect-[16/3]", className)}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerated-sensors; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={`Play ${title}`}
      className={clsx(
        "group relative w-full overflow-hidden rounded-lg bg-black/40 transition-all duration-300 hover:ring-1 hover:ring-amber/40",
        variant === "video" ? "aspect-video" : "aspect-[16/3]",
        className
      )}
    >
      {!thumbFailed ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          onError={() => setThumbFailed(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-90"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-deep via-surface to-raised" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {thumbFailed && (
        <div className="absolute inset-x-0 bottom-3 text-center text-[10px] text-ink-faint" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
          VER EN YOUTUBE
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/40 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-amber/60 group-hover:bg-amber/10">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-white/90 group-hover:fill-amber" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
