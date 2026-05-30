"use client";
import type { ResonanceAxes } from "@/types";
const AXIS_LABELS: Record<keyof ResonanceAxes, { es: string; low: string; high: string }> = {
  energy:      { es: "Energía",     low: "Dormida",     high: "Explosiva" },
  temperature: { es: "Temperatura", low: "Glacial",     high: "Incandescente" },
  tension:     { es: "Tensión",     low: "Liberada",    high: "Contenida" },
  density:     { es: "Densidad",    low: "Etérea",      high: "Densa" },
  movement:    { es: "Movimiento",  low: "Estática",    high: "Cinética" },
  temporality: { es: "Temporalidad",low: "Atemporal",   high: "Efímera" },
  humanity:    { es: "Humanidad",   low: "Abstracta",   high: "Profundamente humana" },
  clarity:     { es: "Claridad",    low: "Oscura",      high: "Cristalina" },
  intimacy:    { es: "Intimidad",   low: "Distante",    high: "Íntima" },
  control:     { es: "Control",     low: "Caótica",     high: "Controlada" },
};
interface Props {
  resonance: ResonanceAxes;
  color: string;
}
export function ResonanceProfile({ resonance, color }: Props) {
  return (
    <div className="grid gap-3">
      {(Object.keys(AXIS_LABELS) as (keyof ResonanceAxes)[]).map((key, i) => {
        const value = resonance[key];
        const info = AXIS_LABELS[key];
        return (
          <div key={key} className="flex items-center gap-4">
            <div className="w-24 text-right flex-shrink-0">
              <span
                className="text-xs text-ink-faint"
                style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem", letterSpacing: "0.05em" }}
>
                {info.es.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 relative">
              <div className="h-px bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
              {/* Value indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="w-6 flex-shrink-0 text-right">
              <span
                className="text-xs text-ink-faint"
                style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}
>
                {value}
              </span>
            </div>
          </div>
        );
      })}
      {/* Semantic descriptors */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
        {(Object.keys(resonance) as (keyof ResonanceAxes)[])
          .filter((k) => resonance[k]> 70 || resonance[k] < 30)
          .map((k) => {
            const value = resonance[k];
            const info = AXIS_LABELS[k];
            const label = value> 70 ? info.high : info.low;
            return (
              <span
                key={k}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${color}${value> 70 ? "18" : "0A"}`,
                  color: value> 70 ? color : "var(--album-ink-muted)",
                  border: `1px solid ${color}${value> 70 ? "30" : "18"}`,
                  fontFamily: "var(--font-technical)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.06em",
                }}
>
                {label}
              </span>
            );
          })}
      </div>
    </div>
  );
}
