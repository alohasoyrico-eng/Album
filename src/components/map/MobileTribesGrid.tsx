"use client";

/**
 * MobileTribesGrid — the home navigation surface for phones / phablets.
 *
 * Why this exists
 * ────────────────
 * The SemanticMap is a 22-tribe radial diagram. On a 360 px viewport
 * the radius collapses to ~120 px, label diameters compete for ~16 px
 * of arc each, and the d3 zoom + pan interaction is fiddly on touch.
 *
 * On phones we drop the radial entirely and show a 2-column grid of
 * tribe cards — each painted in its tribal hue, listing the count of
 * clans + emotions inside. Same destination, mobile-native feel.
 *
 * Used together with `<SemanticMap />` via Tailwind's responsive
 * visibility utilities:
 *
 *     <div className="hidden md:block"><SemanticMap /></div>
 *     <div className="md:hidden">      <MobileTribesGrid /></div>
 *
 * Both trees ship to all clients but only one is ever visible. The
 * map's heavy d3 + catalog imports keep paying their cost only on
 * tablet+ where the radial actually works; the grid is tiny.
 */

import Link from "next/link";
import { TRIBES } from "@/data/ontology/tribes";
import { CLANS_BY_TRIBE } from "@/data/ontology/clans";
import { EMOTIONS } from "@/data/ontology/emotions";

export function MobileTribesGrid() {
  return (
    <section className="relative w-full px-5 pb-16 pt-8">
      <header className="mb-6 max-w-md mx-auto text-center">
        <p
          className="text-[0.65rem] mb-3"
          style={{
            fontFamily: "var(--font-technical)",
            letterSpacing: "0.3em",
            color: "var(--album-ink-faint)",
          }}
        >
          22 TRIBUS · 384 EMOCIONES
        </p>
        <h2
          className="text-2xl text-ink leading-tight"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          La constelación, por tribus
        </h2>
        <p
          className="text-sm text-ink-muted/80 mt-3 italic leading-relaxed"
          style={{ fontFamily: "var(--font-literary)" }}
        >
          Cada tribu agrupa emociones de la misma familia afectiva.
          Toca una para entrar.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {TRIBES.map((tribe) => {
          const clanCount = (CLANS_BY_TRIBE[tribe.id] ?? []).length;
          const emotionCount = EMOTIONS.filter((e) => e.tribe === tribe.id).length;
          return (
            <Link
              key={tribe.id}
              href={`/tribe/${tribe.id}`}
              // 44 px min height clears Apple's tap-target HIG. Padding
              // pulls each card visually away from its neighbours without
              // burning width on narrow phones.
              className="relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 active:scale-[0.98] min-h-[112px]"
              style={{
                borderColor: `${tribe.color}30`,
                backgroundColor: `${tribe.color}0E`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: tribe.color,
                    boxShadow: `0 0 8px ${tribe.color}AA`,
                  }}
                />
                <p
                  className="text-[0.55rem] truncate"
                  style={{
                    color: tribe.color,
                    fontFamily: "var(--font-technical)",
                    letterSpacing: "0.16em",
                  }}
                >
                  TRIBU
                </p>
              </div>
              <p
                className="text-base text-ink/95 leading-tight mb-3"
                style={{ fontFamily: "var(--font-editorial)" }}
              >
                {tribe.name}
              </p>
              <p
                className="text-[0.6rem] text-ink-muted"
                style={{
                  fontFamily: "var(--font-technical)",
                  letterSpacing: "0.08em",
                }}
              >
                {clanCount} CLANES · {emotionCount} EMOCIONES
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 max-w-md mx-auto text-center">
        <p
          className="text-xs text-ink-faint italic"
          style={{ fontFamily: "var(--font-literary)" }}
        >
          ¿Prefieres explorar el mapa completo? Abre Álbum en una pantalla más
          ancha — el atlas radial cobra sentido a partir de 768 px.
        </p>
      </div>
    </section>
  );
}
