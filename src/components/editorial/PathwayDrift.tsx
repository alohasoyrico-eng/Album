"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getIndex,
  queryResonance,
  type IndexedEntity,
  type EntityKind,
} from "@/lib/resonance-engine";
import type { ResonanceAxes } from "@/types";
import { buildVector } from "@/lib/resonance-vector";

interface PathwayDriftProps {
  /** Resonance of the starting entity (the page we're on). */
  resonance: ResonanceAxes;
  /** ID of the starting entity. */
  startId: string;
  /** Display name of the starting entity. */
  startLabel: string;
  /** Color used for the path strokes & accents. */
  accentColor: string;
}

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
 * Multi-hop semantic drift. The user starts at the current emotion. The
 * system proposes 3 candidate next-hops — sorted to encourage CROSS-DISCIPLINE
 * jumps. The user picks one; the trail accumulates; the next set of candidates
 * is computed from the new vector. After 5 hops, the user has traced a small
 * pathway through the semantic space — the kind of drift the original prompt
 * asks for:
 *
 *   Tenderness → warm silence → chamber music → faded gold → temporal
 *   softness → nostalgia → abandoned architecture → melancholy
 *
 * The drift is RESONANCE-DRIVEN, not curated. Each hop is the system inferring
 * what comes next.
 */
export function PathwayDrift({ resonance, startId, startLabel, accentColor }: PathwayDriftProps) {
  const [path, setPath] = useState<Array<IndexedEntity & { fromMode: "start" | "expected" | "adjacent" | "anomaly" }>>(
    () => [{
      id: startId,
      kind: "emotion",
      vector: buildVector(resonance),
      label: startLabel,
      fromMode: "start" as const,
    }],
  );

  // For the current head of the path, compute candidate next hops.
  // We mix 1 expected (gravitational core) + 1 adjacent (drift) + 1 anomaly (surprise).
  const candidates = useMemo(() => {
    const head = path[path.length - 1];
    const excluded = path.map((p) => p.id);

    const seenKindAtHead = head.kind;

    const pick = (mode: "expected" | "adjacent" | "anomaly") => {
      const hits = queryResonance(head.vector, {
        mode,
        excludeIds: excluded,
        limit: 8,
      });
      // Prefer cross-discipline candidates
      const crossKind = hits.find((h) => h.entity.kind !== seenKindAtHead);
      return (crossKind ?? hits[0])?.entity;
    };

    const out: Array<IndexedEntity & { fromMode: "expected" | "adjacent" | "anomaly" }> = [];
    const ex = pick("expected");
    if (ex) out.push({ ...ex, fromMode: "expected" });
    const ad = pick("adjacent");
    if (ad && !out.some((o) => o.id === ad.id)) out.push({ ...ad, fromMode: "adjacent" });
    const an = pick("anomaly");
    if (an && !out.some((o) => o.id === an.id)) out.push({ ...an, fromMode: "anomaly" });
    return out;
  }, [path]);

  const isMaxed = path.length >= 7;

  const reset = () => {
    setPath([path[0]]);
  };

  return (
    <section className="mb-16">
      <header className="mb-6">
        <p
          className="text-[0.6rem] text-ink-faint mb-2"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
        >
          DERIVA SEMÁNTICA
        </p>
        <p
          className="text-sm text-ink-muted/75 italic max-w-xl leading-relaxed"
          style={{ fontFamily: "var(--font-literary)" }}
        >
          Camina por el campo semántico saltando entre disciplinas. Cada nodo
          propone su propio vecindario — sigue la gravedad, la deriva o la
          anomalía. La cadena no la dibujamos nosotros: la dibujas tú con tus
          decisiones, y el sistema responde con su geometría.
        </p>
      </header>

      {/* ─── Trail ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {path.map((node, i) => (
            <motion.div
              key={`${node.id}-${i}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2"
            >
              <PathChip node={node} accentColor={accentColor} />
              {i < path.length - 1 && (
                <span
                  className="text-xs"
                  style={{ color: accentColor, opacity: 0.55, fontFamily: "var(--font-technical)" }}
                  aria-hidden
                >
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>
        {path.length > 1 && (
          <button
            onClick={reset}
            className="mt-4 text-[0.6rem] text-ink-faint hover:text-ink transition-colors duration-200"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
          >
            ← VOLVER AL INICIO
          </button>
        )}
      </div>

      {/* ─── Next candidates ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!isMaxed && candidates.length > 0 && (
          <motion.div
            key={path.length}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className="text-[0.55rem] text-ink-faint mb-3"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              SIGUIENTE NODO · ELIGE LA DIRECCIÓN
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {candidates.map((c) => (
                <CandidateCard
                  key={`${c.kind}-${c.id}`}
                  candidate={c}
                  accentColor={accentColor}
                  onPick={() => setPath((p) => [...p, c])}
                />
              ))}
            </div>
          </motion.div>
        )}
        {isMaxed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-ink-muted/65 italic"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            Has caminado siete pasos en el campo semántico. El recorrido cierra
            aquí — o vuelves al inicio y trazas otra deriva.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Path chip — a node already added to the trail ───────────────────────────

function PathChip({
  node,
  accentColor,
}: {
  node: IndexedEntity & { fromMode: "start" | "expected" | "adjacent" | "anomaly" };
  accentColor: string;
}) {
  const isStart = node.fromMode === "start";
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
      style={{
        borderColor: isStart ? accentColor : "var(--album-border)",
        backgroundColor: isStart ? `${accentColor}12` : "transparent",
      }}
      title={node.label}
    >
      <span
        className="text-xs"
        style={{
          color: accentColor,
          fontFamily: "var(--font-display)",
          opacity: isStart ? 1 : 0.65,
        }}
        aria-hidden
      >
        {KIND_GLYPH[node.kind]}
      </span>
      <span
        className="text-xs text-ink/85"
        style={{ fontFamily: "var(--font-editorial)" }}
      >
        {node.label}
      </span>
      {!isStart && (
        <span
          className="text-[0.5rem] text-ink-faint ml-1"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
        >
          {node.fromMode.toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ─── Candidate card ──────────────────────────────────────────────────────────

const MODE_LABEL: Record<"expected" | "adjacent" | "anomaly", string> = {
  expected:  "GRAVEDAD",
  adjacent:  "DRIFT",
  anomaly:   "ANOMALÍA",
};

const MODE_HINT: Record<"expected" | "adjacent" | "anomaly", string> = {
  expected:  "El vecino más obvio. Sigue la fuerza principal del campo.",
  adjacent:  "La zona intermedia. La resonancia empieza a doblar hacia otro sentido.",
  anomaly:   "Un nodo lejos en general, pero unido por un eje compartido fuerte. Aquí la deriva sorprende.",
};

function CandidateCard({
  candidate,
  accentColor,
  onPick,
}: {
  candidate: IndexedEntity & { fromMode: "expected" | "adjacent" | "anomaly" };
  accentColor: string;
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className="em-card group block text-left rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.015]"
      style={{
        borderColor: candidate.fromMode === "anomaly" ? `${accentColor}40` : "var(--album-border)",
        backgroundColor: candidate.fromMode === "anomaly" ? `${accentColor}06` : "transparent",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
          style={{
            color: accentColor,
            borderColor: `${accentColor}40`,
            backgroundColor: `${accentColor}10`,
            border: "1px solid",
            fontFamily: "var(--font-technical)",
            letterSpacing: "0.15em",
          }}
        >
          {MODE_LABEL[candidate.fromMode]}
        </span>
        <span
          className="text-[0.55rem] text-ink-faint"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
        >
          {KIND_LABEL[candidate.kind].toUpperCase()}
        </span>
      </div>
      <div className="flex items-start gap-2 mb-2">
        <span
          className="text-base flex-shrink-0"
          style={{ color: accentColor, fontFamily: "var(--font-display)" }}
          aria-hidden
        >
          {KIND_GLYPH[candidate.kind]}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm text-ink/95 leading-tight"
            style={{ fontFamily: "var(--font-editorial)" }}
          >
            {candidate.label}
          </p>
          {candidate.creator && (
            <p
              className="text-[0.6rem] text-ink-faint mt-0.5"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
            >
              {candidate.creator.toUpperCase()}
              {candidate.year ? ` · ${candidate.year}` : ""}
            </p>
          )}
        </div>
      </div>
      <p
        className="text-[0.65rem] text-ink-muted/55 italic mt-2 leading-relaxed"
        style={{ fontFamily: "var(--font-literary)" }}
      >
        {MODE_HINT[candidate.fromMode]}
      </p>
    </button>
  );
}

// Suppress import warning during build
void getIndex;
