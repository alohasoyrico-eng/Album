"use client";
import { COLORS } from "@/data/colors/colorResonance";
/**
 * Visualization of Eva Heller's 2,000-person color preference survey.
 * Each color has up to two rankings:
 *   - appreciatedRank:    1 = most appreciated (top of the survey's "favorite" list)
 *   - lessAppreciatedRank: 1 = least appreciated (top of the survey's "rejected" list)
 *
 * The component renders a mirrored bar chart:
 *   left (positive) shows appreciation strength,
 *   right (negative) shows rejection strength.
 * A color can appear in both lists (e.g. amarillo is #5 appreciated AND #6 rejected).
 *
 * The strength of each bar is computed as (max_rank - rank + 1) so the most
 * appreciated/rejected entry shows the longest bar.
 */
const APPRECIATED_MAX = 11; // 11 entries in Heller's most-appreciated list
const REJECTED_MAX = 13;    // 13 entries in Heller's least-appreciated list
interface HellerRankingProps {
  /** Optional: focus on a single color id; if omitted, shows the full chart. */
  focusColorId?: string;
  /** Title displayed at the top. Defaults to the editorial intro. */
  title?: string;
}
export function HellerRanking({ focusColorId, title }: HellerRankingProps) {
  // Sort by appreciated rank (most appreciated first), then by rejected rank
  const rows = [...COLORS].sort((a, b) => {
    const aA = a.appreciatedRank ?? 99;
    const bA = b.appreciatedRank ?? 99;
    if (aA !== bA) return aA - bA;
    return (a.lessAppreciatedRank ?? 99) - (b.lessAppreciatedRank ?? 99);
  });
  return (
    <section className="w-full">
      <header className="mb-6">
        <p
          className="text-[0.6rem] text-ink-faint mb-2"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          EVA HELLER · ENCUESTA A 2.000 PERSONAS
        </p>
        <h2
          className="text-2xl text-ink/90 mb-2"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
>
          {title ?? "Lo apreciado y lo rechazado"}
        </h2>
        <p
          className="text-sm text-ink-muted/70 italic max-w-xl"
          style={{ fontFamily: "var(--font-literary)" }}
>
          Algunos colores aparecen en ambas listas: provocan amor y rechazo a la vez. Esa ambivalencia es parte de su carga semántica.
        </p>
      </header>
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-3 pb-2 border-b border-white/5">
        <p
          className="text-[0.6rem] text-ink-faint text-right"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          MÁS APRECIADO ←
        </p>
        <p
          className="text-[0.55rem] text-ink-faint text-center min-w-[80px]"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
>
          COLOR
        </p>
        <p
          className="text-[0.6rem] text-ink-faint"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          → MÁS RECHAZADO
        </p>
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-2.5">
        {rows.map((c, i) => {
          const isFocus = focusColorId === c.id;
          const dim = focusColorId && !isFocus;
          const appWidth = c.appreciatedRank
            ? ((APPRECIATED_MAX - c.appreciatedRank + 1) / APPRECIATED_MAX) * 100
            : 0;
          const rejWidth = c.lessAppreciatedRank
            ? ((REJECTED_MAX - c.lessAppreciatedRank + 1) / REJECTED_MAX) * 100
            : 0;
          return (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4"
>
              {/* Left bar: appreciated */}
              <div className="flex items-center justify-end gap-2">
                {c.appreciatedRank ? (
                  <>
                    <span
                      className="text-[0.65rem] text-ink-faint tabular-nums"
                      style={{ fontFamily: "var(--font-technical)" }}
>
                      #{c.appreciatedRank}
                    </span>
                    <div
                      className="h-3 rounded-l-full"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: isFocus ? `0 0 16px ${c.hex}80` : `0 0 6px ${c.hex}30`,
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="text-[0.6rem] text-ink-faint/50 italic"
                    style={{ fontFamily: "var(--font-editorial)" }}
>
                    no figura
                  </span>
                )}
              </div>
              {/* Center: color name */}
              <div className="flex items-center gap-2 min-w-[80px] justify-center">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: isFocus ? `0 0 12px ${c.hex}` : "none",
                    border: c.hex.toLowerCase() === "#f5f2ec" ? "1px solid rgba(255,255,255,0.15)" : "none",
                  }}
                />
                <span
                  className="text-xs text-ink/85 whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-editorial)",
                    fontWeight: isFocus ? 500 : 400,
                  }}
>
                  {c.nameEs}
                </span>
              </div>
              {/* Right bar: rejected */}
              <div className="flex items-center gap-2">
                {c.lessAppreciatedRank ? (
                  <>
                    <div
                      className="h-3 rounded-r-full"
                      style={{
                        backgroundColor: c.hex,
                        opacity: 0.45,
                        boxShadow: isFocus ? `0 0 16px ${c.hex}80` : "none",
                      }}
                    />
                    <span
                      className="text-[0.65rem] text-ink-faint tabular-nums"
                      style={{ fontFamily: "var(--font-technical)" }}
>
                      #{c.lessAppreciatedRank}
                    </span>
                  </>
                ) : (
                  <span
                    className="text-[0.6rem] text-ink-faint/50 italic"
                    style={{ fontFamily: "var(--font-editorial)" }}
>
                    no figura
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legend / caption */}
      <p
        className="text-[0.65rem] text-ink-faint/70 mt-6 leading-relaxed max-w-xl"
        style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.04em" }}
>
        Encuesta a 2.000 hombres y mujeres entre los 14 y 97 años en Eva Heller, <em>Psicología del color</em>.
        La longitud de cada barra refleja la posición en su ranking (más larga = posición más alta).
      </p>
    </section>
  );
}
