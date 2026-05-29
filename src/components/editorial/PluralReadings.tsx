"use client";

/**
 * PluralReadings — the first UI surface that consumes Claim<T> directly.
 *
 * Shows, for an emotion:
 *   - the consensus reading (already what the rest of the page renders)
 *   - the percentage of disagreement, if any
 *   - alternative readings, attributed to their lens / curator / user
 *   - a tiny lens picker so the reader can re-read the page through
 *     another perspective
 *
 * This component is the proof that Phase 1 (Plurality) reaches all the
 * way through: data → consensus → context-aware render.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveEmotion, listLensesPresent } from "@/data/ontology/emotions-claims";
import { useReadContext } from "@/lib/ReadContextProvider";
import type { LensKey, ClaimSource, Claim } from "@/types/claims";

const LENS_LABELS: Record<LensKey, string> = {
  western: "Canon occidental",
  eastern: "Lectura clásica oriental",
  indigenous: "Lectura originaria",
  afrodiasporic: "Lectura afrodiaspórica",
  "latin-american": "Lectura latinoamericana",
  queer: "Afecto queer",
  feminist: "Lectura feminista",
  personal: "Voz personal",
};

function sourceLabel(s: ClaimSource | null): string {
  if (!s) return "—";
  switch (s.kind) {
    case "marina":    return "Marina";
    case "heller":    return "Heller";
    case "curator":   return `Curador · ${s.id}`;
    case "user":      return `Visitante · ${s.id}`;
    case "inference": return `Inferido · ${s.method}`;
    case "lens":      return `Lente · ${LENS_LABELS[s.key]}`;
    case "import":    return `Importado · ${s.provenance}`;
  }
}

interface Props {
  emotionId: string;
  accent: string;
}

export function PluralReadings({ emotionId, accent }: Props) {
  // The local "preview a lens" state is independent from the global lens.
  // When the user clicks a lens here it ALSO sets the global lens so the
  // rest of the page (title font, palette, motion via resonance) re-reads.
  const globalCtx = useReadContext();
  const [localLens, setLocalLens] = useState<LensKey | null>(null);
  const activeLens = localLens ?? globalCtx.lens ?? null;
  const setLens = (next: LensKey | null) => {
    setLocalLens(next);
    globalCtx.setLens(next);
  };

  const lensesAvailable = useMemo(() => listLensesPresent(emotionId), [emotionId]);
  const resolved = useMemo(
    () => resolveEmotion(emotionId, { lens: activeLens ?? undefined }),
    [emotionId, activeLens],
  );

  if (!resolved) return null;

  const hasDisagreement = resolved.contested.description > 0.1 ||
                          resolved.contested.resonance > 0.1;
  type AltEntry = { label: string; claim: Claim<string> };
  const allAlternatives: AltEntry[] = (
    [
      resolved.alternatives.description && { label: "Descripción", claim: resolved.alternatives.description },
      resolved.alternatives.poeticIntro && { label: "Voz poética",  claim: resolved.alternatives.poeticIntro },
      resolved.alternatives.name        && { label: "Nombre",       claim: resolved.alternatives.name },
    ].filter(Boolean) as AltEntry[]
  );

  // Nothing to surface — fail silent, don't waste page space.
  if (lensesAvailable.length === 0 && allAlternatives.length === 0 && !hasDisagreement) {
    return null;
  }

  return (
    <section
      className="mt-12 pt-10 border-t"
      style={{ borderColor: `${accent}28` }}
    >
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p
            className="text-xs mb-2"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.18em", color: accent }}
          >
            LECTURAS PLURALES
          </p>
          <p
            className="text-base text-ink-muted/85 max-w-xl italic"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            Esta emoción no tiene una sola lectura. Marina la nombra de una
            forma; otras tradiciones la nombran de otras. Cambia de lente y
            la página entera se reorganiza.
          </p>
        </div>

        {/* Lens picker */}
        {lensesAvailable.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-w-md">
            <button
              type="button"
              onClick={() => setLens(null)}
              className="px-3 py-1.5 rounded-full text-xs border transition-all"
              style={{
                borderColor: activeLens === null ? accent : `${accent}30`,
                backgroundColor: activeLens === null ? `${accent}1A` : "transparent",
                color: activeLens === null ? accent : "var(--album-ink-muted)",
                fontFamily: "var(--font-technical)",
                letterSpacing: "0.06em",
              }}
            >
              Marina (default)
            </button>
            {lensesAvailable.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setLens(activeLens === k ? null : k)}
                className="px-3 py-1.5 rounded-full text-xs border transition-all"
                style={{
                  borderColor: activeLens === k ? accent : `${accent}30`,
                  backgroundColor: activeLens === k ? `${accent}1A` : "transparent",
                  color: activeLens === k ? accent : "var(--album-ink-muted)",
                  fontFamily: "var(--font-technical)",
                  letterSpacing: "0.06em",
                }}
              >
                {LENS_LABELS[k]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Disagreement meter */}
      {hasDisagreement && (
        <div className="mb-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([["Descripción", resolved.contested.description],
            ["Vector de resonancia", resolved.contested.resonance],
          ] as const).map(([label, value]) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className="text-[0.65rem] w-32 shrink-0"
                style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.12em", color: "var(--album-ink-muted)" }}
              >
                {label.toUpperCase()}
              </span>
              <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.round(value * 100)}%`, backgroundColor: accent }}
                />
              </div>
              <span
                className="text-xs w-10 text-right"
                style={{ fontFamily: "var(--font-technical)", color: accent }}
              >
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Alternative readings */}
      <AnimatePresence mode="popLayout">
        {allAlternatives.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
          >
            {allAlternatives.map(({ label, claim }, i) => (
              <motion.figure
                key={`${claim.source.kind}-${claim.value.slice(0, 24)}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="pl-5 border-l-2"
                style={{ borderColor: `${accent}66` }}
              >
                <blockquote
                  className="text-lg md:text-xl text-ink/90 italic leading-relaxed mb-2"
                  style={{ fontFamily: "var(--font-literary)" }}
                >
                  &ldquo;{claim.value}&rdquo;
                </blockquote>
                <figcaption className="flex flex-wrap items-center gap-2 text-[0.65rem]">
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${accent}1A`,
                      color: accent,
                      fontFamily: "var(--font-technical)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {label.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: "var(--font-technical)", color: "var(--album-ink-muted)", letterSpacing: "0.08em" }}>
                    {sourceLabel(claim.source)}
                    {claim.lens && ` · ${LENS_LABELS[claim.lens as LensKey]}`}
                    {` · peso ${Math.round(claim.weight * 100)}%`}
                  </span>
                </figcaption>
                {claim.evidence && (
                  <p
                    className="mt-2 text-xs text-ink-faint/85 max-w-2xl"
                    style={{ fontFamily: "var(--font-literary)" }}
                  >
                    {claim.evidence}
                  </p>
                )}
              </motion.figure>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
