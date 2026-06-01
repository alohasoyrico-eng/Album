"use client";

/**
 * HomeClient — the interactive shell of the home page.
 *
 * Why this is split from `page.tsx`
 * ──────────────────────────────────
 * `page.tsx` needs to be a Server Component so it can import the
 * server-side `MAP_LAYOUT` (which runs the d3-force simulation at
 * build time). The hero's search trigger, the rotating chip, and
 * the SearchPalette all need browser state — those live here.
 *
 * The precomputed map layout is passed in as a serialisable prop and
 * forwarded to `<SemanticMap />`, which now skips its own simulation.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SemanticMap } from "@/components/map/SemanticMap";
import { MobileTribesGrid } from "@/components/map/MobileTribesGrid";
import { SearchPalette } from "@/components/ui/SearchPalette";
import { TRIBES } from "@/data/ontology/tribes";
import { EMOTIONS } from "@/data/ontology/emotions";
import { COLORS } from "@/data/colors/colorResonance";
import { detectReturnVisit, trackEvent } from "@/lib/analytics";
import type { MapLayoutPayload } from "@/lib/server/mapLayout";

interface RotatingSuggestion {
  label: string;
  href: string;
  accent: string;
}

interface Props {
  mapLayout: MapLayoutPayload;
}

export function HomeClient({ mapLayout }: Props) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const suggestions = useMemo<RotatingSuggestion[]>(() => {
    const tribeSuggestions: RotatingSuggestion[] = TRIBES.map((t) => ({
      label: t.name, href: `/tribe/${t.id}`, accent: t.color,
    }));
    const emotionSuggestions: RotatingSuggestion[] = EMOTIONS.slice(0, 24).map((e) => ({
      label: e.name,
      href: `/emotion/${e.id}`,
      accent: TRIBES.find((t) => t.id === e.tribe)?.color ?? "#C8935A",
    }));
    const colorSuggestions: RotatingSuggestion[] = COLORS.slice(0, 16).map((c) => ({
      label: c.nameEs, href: `/color/${c.id}`, accent: c.hex,
    }));
    const pool = [...tribeSuggestions, ...emotionSuggestions, ...colorSuggestions];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }, []);

  const [chipIdx, setChipIdx] = useState(0);

  useEffect(() => {
    detectReturnVisit();
    trackEvent("map_navigation_started", { entry: "home" });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setChipIdx((i) => (i + 1) % suggestions.length), 2400);
    return () => clearInterval(t);
  }, [suggestions.length]);

  const current = suggestions[chipIdx];
  function goCurrent() {
    if (!current) return;
    trackEvent("node_clicked", { nodeId: current.href, entry: "hero_chip_rotating" });
    router.push(current.href);
  }

  return (
    <div className="relative min-h-screen bg-atmospheric overflow-hidden">
      <div className="relative w-full hidden md:block" style={{ height: "100vh" }}>
        <SemanticMap layout={mapLayout} />
      </div>
      <div className="md:hidden">
        <MobileTribesGrid />
      </div>

      <div className="md:absolute top-0 left-0 right-0 z-20 flex flex-col items-center justify-center pt-28 pb-8 px-4 pointer-events-none">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(var(--album-bg-rgb,5,5,8) / 0.55) 0%, rgba(var(--album-bg-rgb,5,5,8) / 0.35) 40%, transparent 75%)",
          }}
        />
        <div className="relative flex flex-col items-center w-full max-w-2xl">
          <p
            className="text-xs tracking-[0.3em] uppercase text-ink mb-6"
            style={{ fontFamily: "var(--font-technical)", opacity: 0.85 }}
          >
            Observatorio cultural
          </p>
          <h1
            className="text-5xl md:text-7xl lg:text-8xl text-center text-ink leading-none mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            Álbum
          </h1>
          <p
            className="text-center max-w-2xl text-ink/90 text-xl md:text-2xl lg:text-3xl mb-9 leading-snug"
            style={{ fontFamily: "var(--font-literary)", fontStyle: "italic", fontWeight: 300 }}
          >
            Un atlas de lo que sentimos
          </p>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="pointer-events-auto flex items-center gap-4 w-full max-w-2xl px-6 py-5 md:py-6 rounded-full border-2 bg-[rgb(255_255_255_/_0.05)] hover:bg-[rgb(255_255_255_/_0.09)] transition-all"
            style={{
              borderColor: "rgb(var(--album-ink-muted-rgb) / 0.45)",
              fontFamily: "var(--font-editorial)",
            }}
            aria-label="Buscar en Álbum"
          >
            <span className="icon icon-lg text-ink" style={{ fontSize: "28px" }}>search</span>
            <span className="flex-1 text-left text-ink-muted text-base md:text-lg">
              Buscar emociones, colores, obras…
            </span>
            <span
              className="text-xs text-ink-muted px-2.5 py-1.5 rounded-md border"
              style={{
                borderColor: "rgb(var(--album-ink-muted-rgb) / 0.5)",
                fontFamily: "var(--font-technical)",
                letterSpacing: "0.12em",
              }}
            >
              ⌘K
            </span>
          </button>
          <div
            className="mt-7 pointer-events-auto flex items-center gap-4 text-base md:text-lg"
            style={{ fontFamily: "var(--font-editorial)" }}
          >
            <span
              className="text-ink-muted"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.12em", fontSize: "0.75rem" }}
            >
              NAVEGA...
            </span>
            <div className="relative h-12 flex items-center min-w-[220px]" aria-live="polite">
              {current && (
                <button
                  key={current.href}
                  type="button"
                  onClick={goCurrent}
                  className="absolute left-0 px-5 py-2.5 rounded-full border-2 hover:scale-105 active:scale-95 transition-transform whitespace-nowrap"
                  style={{
                    borderColor: `${current.accent}88`,
                    color: current.accent,
                    backgroundColor: `${current.accent}22`,
                    fontFamily: "var(--font-technical)",
                    fontSize: "1rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {current.label} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-5 py-2.5 flex items-center gap-4">
        <span className="text-xs text-ink-muted" style={{ fontFamily: "var(--font-technical)" }}>
          {EMOTIONS.length} emociones · {TRIBES.length} tribus
        </span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-xs text-ink-muted" style={{ fontFamily: "var(--font-technical)" }}>
          Haz clic para explorar
        </span>
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
