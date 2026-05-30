"use client";
/**
 * EmergentResonance — purely presentational since the perf refactor.
 *
 * The resonance hits are computed on the server (see
 * `src/lib/server/emotionPageData.ts`) and passed in as `hitsByMode`.
 * This file no longer imports the resonance engine or any seed
 * catalogues, which lets Next bundle this chunk free of the ~600 KB
 * cultural data that the engine previously dragged in.
 *
 * Switching modes just reads a different bucket from the prop — no
 * recomputation, no allocations, no engine round-trip.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { AXIS_LABEL_ES } from "@/lib/resonance-vector";
import type { ResonanceAxes } from "@/types";
import type {
  SerialisableHit,
  EmergentHitsByMode,
} from "@/lib/server/emotionPageData";
type ResonanceMode = "expected" | "adjacent" | "anomaly" | "mixed";
interface EmergentResonanceProps {
  /** Preferred: server-pre-computed hits, one bucket per mode. When
   * supplied, this component imports zero seed catalogues. */
  hitsByMode?: EmergentHitsByMode;
  /** Legacy live mode (Clan/Tribe pages): pass a resonance vector and
   * the component will lazy-load the engine on mount to compute hits.
   * Costs a deferred chunk but keeps those pages working without a
   * server-pre-compute pass. */
  resonance?: ResonanceAxes;
  excludeId?: string;
  /** Accent color used for highlights — usually the entity's recipe color. */
  accentColor: string;
  /** Title for the section (default copy below). */
  title?: string;
}
const MODE_LABEL: Record<ResonanceMode, { es: string; description: string }> = {
  mixed: {
    es: "drift",
    description:
      "Vecindario probabilístico: 70 % vecinos esperados, 20 % adyacentes, 10 % anomalías. La forma en que el sistema deriva entre disciplinas sin agenda.",
  },
  expected: {
    es: "esperado",
    description:
      "Los vecinos con mayor similitud coseno en el espacio de resonancia. La gravedad principal.",
  },
  adjacent: {
    es: "adyacente",
    description:
      "La zona de drift: similitud media. Donde la resonancia empieza a doblar hacia otros sentidos.",
  },
  anomaly: {
    es: "anomalía",
    description:
      "Similitud global baja pero un eje compartido muy fuerte. Aquí emergen las proximidades emocionalmente sorprendentes.",
  },
};
const KIND_GLYPH: Record<string, string> = {
  emotion:      "●",
  color:        "■",
  typography:   "Aa",
  artwork:      "◻",
  music:        "♪",
  film:         "▶",
  poem:         "¶",
  sculpture:    "△",
  dance:        "✦",
  architecture: "▢",
  photography:  "◉",
  literature:   "§",
  ritual:       "◯",
  theater:      "✚",
};
const KIND_LABEL: Record<string, string> = {
  emotion:      "Emoción",
  color:        "Color",
  typography:   "Tipografía",
  artwork:      "Pintura",
  music:        "Música",
  film:         "Film",
  poem:         "Poesía",
  sculpture:    "Escultura",
  dance:        "Danza",
  architecture: "Arquitectura",
  photography:  "Fotografía",
  literature:   "Literatura",
  ritual:       "Ritual",
  theater:      "Teatro",
};
export function EmergentResonance({
  hitsByMode,
  resonance,
  excludeId,
  accentColor,
  title,
}: EmergentResonanceProps) {
  const [mode, setMode] = useState<ResonanceMode>("mixed");
  // Legacy live-mode state: holds engine-computed hits per mode once the
  // lazy import resolves. Pre-computed mode bypasses this entirely.
  const [liveHits, setLiveHits] = useState<EmergentHitsByMode | null>(null);
  useEffect(() => {
    if (hitsByMode || !resonance) return;
    let cancelled = false;
    // Lazy-load the engine ONLY when the caller didn't supply pre-computed
    // hits. Keeps the EmotionDetail bundle free of catalogue weight.
    void (async () => {
      const { resonateFrom } = await import("@/lib/resonance-engine");
      const trimOne = (h: { entity: { id: string; kind: string; label: string; creator?: string; year?: string | number; description?: string; imageUrl?: string; href?: string }; similarity: number; mode: "expected" | "adjacent" | "anomaly"; sharedAxes: Array<{ axis: string; shared: number }>; tensionAxes: Array<{ axis: string; shared: number }> }): SerialisableHit => ({
        entity: h.entity,
        similarity: h.similarity,
        mode: h.mode,
        sharedAxes: h.sharedAxes.map((a) => ({ axis: a.axis, shared: a.shared })),
        tensionAxes: h.tensionAxes.map((a) => ({ axis: a.axis, shared: a.shared })),
      });
      const q = (m: ResonanceMode) =>
        resonateFrom(resonance, {
          mode: m,
          excludeIds: excludeId ? [excludeId] : [],
          limit: 12,
        }).map(trimOne);
      if (cancelled) return;
      setLiveHits({
        mixed: q("mixed"),
        expected: q("expected"),
        adjacent: q("adjacent"),
        anomaly: q("anomaly"),
      });
    })();
    return () => { cancelled = true; };
  }, [hitsByMode, resonance, excludeId]);
  const activeHits = hitsByMode ?? liveHits;
  const hits = activeHits?.[mode] ?? [];
  // Group hits by their per-hit band for the visual layout.
  const banded = {
    expected: hits.filter((h) => h.mode === "expected"),
    adjacent: hits.filter((h) => h.mode === "adjacent"),
    anomaly:  hits.filter((h) => h.mode === "anomaly"),
  };
  return (
    <section className="mb-16">
      <header className="mb-6">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <h2
            className="text-xs text-ink-faint"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
            {title ?? "RESONANCIA EMERGENTE"}
          </h2>
          <div className="flex gap-1">
            {(Object.keys(MODE_LABEL) as ResonanceMode[]).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="text-[0.55rem] px-2 py-1 rounded-full transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-technical)",
                    letterSpacing: "0.15em",
                    color: active ? "var(--album-ink)" : "var(--album-ink-faint)",
                    borderColor: active ? accentColor : "var(--album-border)",
                    backgroundColor: active ? `${accentColor}12` : "transparent",
                    border: "1px solid",
                  }}
                  title={MODE_LABEL[m].description}
>
                  {MODE_LABEL[m].es.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
        <p
          className="text-sm text-ink-muted/70 italic max-w-2xl leading-relaxed"
          style={{ fontFamily: "var(--font-literary)" }}
>
          {MODE_LABEL[mode].description} El sistema no propone estos vínculos;
          los <strong>infiere</strong> a partir de la similitud de los vectores
          de resonancia entre todas las disciplinas del catálogo.
        </p>
      </header>
      <>
        <div
          key={mode}
          className="grid gap-8"
>
          {(mode === "mixed" || mode === "expected") && banded.expected.length> 0 && (
            <BandView
              title="VECINDARIO ESPERADO"
              subtitle="Donde la gravedad apunta directamente."
              hits={banded.expected}
              accentColor={accentColor}
              showStaggerDelay
            />
          )}
          {(mode === "mixed" || mode === "adjacent") && banded.adjacent.length> 0 && (
            <BandView
              title="ZONA DE DRIFT"
              subtitle="Similitud media. La resonancia empieza a doblar."
              hits={banded.adjacent}
              accentColor={accentColor}
              showStaggerDelay
            />
          )}
          {(mode === "mixed" || mode === "anomaly") && banded.anomaly.length> 0 && (
            <BandView
              title="ANOMALÍA · PROXIMIDAD INESPERADA"
              subtitle="Distancia global pero un eje compartido fuerte. Aquí emergen las sorpresas."
              hits={banded.anomaly}
              accentColor={accentColor}
              isAnomaly
              showStaggerDelay
            />
          )}
          {hits.length === 0 && (
            <p
              className="text-sm text-ink-muted/60 italic"
              style={{ fontFamily: "var(--font-literary)" }}
>
              No emergen vecinos en este modo — el espacio de resonancia
              alrededor de esta entidad es escaso o muy denso. Prueba otro
              modo.
            </p>
          )}
        </div>
      </>
    </section>
  );
}
// ─── Band view ────────────────────────────────────────────────────────────────
function BandView({
  title,
  subtitle,
  hits,
  accentColor,
  isAnomaly = false,
  showStaggerDelay = false,
}: {
  title: string;
  subtitle: string;
  hits: SerialisableHit[];
  accentColor: string;
  isAnomaly?: boolean;
  showStaggerDelay?: boolean;
}) {
  return (
    <div>
      <div className="mb-3">
        <p
          className="text-[0.55rem] mb-1"
          style={{
            fontFamily: "var(--font-technical)",
            letterSpacing: "0.2em",
            color: isAnomaly ? accentColor : "var(--album-ink-faint)",
          }}
>
          {title}
        </p>
        <p
          className="text-xs text-ink-muted/65 italic"
          style={{ fontFamily: "var(--font-literary)" }}
>
          {subtitle}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {hits.map((h, i) => (
          <HitCard
            key={`${h.entity.kind}-${h.entity.id}`}
            hit={h}
            accentColor={accentColor}
            delay={showStaggerDelay ? i * 0.04 : 0}
          />
        ))}
      </div>
    </div>
  );
}
// ─── Single hit card ──────────────────────────────────────────────────────────
function HitCard({ hit, accentColor, delay }: { hit: SerialisableHit; accentColor: string; delay: number }) {
  const { entity, similarity, sharedAxes, mode } = hit;
  const topSharedAxes = sharedAxes.slice(0, 3);
  const Tag: React.ElementType = entity.href ? Link : "div";
  return (
    <div
>
      <Tag
        {...(entity.href ? { href: entity.href } : {})}
        className="em-card group block rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.015]"
        style={{
          borderColor: mode === "anomaly" ? `${accentColor}40` : "var(--album-border)",
          backgroundColor: mode === "anomaly" ? `${accentColor}06` : "transparent",
        }}
>
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: `${accentColor}12`,
              color: accentColor,
              fontFamily: "var(--font-display)",
              fontSize: "0.9rem",
            }}
            aria-hidden
>
            {KIND_GLYPH[entity.kind] ?? "·"}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm text-ink/90 leading-tight group-hover:text-ink transition-colors"
              style={{ fontFamily: "var(--font-editorial)" }}
>
              {entity.label}
            </p>
            <p
              className="text-[0.6rem] text-ink-faint mt-0.5"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
>
              {(KIND_LABEL[entity.kind] ?? entity.kind).toUpperCase()}
              {entity.creator ? ` · ${entity.creator}` : ""}
              {entity.year ? ` · ${entity.year}` : ""}
            </p>
          </div>
          <span
            className="text-[0.55rem] text-ink-faint tabular-nums flex-shrink-0"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
            title={`Similitud coseno: ${similarity.toFixed(3)}`}
>
            {Math.round(similarity * 100)}%
          </span>
        </div>
        {entity.description && (
          <p
            className="text-xs text-ink-muted/65 italic leading-relaxed mb-3 line-clamp-2"
            style={{ fontFamily: "var(--font-literary)" }}
>
            {entity.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="text-[0.55rem] text-ink-faint"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
>
            RESUENA POR
          </span>
          {topSharedAxes.map((a) => (
            <span
              key={a.axis}
              className="text-[0.6rem] px-1.5 py-0.5 rounded text-ink/85"
              style={{
                backgroundColor: `${accentColor}15`,
                fontFamily: "var(--font-editorial)",
              }}
              title={`Ambos comparten ${AXIS_LABEL_ES[a.axis as keyof typeof AXIS_LABEL_ES] ?? a.axis} en ${Math.round(a.shared * 100)}%`}
>
              {AXIS_LABEL_ES[a.axis as keyof typeof AXIS_LABEL_ES] ?? a.axis}
            </span>
          ))}
        </div>
      </Tag>
    </div>
  );
}
