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
import { submitClaim, voteClaim, retractVote, useClaimsVersion } from "@/lib/participation";
import { isParticipationEnabled } from "@/lib/supabaseClient";
import { getSessionId } from "@/lib/sessionId";
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

  // claimsVersion bumps when remote claims merge in, invalidating the
  // resolved view so submissions / votes by other visitors appear live.
  const claimsVersion = useClaimsVersion();
  const lensesAvailable = useMemo(
    () => listLensesPresent(emotionId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emotionId, claimsVersion],
  );
  const resolved = useMemo(
    () => resolveEmotion(emotionId, { lens: activeLens ?? undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emotionId, activeLens, claimsVersion],
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
                  {/* Voting thumbs — only when participation backend is wired
                      AND the claim has a real db id (UUID), not a seed id. */}
                  {isParticipationEnabled() && /^[0-9a-f-]{36}$/.test(claim.id) && (
                    <ClaimVoteBadge claim={claim} accent={accent} />
                  )}
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

      {/* Submission form — anyone can drop a new reading. Shown only when
          the participation backend is configured. */}
      {isParticipationEnabled() && (
        <SubmitReadingForm
          emotionId={emotionId}
          accent={accent}
          activeLens={activeLens}
        />
      )}
    </section>
  );
}

// ─── Submit a new reading ─────────────────────────────────────────────

function SubmitReadingForm({
  emotionId,
  accent,
  activeLens,
}: {
  emotionId: string;
  accent: string;
  activeLens: LensKey | null;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [lens, setLens] = useState<LensKey | "">(activeLens ?? "");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<null | "ok" | "err">(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setStatus(null);
    const r = await submitClaim({
      kind: "emotion",
      entityId: emotionId,
      fieldPath: "description",
      value: value.trim(),
      lens: (lens || undefined) as LensKey | undefined,
      evidence: evidence.trim() || undefined,
      weight: 0.4,
    });
    setBusy(false);
    if (r.ok) {
      setStatus("ok");
      setValue("");
      setEvidence("");
      setTimeout(() => { setStatus(null); setOpen(false); }, 1400);
    } else {
      setStatus("err");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs border-2 transition-all hover:scale-[1.02]"
        style={{
          borderColor: `${accent}66`,
          backgroundColor: `${accent}10`,
          color: accent,
          fontFamily: "var(--font-technical)",
          letterSpacing: "0.12em",
        }}
      >
        <span className="icon icon-sm">add</span>
        AÑADIR MI LECTURA
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 p-5 rounded-2xl border"
      style={{ borderColor: `${accent}40`, backgroundColor: `${accent}08` }}
    >
      <p
        className="text-[0.7rem] mb-3"
        style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em", color: accent }}
      >
        TU LECTURA
      </p>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cuenta cómo lees tú esta emoción. ¿Qué nombre le pondrías? ¿En qué tradición vive?"
        rows={4}
        maxLength={1200}
        required
        className="w-full bg-transparent outline-none text-ink/95 placeholder:text-ink-muted/50 italic"
        style={{ fontFamily: "var(--font-literary)", fontSize: "1rem", lineHeight: "1.6" }}
      />

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <select
          value={lens}
          onChange={(e) => setLens(e.target.value as LensKey | "")}
          className="px-3 py-1.5 rounded-full text-xs bg-transparent border outline-none"
          style={{
            borderColor: `${accent}40`,
            color: "var(--album-ink)",
            fontFamily: "var(--font-technical)",
            letterSpacing: "0.05em",
          }}
        >
          <option value="">Sin lente</option>
          {(Object.entries(LENS_LABELS) as Array<[LensKey, string]>).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>

        <input
          type="text"
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="Referencia (autor, fuente, tradición)..."
          maxLength={400}
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-full text-xs bg-transparent border outline-none placeholder:text-ink-muted/60"
          style={{
            borderColor: `${accent}30`,
            color: "var(--album-ink)",
            fontFamily: "var(--font-technical)",
          }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="px-4 py-2 rounded-full text-xs border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
          style={{
            borderColor: accent,
            backgroundColor: `${accent}22`,
            color: accent,
            fontFamily: "var(--font-technical)",
            letterSpacing: "0.1em",
          }}
        >
          {busy ? "ENVIANDO…" : "ENVIAR"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
        >
          cancelar
        </button>
        {status === "ok" && (
          <span className="text-xs italic" style={{ color: accent, fontFamily: "var(--font-literary)" }}>
            Gracias por aportar.
          </span>
        )}
        {status === "err" && (
          <span className="text-xs italic text-ink-faint" style={{ fontFamily: "var(--font-literary)" }}>
            No se pudo enviar; reintenta.
          </span>
        )}
      </div>

      <p
        className="mt-4 text-[0.65rem] text-ink-faint/85 italic max-w-2xl"
        style={{ fontFamily: "var(--font-literary)" }}
      >
        Tu lectura coexiste con las demás. Cada visitante puede dar +1 o −1
        para ajustar el peso colectivo. Anónimo, sin login.
      </p>
    </form>
  );
}

// ─── Voting thumbs ────────────────────────────────────────────────────

function ClaimVoteBadge({ claim, accent }: { claim: Claim<string>; accent: string }) {
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<{ dir: 1 | -1 | 0; score: number; total: number } | null>(null);

  const up = optimistic?.dir === 1;
  const down = optimistic?.dir === -1;
  const score = optimistic?.score ?? (claim.votes ? Math.round(claim.votes.up - claim.votes.down) : 0);
  const total = optimistic?.total ?? (claim.votes ? Math.round(claim.votes.up + claim.votes.down) : 0);

  // Read session-scoped vote state from localStorage so re-renders preserve user state.
  const voteKey = `album:vote:${claim.id}`;
  if (optimistic === null && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(voteKey);
      if (raw === "1" || raw === "-1") {
        const dir = parseInt(raw, 10) as 1 | -1;
        setOptimistic({ dir, score, total });
      }
    } catch { /* */ }
  }
  void getSessionId; // ensure module side-effect

  async function cast(dir: 1 | -1) {
    if (pending) return;
    setPending(true);
    const wasSame = (dir === 1 && up) || (dir === -1 && down);
    const prevDir = optimistic?.dir ?? 0;
    const delta = (wasSame ? -prevDir : dir - prevDir);
    setOptimistic({
      dir: wasSame ? 0 : dir,
      score: score + delta,
      total: wasSame ? total - 1 : (prevDir === 0 ? total + 1 : total),
    });
    try {
      if (wasSame) {
        await retractVote(claim.id);
        try { window.localStorage.removeItem(voteKey); } catch { /* */ }
      } else {
        await voteClaim(claim.id, dir);
        try { window.localStorage.setItem(voteKey, String(dir)); } catch { /* */ }
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border"
      style={{
        borderColor: `${accent}30`,
        fontFamily: "var(--font-technical)",
        letterSpacing: "0.04em",
        fontSize: "0.6rem",
      }}
    >
      <button
        type="button"
        onClick={() => cast(1)}
        disabled={pending}
        aria-label="Coincido"
        className="icon icon-sm transition-colors"
        style={{ color: up ? accent : "var(--album-ink-faint)" }}
      >
        thumb_up
      </button>
      <span className="px-1" style={{ color: "var(--album-ink-muted)" }}>
        {score > 0 ? `+${score}` : score} · {total}
      </span>
      <button
        type="button"
        onClick={() => cast(-1)}
        disabled={pending}
        aria-label="Disiento"
        className="icon icon-sm transition-colors"
        style={{ color: down ? accent : "var(--album-ink-faint)" }}
      >
        thumb_down
      </button>
    </span>
  );
}
