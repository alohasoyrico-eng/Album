"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  resonateFrom,
  type ResonanceHit,
  type ResonanceMode,
  type EntityKind,
} from "@/lib/resonance-engine";
import { AXIS_LABEL_ES } from "@/lib/resonance-vector";
import type { ResonanceAxes } from "@/types";

interface EmergentResonanceProps {
  /** The query entity's resonance — usually an emotion or a color. */
  resonance: ResonanceAxes;
  /** ID of the entity itself, so it doesn't surface as a hit against itself. */
  excludeId: string;
  /** Optional kind to also exclude (e.g. don't compete with same-kind curations). */
  excludeKinds?: EntityKind[];
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

const KIND_GLYPH: Record<EntityKind, string> = {
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

const KIND_LABEL: Record<EntityKind, string> = {
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

/**
 * EmergentResonance — a section that shows COMPUTED neighbors instead of
 * curated lists. The neighborhood is derived by cosine similarity over the
 * full vector index. Each hit is labeled with the top axes both vectors
 * share (the explanation of WHY they resonate) and the axes where they
 * most disagree (the tension that makes the hit interesting).
 *
 * Modes:
 *   - 'mixed'    — 70/20/10 expected/adjacent/anomaly
 *   - 'expected' — only the obvious neighborhood
 *   - 'adjacent' — the drift zone
 *   - 'anomaly'  — only surprise resonances
 */
export function EmergentResonance({
  resonance,
  excludeId,
  excludeKinds,
  accentColor,
  title,
}: EmergentResonanceProps) {
  const [mode, setMode] = useState<ResonanceMode>("mixed");

  const hits = useMemo(() => {
    return resonateFrom(resonance, {
      mode,
      excludeIds: [excludeId],
      limit: 12,
    }).filter((h) => !excludeKinds?.includes(h.entity.kind));
  }, [resonance, mode, excludeId, excludeKinds]);

  // Group hits by mode for the visual band layout
  const banded = useMemo(() => {
    const expected: ResonanceHit[] = [];
    const adjacent: ResonanceHit[] = [];
    const anomaly:  ResonanceHit[] = [];
    for (const h of hits) {
      (h.mode === "expected" ? expected : h.mode === "adjacent" ? adjacent : anomaly).push(h);
    }
    return { expected, adjacent, anomaly };
  }, [hits]);

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
          {/* Mode selector */}
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
                    color: active ? accentColor : "var(--album-ink-faint)",
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

      <AnimatePresence mode="popLayout">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-8"
        >
          {/* In mixed mode, show all three bands. In single modes, show just the active band. */}
          {(mode === "mixed" || mode === "expected") && banded.expected.length > 0 && (
            <BandView
              title="VECINDARIO ESPERADO"
              subtitle="Donde la gravedad apunta directamente."
              hits={banded.expected}
              accentColor={accentColor}
              showStaggerDelay
            />
          )}
          {(mode === "mixed" || mode === "adjacent") && banded.adjacent.length > 0 && (
            <BandView
              title="ZONA DE DRIFT"
              subtitle="Similitud media. La resonancia empieza a doblar."
              hits={banded.adjacent}
              accentColor={accentColor}
              showStaggerDelay
            />
          )}
          {(mode === "mixed" || mode === "anomaly") && banded.anomaly.length > 0 && (
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
        </motion.div>
      </AnimatePresence>
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
  hits: ResonanceHit[];
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

function HitCard({ hit, accentColor, delay }: { hit: ResonanceHit; accentColor: string; delay: number }) {
  const { entity, similarity, sharedAxes, mode } = hit;
  const topSharedAxes = sharedAxes.slice(0, 3);
  const Tag: React.ElementType = entity.href ? Link : "div";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
          {/* Glyph + kind */}
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
            {KIND_GLYPH[entity.kind]}
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
              {KIND_LABEL[entity.kind].toUpperCase()}
              {entity.creator ? ` · ${entity.creator}` : ""}
              {entity.year ? ` · ${entity.year}` : ""}
            </p>
          </div>
          {/* Similarity numeric */}
          <span
            className="text-[0.55rem] text-ink-faint tabular-nums flex-shrink-0"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
            title={`Similitud coseno: ${similarity.toFixed(3)}`}
          >
            {Math.round(similarity * 100)}%
          </span>
        </div>

        {/* Description */}
        {entity.description && (
          <p
            className="text-xs text-ink-muted/65 italic leading-relaxed mb-3 line-clamp-2"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            {entity.description}
          </p>
        )}

        {/* Axes — the explanation of WHY they resonate */}
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
              title={`Ambos comparten ${AXIS_LABEL_ES[a.axis]} en ${Math.round(a.shared * 100)}%`}
            >
              {AXIS_LABEL_ES[a.axis]}
            </span>
          ))}
        </div>
      </Tag>
    </motion.div>
  );
}
