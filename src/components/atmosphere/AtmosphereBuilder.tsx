"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTIONS } from "@/data/ontology/emotions";
import { COLORS } from "@/data/colors/colorResonance";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { ARTWORKS } from "@/data/seed/artworks";
import { TRACKS } from "@/data/seed/music";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { generateAtmosphere } from "@/lib/resonance";
import { useAtmosphereBuilderStore, useCollectionsStore } from "@/lib/store";
import type { Atmosphere } from "@/types";
import Link from "next/link";
import { ResonanceProfile } from "@/components/editorial/ResonanceProfile";
import { deriveTypeSet, typeSetToCssVars } from "@/lib/typeset";
import { deriveTexture } from "@/lib/emotionTexture";

export function AtmosphereBuilder() {
  const {
    selectedEmotion, selectedColor, selectedFont,
    setEmotion, setColor, setFont,
    generatedAtmosphere, setGeneratedAtmosphere, isGenerating, setIsGenerating,
  } = useAtmosphereBuilderStore();

  const { addAtmosphere, getDefaultCollection } = useCollectionsStore();
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState<"emotion" | "color" | "font" | "result">("emotion");

  const canGenerate = selectedEmotion && selectedColor && selectedFont;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));

    const result = generateAtmosphere(selectedEmotion, selectedColor, selectedFont);
    const atmosphere: Atmosphere = {
      id: `atm_${Date.now()}`,
      name: result.name,
      poeticDescription: result.poeticDescription,
      emotion: selectedEmotion,
      color: selectedColor,
      typography: selectedFont,
      resonanceProfile: result.resonanceProfile,
      atmosphereTags: result.tags,
      createdAt: new Date().toISOString(),
      isSaved: false,
    };

    setGeneratedAtmosphere(atmosphere);
    setIsGenerating(false);
    setStep("result");
  };

  const handleSave = () => {
    if (!generatedAtmosphere) return;
    const col = getDefaultCollection();
    addAtmosphere(col.id, { ...generatedAtmosphere, isSaved: true });
    setSaved(true);
  };

  const emotion = selectedEmotion ? EMOTIONS.find((e) => e.id === selectedEmotion) : null;
  const color = selectedColor ? COLORS.find((c) => c.id === selectedColor) : null;
  const font = selectedFont ? TYPOGRAPHY.find((t) => t.id === selectedFont) : null;
  const tribe = emotion?.tribe ? TRIBE_MAP.get(emotion.tribe) : null;

  // Dynamic typeset + texture from the currently-selected emotion (or
  // color if no emotion yet). The whole atmosphere page re-typesets and
  // re-textures live as the user makes choices.
  const resonanceSource = emotion?.resonance ?? color?.resonance ?? null;
  const liveTypeSet = resonanceSource ? deriveTypeSet(resonanceSource) : null;
  const liveTypeVars = liveTypeSet ? typeSetToCssVars(liveTypeSet) : {};
  const liveTexture = resonanceSource
    ? deriveTexture(resonanceSource, color ? [color] : [])
    : null;

  return (
    <div className="min-h-screen bg-atmospheric relative" style={{ paddingTop: "80px", ...liveTypeVars }}>
      {/* Dynamic background — texture stack while resonance is known */}
      {liveTexture ? (
        <>
          <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
               style={{ background: liveTexture.background }} aria-hidden />
          <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
               style={{ background: liveTexture.overlay, mixBlendMode: liveTexture.overlayBlend, opacity: 0.85 }} aria-hidden />
        </>
      ) : (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-all duration-1000"
          style={{
            background: color
              ? `radial-gradient(ellipse at 30% 30%, ${color.hex}12 0%, transparent 50%)`
              : "transparent",
          }}
        />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="text-xs text-ink-faint mb-3" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}>
            CONSTRUCTOR DE ATMÓSFERAS
          </p>
          <h1
            className="text-5xl md:text-6xl text-ink leading-none mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.03em" }}
          >
            Ensambla el clima
            <br />
            <span className="text-ink-muted/50">de lo que sientes</span>
          </h1>
          <p
            className="text-ink-muted/60 max-w-xl"
            style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}
          >
            Elige una emoción, un color y una tipografía. El sistema generará una atmósfera única con su nombre, perfil de resonancia y descripción poética.
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-10">
          {(["emotion", "color", "font"] as const).map((s, i) => (
            <button
              key={s}
              onClick={() => { setStep(s); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: step === s ? "rgba(255,255,255,0.06)" : "transparent",
                border: `1px solid ${step === s ? "rgba(255,255,255,0.12)" : "transparent"}`,
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: [selectedEmotion, selectedColor, selectedFont][i] ? (tribe?.color ?? "#C8935A") : "rgba(255,255,255,0.08)",
                  color: [selectedEmotion, selectedColor, selectedFont][i] ? "#050508" : "var(--album-ink-faint)",
                  fontSize: "0.6rem",
                }}
              >
                {i + 1}
              </span>
              <span
                className="text-xs"
                style={{
                  fontFamily: "var(--font-technical)",
                  color: step === s ? "var(--album-ink)" : "var(--album-ink-faint)",
                  fontSize: "0.7rem",
                }}
              >
                {["Emoción", "Color", "Tipografía"][i]}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "emotion" && (
            <motion.div key="emotion" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-sm text-ink-muted mb-6" style={{ fontFamily: "var(--font-editorial)" }}>
                ¿Desde qué emoción quieres construir?
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {EMOTIONS.map((e) => {
                  const t = TRIBE_MAP.get(e.tribe);
                  const isSelected = selectedEmotion === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => { setEmotion(e.id); setStep("color"); }}
                      className="p-3 rounded-xl border text-left transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        borderColor: isSelected ? `${t?.color ?? "#888"}60` : "rgba(255,255,255,0.06)",
                        backgroundColor: isSelected ? `${t?.color ?? "#888"}12` : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t?.color ?? "#888", opacity: 0.7 }} />
                        <span className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>
                          {t?.name}
                        </span>
                      </div>
                      <p className="text-sm text-ink/80" style={{ fontFamily: "var(--font-editorial)" }}>
                        {e.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === "color" && (
            <motion.div key="color" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-sm text-ink-muted mb-6" style={{ fontFamily: "var(--font-editorial)" }}>
                ¿Qué color habita esta atmósfera?
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {COLORS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setColor(c.id); setStep("font"); }}
                      className="group rounded-xl overflow-hidden border transition-all duration-300 hover:scale-[1.02]"
                      style={{ borderColor: isSelected ? `${c.hex}60` : "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-20 w-full"
                        style={{
                          backgroundColor: c.hex,
                          opacity: isSelected ? 0.7 : 0.45,
                          transition: "opacity 0.3s",
                        }}
                      />
                      <div className="p-2.5">
                        <p className="text-sm text-ink/80" style={{ fontFamily: "var(--font-editorial)" }}>{c.nameEs}</p>
                        <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>
                          {c.primaryEmotions[0]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setStep("emotion")} className="text-xs text-ink-faint hover:text-ink-muted transition-colors" style={{ fontFamily: "var(--font-technical)" }}>
                ← Cambiar emoción
              </button>
            </motion.div>
          )}

          {step === "font" && (
            <motion.div key="font" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-sm text-ink-muted mb-6" style={{ fontFamily: "var(--font-editorial)" }}>
                ¿Qué tipografía habla en esta atmósfera?
              </h2>
              <div className="grid gap-4 mb-8">
                {TYPOGRAPHY.map((t) => {
                  const isSelected = selectedFont === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setFont(t.id)}
                      className="p-4 rounded-xl border text-left transition-all duration-300"
                      style={{
                        borderColor: isSelected ? `${tribe?.color ?? "#C8935A"}50` : "rgba(255,255,255,0.06)",
                        backgroundColor: isSelected ? `${tribe?.color ?? "#C8935A"}0A` : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-ink-muted" style={{ fontFamily: "var(--font-technical)" }}>{t.name}</p>
                          <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>{t.designerEra}</p>
                        </div>
                        <span className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>
                          {t.category}
                        </span>
                      </div>
                      <p
                        className="text-lg text-ink/60"
                        style={{ fontFamily: `${t.googleFontFamily}, serif`, fontStyle: "italic" }}
                      >
                        {t.specimen}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4 items-center">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="relative px-8 py-3 rounded-full text-sm transition-all duration-300 disabled:opacity-40"
                  style={{
                    backgroundColor: tribe?.color ?? "#C8935A",
                    color: "#050508",
                    fontFamily: "var(--font-technical)",
                    boxShadow: canGenerate ? `0 0 30px ${tribe?.color ?? "#C8935A"}40` : "none",
                  }}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                      Generando…
                    </span>
                  ) : (
                    "Generar atmósfera"
                  )}
                </button>
                <button onClick={() => setStep("color")} className="text-xs text-ink-faint hover:text-ink-muted transition-colors" style={{ fontFamily: "var(--font-technical)" }}>
                  ← Cambiar color
                </button>
              </div>
            </motion.div>
          )}

          {step === "result" && generatedAtmosphere && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Atmosphere canvas */}
              <div
                className="relative overflow-hidden rounded-2xl p-8 md:p-12 mb-8 border"
                style={{
                  borderColor: `${color?.hex ?? "#888"}30`,
                  background: `
                    radial-gradient(ellipse at 20% 30%, ${color?.hex ?? "#888"}15 0%, transparent 55%),
                    radial-gradient(ellipse at 80% 70%, ${tribe?.color ?? "#C8935A"}0A 0%, transparent 50%),
                    rgba(20, 20, 32, 0.8)
                  `,
                }}
              >
                {/* Atmosphere name */}
                <div className="mb-6">
                  <p className="text-xs text-ink-faint mb-2" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}>
                    ATMÓSFERA GENERADA
                  </p>
                  <h2
                    className="text-4xl md:text-5xl text-ink leading-none mb-2"
                    style={{
                      fontFamily: font ? `${font.googleFontFamily}, serif` : "var(--font-display)",
                      fontWeight: 300,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {generatedAtmosphere.name}
                  </h2>
                </div>

                {/* Color swatch row */}
                <div className="flex gap-2 mb-6">
                  {color && <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: color.hex, opacity: 0.75 }} />}
                  {emotion && (
                    <div className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: tribe?.color ?? "#888", opacity: 0.6 }} />
                  )}
                  <div className="flex items-center gap-3 pl-2">
                    <span className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                      {emotion?.name} · {color?.nameEs} · {font?.name}
                    </span>
                  </div>
                </div>

                {/* Poetic description */}
                <p
                  className="text-base md:text-lg text-ink/60 leading-relaxed max-w-xl mb-6"
                  style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}
                >
                  {generatedAtmosphere.poeticDescription}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {generatedAtmosphere.atmosphereTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${color?.hex ?? "#888"}15`,
                        color: `${color?.hex ?? "#C8935A"}`,
                        border: `1px solid ${color?.hex ?? "#888"}25`,
                        fontFamily: "var(--font-technical)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resonance profile */}
              <div className="mb-8">
                <p className="text-xs text-ink-faint mb-4" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
                  PERFIL DE RESONANCIA COMBINADO
                </p>
                <ResonanceProfile resonance={generatedAtmosphere.resonanceProfile} color={tribe?.color ?? "#C8935A"} />
              </div>

              {/* Actions */}
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className="px-6 py-2.5 rounded-full text-sm transition-all duration-300"
                  style={{
                    backgroundColor: saved ? "rgba(255,255,255,0.06)" : (tribe?.color ?? "#C8935A"),
                    color: saved ? "var(--album-ink-muted)" : "#050508",
                    fontFamily: "var(--font-technical)",
                    boxShadow: !saved ? `0 0 20px ${tribe?.color ?? "#C8935A"}30` : "none",
                  }}
                >
                  {saved ? "✓ Guardada" : "Guardar atmósfera"}
                </button>
                <button
                  onClick={() => {
                    useAtmosphereBuilderStore.getState().reset();
                    setStep("emotion");
                    setSaved(false);
                  }}
                  className="px-6 py-2.5 rounded-full text-sm border border-white/10 text-ink-muted hover:text-ink hover:border-white/20 transition-all duration-300"
                  style={{ fontFamily: "var(--font-technical)" }}
                >
                  Nueva atmósfera
                </button>
                <Link
                  href="/collection"
                  className="px-6 py-2.5 rounded-full text-sm border border-white/6 text-ink-faint hover:text-ink-muted hover:border-white/12 transition-all duration-300"
                  style={{ fontFamily: "var(--font-technical)" }}
                >
                  Ver colección →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
