"use client";

/**
 * PathwayDrift — multi-hop semantic walk through the catalogue.
 *
 * The INITIAL candidates (the first three options offered when the page
 * loads) are server-pre-computed and passed via `initialCandidates`.
 * That means rendering the first hop costs zero JS for the resonance
 * engine.
 *
 * When the visitor actually picks a candidate, we lazy-import the engine
 * (and, transitively, the seed catalogues) to compute the next hop's
 * candidates. That cost is deferred to genuine user interaction — most
 * visitors never trigger it.
 *
 * Legacy fallback: if no `initialCandidates` are supplied but a
 * `resonance` vector is, the component computes the first step on mount
 * via the same lazy engine import (used by ClanView / TribeView until
 * those pages get a server-pre-compute pass of their own).
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ResonanceAxes } from "@/types";
import type { PathwayCandidate } from "@/lib/server/emotionPageData";

interface PathwayDriftProps {
  /** Display name of the starting entity. */
  startLabel: string;
  /** ID of the starting entity (used to seed the trail). */
  startId: string;
  /** Color used for the path strokes & accents. */
  accentColor: string;
  /** Preferred: server-pre-computed first-step candidates. */
  initialCandidates?: PathwayCandidate[];
  /** Legacy live mode: when no initial candidates are provided, this
   * resonance vector triggers a lazy engine import to compute them. */
  resonance?: ResonanceAxes;
}

type Hop = "start" | "expected" | "adjacent" | "anomaly";

interface TrailNode {
  id: string;
  kind: string;
  label: string;
  fromMode: Hop;
}

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

const MODE_LABEL: Record<"expected" | "adjacent" | "anomaly", string> = {
  expected: "GRAVEDAD",
  adjacent: "DRIFT",
  anomaly:  "ANOMALÍA",
};

const MODE_HINT: Record<"expected" | "adjacent" | "anomaly", string> = {
  expected: "El vecino más obvio. Sigue la fuerza principal del campo.",
  adjacent: "La zona intermedia. La resonancia empieza a doblar hacia otro sentido.",
  anomaly:  "Un nodo lejos en general, pero unido por un eje compartido fuerte. Aquí la deriva sorprende.",
};

export function PathwayDrift({
  startLabel,
  startId,
  accentColor,
  initialCandidates,
  resonance,
}: PathwayDriftProps) {
  const [path, setPath] = useState<TrailNode[]>(() => [
    { id: startId, kind: "emotion", label: startLabel, fromMode: "start" },
  ]);
  const [candidates, setCandidates] = useState<PathwayCandidate[]>(
    initialCandidates ?? [],
  );
  const [busy, setBusy] = useState(false);

  // Legacy live-mode bootstrap: if the caller didn't pre-compute the
  // first step, lazy-load the engine to fill it in.
  useEffect(() => {
    if (initialCandidates || !resonance) return;
    let cancelled = false;
    void (async () => {
      const { queryResonance } = await import("@/lib/resonance-engine");
      const { buildVector } = await import("@/lib/resonance-vector");
      const v = buildVector(resonance);
      const pick = (mode: "expected" | "adjacent" | "anomaly"): PathwayCandidate | null => {
        const hits = queryResonance(v, {
          mode,
          excludeIds: [startId],
          limit: 8,
        });
        const cross = hits.find((h) => h.entity.kind !== "emotion");
        const chosen = (cross ?? hits[0])?.entity;
        if (!chosen) return null;
        return {
          id: chosen.id,
          kind: chosen.kind,
          label: chosen.label,
          creator: chosen.creator,
          year: chosen.year,
          fromMode: mode,
        };
      };
      const next: PathwayCandidate[] = [];
      for (const m of ["expected", "adjacent", "anomaly"] as const) {
        const p = pick(m);
        if (p && !next.some((x) => x.id === p.id)) next.push(p);
      }
      if (!cancelled) setCandidates(next);
    })();
    return () => { cancelled = true; };
  }, [initialCandidates, resonance, startId]);

  const isMaxed = path.length >= 7;

  // When the user picks a candidate, append to the trail and compute the
  // next set of candidates. This is the moment we accept the engine
  // import — most visitors never reach it.
  async function pickCandidate(c: PathwayCandidate) {
    if (busy || isMaxed) return;
    setBusy(true);
    const nextPath: TrailNode[] = [
      ...path,
      { id: c.id, kind: c.kind, label: c.label, fromMode: c.fromMode },
    ];
    setPath(nextPath);
    setCandidates([]);

    try {
      const { getIndex, queryResonance } = await import("@/lib/resonance-engine");
      const index = getIndex();
      const head = index.find((e) => e.id === c.id);
      if (!head) {
        setBusy(false);
        return;
      }
      const excluded = nextPath.map((n) => n.id);
      const pick = (mode: "expected" | "adjacent" | "anomaly"): PathwayCandidate | null => {
        const hits = queryResonance(head.vector, {
          mode,
          excludeIds: excluded,
          limit: 8,
        });
        const cross = hits.find((h) => h.entity.kind !== head.kind);
        const chosen = (cross ?? hits[0])?.entity;
        if (!chosen) return null;
        return {
          id: chosen.id,
          kind: chosen.kind,
          label: chosen.label,
          creator: chosen.creator,
          year: chosen.year,
          fromMode: mode,
        };
      };
      const next: PathwayCandidate[] = [];
      for (const m of ["expected", "adjacent", "anomaly"] as const) {
        const p = pick(m);
        if (p && !next.some((x) => x.id === p.id)) next.push(p);
      }
      setCandidates(next);
    } finally {
      setBusy(false);
    }
  }

  const reset = () => {
    setPath([{ id: startId, kind: "emotion", label: startLabel, fromMode: "start" }]);
    setCandidates(initialCandidates ?? []);
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
              {busy && <span className="ml-2 italic opacity-60">cargando…</span>}
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {candidates.map((c) => (
                <CandidateCard
                  key={`${c.kind}-${c.id}`}
                  candidate={c}
                  accentColor={accentColor}
                  onPick={() => pickCandidate(c)}
                  disabled={busy}
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

function PathChip({ node, accentColor }: { node: TrailNode; accentColor: string }) {
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
        {KIND_GLYPH[node.kind] ?? "·"}
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

function CandidateCard({
  candidate,
  accentColor,
  onPick,
  disabled,
}: {
  candidate: PathwayCandidate;
  accentColor: string;
  onPick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className="em-card group block text-left rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.015] disabled:opacity-50 disabled:cursor-wait"
      style={{
        borderColor: candidate.fromMode === "anomaly" ? `${accentColor}40` : "var(--album-border)",
        backgroundColor: candidate.fromMode === "anomaly" ? `${accentColor}06` : "transparent",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
          style={{
            color: "var(--album-ink)",
            borderColor: `${accentColor}66`,
            backgroundColor: `${accentColor}14`,
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
          {(KIND_LABEL[candidate.kind] ?? candidate.kind).toUpperCase()}
        </span>
      </div>
      <div className="flex items-start gap-2 mb-2">
        <span
          className="text-base flex-shrink-0"
          style={{ color: accentColor, fontFamily: "var(--font-display)" }}
          aria-hidden
        >
          {KIND_GLYPH[candidate.kind] ?? "·"}
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
