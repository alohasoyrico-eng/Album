"use client";
import { useState, useEffect } from "react";
import type { Emotion, Tribe } from "@/types";
import { recordVote, getVoteResults } from "@/lib/analytics";
import { useParticipationStore } from "@/lib/store";
import type { ParticipationOptions } from "@/lib/server/emotionPageData";
interface Props {
  emotion: Emotion;
  tribe: Tribe;
  /** Server-supplied option lists — replaces the COLORS / TYPOGRAPHY /
   * EMOTIONS imports that previously dragged those catalogues into the
   * client bundle. */
  options: ParticipationOptions;
}
type PromptType = "color" | "typography" | "transition" | "temperature";
interface Prompt {
  id: string;
  type: PromptType;
  question: string;
  options: { id: string; label: string; value: string; color?: string }[];
}
export function ParticipationModule({ emotion, tribe, options }: Props) {
  const { hasAnswered, markAnswered } = useParticipationStore();
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof getVoteResults> | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const prompts: Prompt[] = [
    {
      id: `${emotion.id}_color`,
      type: "color",
      question: `¿Qué color resuena más con ${emotion.name}?`,
      options: options.colors.map((c) => ({
        id: c.id,
        label: c.nameEs,
        value: c.id,
        color: c.hex,
      })),
    },
    {
      id: `${emotion.id}_temperature`,
      type: "temperature",
      question: `¿${emotion.name} te parece una emoción cálida o fría?`,
      options: [
        { id: "warm", label: "Cálida", value: "warm", color: "#C8935A" },
        { id: "cold", label: "Fría", value: "cold", color: "#4A6FA5" },
        { id: "neutral", label: "Neutra", value: "neutral", color: "var(--album-ink-muted)" },
        { id: "ambiguous", label: "Ambigua", value: "ambiguous", color: "#7A4A9A" },
      ],
    },
    {
      id: `${emotion.id}_typography`,
      type: "typography",
      question: `¿Qué tipografía sientes más cercana a ${emotion.name}?`,
      options: options.typographies.map((t) => ({
        id: t.id,
        label: t.name,
        value: t.id,
      })),
    },
    {
      id: `${emotion.id}_transition`,
      type: "transition",
      question: `¿Qué emoción suele venir después de ${emotion.name}?`,
      // Transitions are server-pre-resolved (id → display name) so this
      // module needs no EMOTIONS catalogue.
      options: options.transitions
        .slice(0, 4)
        .map((t) => ({ id: t.to, label: t.toName, value: t.to })),
    },
  ];
  useEffect(() => {
    const unanswered = prompts.find((p) => !hasAnswered(p.id));
    setCurrentPrompt(unanswered ?? null);
  }, [emotion.id]);
  const handleVote = (optionId: string) => {
    if (!currentPrompt) return;
    setSelectedOption(optionId);
    recordVote(currentPrompt.id, optionId);
    markAnswered(currentPrompt.id);
    const r = getVoteResults(currentPrompt.id);
    setResults(r);
    setAnswered(true);
  };
  const handleNext = () => {
    const unanswered = prompts.find((p) => !hasAnswered(p.id) && p.id !== currentPrompt?.id);
    setCurrentPrompt(unanswered ?? null);
    setAnswered(false);
    setSelectedOption(null);
    setResults(null);
  };
  if (!currentPrompt) return null;
  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: tribe.color, opacity: 0.6 }} />
        <h2 className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
          PARTICIPACIÓN COLECTIVA
        </h2>
      </div>
      <div className="p-5 rounded-2xl border border-white/8 bg-raised/40">
        <>
          {!answered ? (
            <div
              key="question"
>
              <p
                className="text-base text-ink/80 mb-5 leading-relaxed"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic" }}
>
                {currentPrompt.question}
              </p>
              <div className="grid gap-2">
                {currentPrompt.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id)}
                    className="participation-option group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/6 hover:border-white/15 transition-all duration-200 text-left"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
>
                    {option.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color, opacity: 0.75 }}
                      />
                    )}
                    <span
                      className="text-sm text-ink-muted group-hover:text-ink transition-colors"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              key="results"
>
              <p
                className="text-sm text-ink-muted mb-4"
                style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}
>
                {currentPrompt.question}
              </p>
              {results && (
                <div className="grid gap-2.5 mb-4">
                  {currentPrompt.options.map((option) => {
                    const votes = (results.votes as Record<string, number>)[option.id] ?? 0;
                    const total = Math.max(results.total, 1);
                    const pct = Math.round((votes / total) * 100);
                    const isDominant = option.id === results.dominantOption;
                    const isSelected = option.id === selectedOption;
                    return (
                      <div key={option.id} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {option.color && (
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color, opacity: 0.7 }} />
                            )}
                            <span
                              className={`text-xs ${isDominant ? "text-ink/80" : "text-ink-faint"}`}
                              style={{ fontFamily: "var(--font-technical)" }}
>
                              {option.label}
                              {isSelected && <span className="ml-1 opacity-50">(tu voto)</span>}
                            </span>
                          </div>
                          <span
                            className="text-xs text-ink-faint"
                            style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}
>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-px bg-white/6 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: option.color ?? tribe.color,
                              opacity: isDominant ? 0.7 : 0.3,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {results && results.total> 1 && (
                <p
                  className="text-xs text-ink-faint mb-4"
                  style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}
>
                  {results.total} votos registrados
                  {results.confidence < 0.45 && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded text-amber"
                      style={{ backgroundColor: "#C8935A18", fontSize: "0.6rem" }}
>
                      Resonancia polarizante
                    </span>
                  )}
                  {results.confidence> 0.7 && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${tribe.color}18`,
                        color: "var(--album-ink)",
                        fontSize: "0.6rem",
                      }}
>
                      Alta coincidencia colectiva
                    </span>
                  )}
                </p>
              )}
              <button
                onClick={handleNext}
                className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
                style={{ fontFamily: "var(--font-technical)" }}
>
                Siguiente pregunta →
              </button>
            </div>
          )}
        </>
      </div>
    </div>
  );
}
