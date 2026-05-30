"use client";
import type { ColorRecipe } from "@/lib/chromatics";
interface ChromaticBreakdownProps {
  recipe: ColorRecipe;
  tribeName: string;
  emotionName: string;
}
/**
 * Visualizes how an emotion's color is built — exposes the recipe.
 *
 * The bar reads left to right: tribal base + each ingredient + result.
 * Each ingredient is labeled with its axis driver and a short reason so the
 * logic is legible: "Densidad alta → añade negro", "Temperatura cálida →
 * añade amarillo solar", etc.
 *
 * Mixing happens in Oklab inside `chromatics.ts`, so the displayed result
 * accounts for perceptual blending (red+green = brown, not gray).
 */
export function ChromaticBreakdown({ recipe, tribeName, emotionName }: ChromaticBreakdownProps) {
  const totalW = recipe.totalWeight;
  const basePct = (recipe.tribalBase.weight / totalW) * 100;
  return (
    <div className="rounded-2xl border border-album p-7 bg-[color:rgba(var(--album-ink-rgb),0.018)]">
      <header className="mb-5">
        <p
          className="text-[0.6rem] text-ink-faint mb-2"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          CÓMO SE CONSTRUYE ESTE COLOR
        </p>
        <p
          className="text-sm text-ink-muted/75 italic leading-relaxed max-w-xl"
          style={{ fontFamily: "var(--font-literary)" }}
>
          El color de {emotionName} no es un valor arbitrario. Es una receta
          sobre el color tribal de {tribeName}, modulada por los ejes de su
          resonancia. Se lee como una mezcla de pigmentos.
        </p>
      </header>
      {/* ─── Stacked recipe bar ──────────────────────────────────────── */}
      <div className="mb-6">
        <p
          className="text-[0.55rem] text-ink-faint mb-2"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          MEZCLA
        </p>
        <div className="flex h-10 rounded-lg overflow-hidden border border-album">
          {/* Tribal base */}
          <div
            className="relative group flex items-center justify-center"
            style={{ backgroundColor: recipe.tribalBase.hex }}
            title={`Base tribal ${tribeName}: ${basePct.toFixed(0)}%`}
>
            <span
              className="text-[0.55rem] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontFamily: "var(--font-technical)",
                letterSpacing: "0.1em",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }}
>
              {Math.round(basePct)}%
            </span>
          </div>
          {/* Each ingredient */}
          {recipe.ingredients.map((ing, i) => {
            const pct = (ing.weight / totalW) * 100;
            return (
              <div
                key={`${ing.axisDriver}-${i}`}
                className="relative group"
                style={{ backgroundColor: ing.hex }}
                title={`${ing.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>
      {/* ─── Ingredient legend ──────────────────────────────────────── */}
      <div className="mb-6">
        <p
          className="text-[0.55rem] text-ink-faint mb-3"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
          INGREDIENTES
        </p>
        <div className="grid gap-2.5">
          {/* Tribal base entry */}
          <div
            className="flex items-center gap-3 text-sm"
>
            <div
              className="w-5 h-5 rounded-md flex-shrink-0 border border-album"
              style={{ backgroundColor: recipe.tribalBase.hex }}
            />
            <span
              className="text-[0.6rem] text-ink-faint w-12 tabular-nums"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
>
              {Math.round(basePct)}%
            </span>
            <span
              className="text-ink/90"
              style={{ fontFamily: "var(--font-editorial)" }}
>
              base tribal {tribeName.toLowerCase()}
            </span>
          </div>
          {recipe.ingredients.map((ing, i) => {
            const pct = (ing.weight / totalW) * 100;
            return (
              <div
                key={`leg-${ing.axisDriver}-${i}`}
                className="flex items-start gap-3"
>
                <div
                  className="w-5 h-5 rounded-md flex-shrink-0 border border-album mt-0.5"
                  style={{ backgroundColor: ing.hex }}
                />
                <span
                  className="text-[0.6rem] text-ink-faint w-12 tabular-nums mt-1"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
>
                  {pct.toFixed(1)}%
                </span>
                <div className="flex-1">
                  <p
                    className="text-sm text-ink/90"
                    style={{ fontFamily: "var(--font-editorial)" }}
>
                    {ing.name}
                  </p>
                  <p
                    className="text-xs text-ink-muted/65 italic mt-0.5"
                    style={{ fontFamily: "var(--font-literary)" }}
>
                    {ing.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ─── Result ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-5 border-t border-album">
        <div
          className="w-14 h-14 rounded-xl flex-shrink-0"
          style={{
            backgroundColor: recipe.finalHex,
            boxShadow: `0 8px 24px -6px ${recipe.finalHex}A0`,
          }}
        />
        <div>
          <p
            className="text-[0.55rem] text-ink-faint mb-1"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
>
            COLOR RESULTANTE
          </p>
          <p
            className="text-lg text-ink/95"
            style={{ fontFamily: "var(--font-editorial)" }}
>
            <span style={{ fontFamily: "var(--font-technical)" }}>{recipe.finalHex.toUpperCase()}</span>
            <span className="text-ink-muted ml-3" style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}>
              — la firma cromática de {emotionName.toLowerCase()}
            </span>
          </p>
        </div>
      </div>
      {recipe.ingredients.length === 0 && (
        <p
          className="text-xs text-ink-muted/60 italic mt-4"
          style={{ fontFamily: "var(--font-literary)" }}
>
          La resonancia de esta emoción se mantiene cerca del centro neutral
          en todos los ejes, por lo que el color preserva la identidad tribal
          casi sin modificación.
        </p>
      )}
    </div>
  );
}
