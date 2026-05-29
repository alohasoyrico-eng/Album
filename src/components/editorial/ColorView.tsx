"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ColorResonance, Emotion, Artwork, TypographyResonance } from "@/types";
import { COLORS, COLOR_MAP } from "@/data/colors/colorResonance";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { trackEvent } from "@/lib/analytics";
import { ResonanceProfile } from "./ResonanceProfile";
import { HellerRanking } from "./HellerRanking";
import { deriveTypeSet, typeSetToCssVars } from "@/lib/typeset";
import { deriveTexture } from "@/lib/emotionTexture";
import { resonateFrom } from "@/lib/resonance-engine";
import { inkVars, blendHex } from "@/lib/contrast";
import { deriveMotion, motionCssVars } from "@/lib/emotionMotion";
import { resolveColor } from "@/data/colors/colors-claims";
import { useReadContext } from "@/lib/ReadContextProvider";

interface ColorViewProps {
  color: ColorResonance;
  primaryEmotions: Emotion[];
  contradictoryEmotions: Emotion[];
  resonantEmotions: Emotion[];
  resonantArtworks: Artwork[];
  resonantFonts: TypographyResonance[];
}

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export function ColorView({
  color,
  primaryEmotions,
  contradictoryEmotions,
  resonantEmotions,
  resonantArtworks,
  resonantFonts,
}: ColorViewProps) {
  useEffect(() => {
    trackEvent("editorial_page_opened", { entry: "color", colorId: color.id });
  }, [color.id]);

  // ─── Lens-aware reads through claims ──────────────────────────────────
  const readCtx = useReadContext();
  const resolvedColor = resolveColor(color.id, { lens: readCtx.lens });
  const liveDescription = resolvedColor?.description ?? color.description;
  const liveHellerQuote = resolvedColor?.hellerQuote ?? color.hellerQuote;
  const liveNameEs = resolvedColor?.nameEs ?? color.nameEs;

  // ─── Emergent typeset + texture from the colour's resonance ──────────
  const typeSet = useMemo(() => deriveTypeSet(color.resonance), [color.resonance]);
  const typeVars = useMemo(() => typeSetToCssVars(typeSet), [typeSet]);
  const titleFont = typeSet.display;
  const titleFontFamily = titleFont?.googleFontFamily ?? "Cormorant Garamond";

  const emergentPalette = useMemo(
    () => resonateFrom(color.resonance, { kinds: ["color"], limit: 12, mode: "expected" })
      .map((h) => COLOR_MAP.get(h.entity.id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c) && c!.id !== color.id),
    [color.resonance, color.id],
  );

  const texture = useMemo(
    () => deriveTexture(color.resonance, emergentPalette),
    [color.resonance, emergentPalette],
  );
  const effectiveBg = useMemo(() => blendHex(texture.baseColor, texture.surfaceTint, 0.35), [texture]);
  const inkOverrides = useMemo(() => inkVars(effectiveBg), [effectiveBg]);
  const motionPattern = useMemo(() => deriveMotion(color.resonance), [color.resonance]);
  const motionVars = useMemo(() => motionCssVars(motionPattern), [motionPattern]);

  // Find prev/next color in the appreciated rank order
  const ordered = [...COLORS].sort(
    (a, b) => (a.appreciatedRank ?? 99) - (b.appreciatedRank ?? 99),
  );
  const idx = ordered.findIndex((c) => c.id === color.id);
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  return (
    <div
      className="relative min-h-screen bg-atmospheric overflow-hidden"
      style={{ paddingTop: "80px", backgroundColor: texture.baseColor, ...typeVars, ...inkOverrides, ...motionVars }}
    >
      {/* Generative texture stack */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: texture.background }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: texture.overlay, mixBlendMode: texture.overlayBlend, opacity: 0.9 }}
        aria-hidden
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0} className="mb-16">
          <p
            className="text-xs text-ink-faint mb-3"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.25em" }}
          >
            ATLAS CROMÁTICO
          </p>
          <div className="flex items-start gap-8 mb-6 flex-wrap">
            <div
              className="w-32 h-32 rounded-2xl flex-shrink-0"
              style={{
                backgroundColor: color.hex,
                boxShadow: `0 20px 80px -10px ${color.hex}80, 0 0 40px ${color.hex}40`,
                border: color.hex.toLowerCase() === "#f5f2ec" ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            />
            <div className="flex-1 min-w-0">
              <h1
                className="text-6xl md:text-8xl text-ink leading-[0.9] mb-3"
                style={{
                  fontFamily: `"${titleFontFamily}", "Cormorant Garamond", serif`,
                  fontWeight: 300,
                  letterSpacing: "-0.04em",
                  textShadow: `0 0 40px ${color.hex}55`,
                }}
              >
                {liveNameEs}
              </h1>
              <p
                className="text-xl text-ink-muted mb-2"
                style={{ fontFamily: "var(--font-editorial)", fontStyle: "italic" }}
              >
                {color.name}
              </p>
              <div
                className="text-xs text-ink-faint flex flex-wrap gap-4 mt-4"
                style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
              >
                <span>{color.hex.toUpperCase()}</span>
                <span>HSL({color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%)</span>
                {color.appreciatedRank && <span>· #{color.appreciatedRank} APRECIADO</span>}
                {color.lessAppreciatedRank && <span>· #{color.lessAppreciatedRank} RECHAZADO</span>}
              </div>
            </div>
          </div>

          <p
            className="text-lg text-ink-muted/85 italic leading-relaxed max-w-2xl"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            {liveDescription}
          </p>
        </motion.div>

        {/* ─── Heller quote (pull-quote) ──────────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mb-16"
        >
          <figure className="relative pl-6 border-l-2" style={{ borderColor: `${color.hex}80` }}>
            <blockquote
              className="text-2xl md:text-3xl text-ink/90 leading-snug mb-3"
              style={{ fontFamily: "var(--font-literary)", fontStyle: "italic", fontWeight: 300 }}
            >
              "{liveHellerQuote}"
            </blockquote>
            <figcaption
              className="text-xs text-ink-faint"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
            >
              — EVA HELLER, PSICOLOGÍA DEL COLOR
            </figcaption>
          </figure>
        </motion.section>

        {/* ─── Cultural meanings + Symbolism ──────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mb-16 grid md:grid-cols-2 gap-8"
        >
          <div>
            <h2
              className="text-xs text-ink-faint mb-4"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              SIGNIFICADOS CULTURALES
            </h2>
            <div className="flex flex-wrap gap-2">
              {color.culturalMeanings.map((m) => (
                <span
                  key={m}
                  className="text-sm px-3 py-1 rounded-full text-ink/80"
                  style={{
                    backgroundColor: `${color.hex}15`,
                    border: `1px solid ${color.hex}30`,
                    fontFamily: "var(--font-editorial)",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h2
              className="text-xs text-ink-faint mb-4"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              SIMBOLISMO
            </h2>
            <div className="flex flex-wrap gap-2">
              {color.symbolism.map((s) => (
                <span
                  key={s}
                  className="text-sm px-3 py-1 rounded-full text-ink-muted/70"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "var(--font-editorial)",
                    fontStyle: "italic",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ─── Resonance profile ──────────────────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mb-16"
        >
          <h2
            className="text-xs text-ink-faint mb-6"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
          >
            PERFIL DE RESONANCIA
          </h2>
          <ResonanceProfile resonance={color.resonance} color={color.hex} />
        </motion.section>

        {/* ─── Heller ranking focused on this color ───────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mb-16"
        >
          <HellerRanking focusColorId={color.id} title={`${color.nameEs} en el ranking de Heller`} />
        </motion.section>

        {/* ─── Primary emotions ───────────────────────────────────────── */}
        {primaryEmotions.length > 0 && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-2"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              EMOCIONES PRIMARIAS
            </h2>
            <p
              className="text-sm text-ink-muted/70 italic mb-5 max-w-xl"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              Las emociones que este color encarna con mayor coincidencia colectiva.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {primaryEmotions.map((emo) => {
                const tribe = TRIBE_MAP.get(emo.tribe);
                return (
                  <Link
                    key={emo.id}
                    href={`/emotion/${emo.id}`}
                    className="group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300"
                    style={{
                      borderColor: `${color.hex}20`,
                      backgroundColor: `${color.hex}06`,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300 group-hover:scale-125"
                      style={{
                        backgroundColor: tribe?.color ?? color.hex,
                        boxShadow: `0 0 10px ${tribe?.color ?? color.hex}80`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-base text-ink/90 group-hover:text-ink transition-colors"
                        style={{ fontFamily: "var(--font-editorial)" }}
                      >
                        {emo.name}
                      </p>
                      {tribe && (
                        <p
                          className="text-[0.6rem] text-ink-faint mt-0.5"
                          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
                        >
                          {tribe.name.toUpperCase()}
                        </p>
                      )}
                    </div>
                    <span className="text-ink-faint group-hover:text-ink transition-colors text-sm">→</span>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ─── Contradictory + resonant emotions ──────────────────────── */}
        {(contradictoryEmotions.length > 0 || resonantEmotions.length > 0) && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={6}
            className="mb-16 grid md:grid-cols-2 gap-8"
          >
            {contradictoryEmotions.length > 0 && (
              <div>
                <h2
                  className="text-xs text-ink-faint mb-3"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                >
                  EMOCIONES CONTRADICTORIAS
                </h2>
                <p
                  className="text-xs text-ink-muted/65 italic mb-4"
                  style={{ fontFamily: "var(--font-literary)" }}
                >
                  Emociones que este color rara vez evoca; relación de tensión semántica.
                </p>
                <div className="flex flex-wrap gap-2">
                  {contradictoryEmotions.map((emo) => (
                    <Link
                      key={emo.id}
                      href={`/emotion/${emo.id}`}
                      className="text-sm px-3 py-1 rounded-full text-ink-muted/70 hover:text-ink transition-colors"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontFamily: "var(--font-editorial)",
                        fontStyle: "italic",
                      }}
                    >
                      {emo.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {resonantEmotions.length > 0 && (
              <div>
                <h2
                  className="text-xs text-ink-faint mb-3"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                >
                  OTRAS RESONANCIAS
                </h2>
                <p
                  className="text-xs text-ink-muted/65 italic mb-4"
                  style={{ fontFamily: "var(--font-literary)" }}
                >
                  Emociones que reconocen este color como parte de su atmósfera.
                </p>
                <div className="flex flex-wrap gap-2">
                  {resonantEmotions.slice(0, 12).map((emo) => (
                    <Link
                      key={emo.id}
                      href={`/emotion/${emo.id}`}
                      className="text-sm px-3 py-1 rounded-full text-ink/80 hover:text-ink transition-colors"
                      style={{
                        backgroundColor: `${color.hex}10`,
                        border: `1px solid ${color.hex}25`,
                        fontFamily: "var(--font-editorial)",
                      }}
                    >
                      {emo.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ─── Artworks resonating with this color ────────────────────── */}
        {resonantArtworks.length > 0 && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={7}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-2"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              ARTE RESONANTE
            </h2>
            <p
              className="text-sm text-ink-muted/70 italic mb-5 max-w-xl"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              Obras donde este color juega un papel estructural en la atmósfera.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {resonantArtworks.map((art) => (
                <article
                  key={art.id}
                  className="flex gap-4 p-4 rounded-xl border transition-all duration-300 hover:bg-white/[0.015]"
                  style={{
                    borderColor: `${color.hex}25`,
                    backgroundColor: `${color.hex}06`,
                  }}
                >
                  {art.imageUrl && (
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-16 h-20 object-cover rounded-lg opacity-80 flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm text-ink/90 leading-tight mb-1"
                      style={{ fontFamily: "var(--font-editorial)" }}
                    >
                      {art.title}
                    </p>
                    <p
                      className="text-[0.65rem] text-ink-faint mb-2"
                      style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
                    >
                      {art.artist.toUpperCase()} · {art.year}
                    </p>
                    {/* Dominant color palette extracted from the artwork */}
                    {art.dominantColors.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {art.dominantColors.slice(0, 5).map((c) => (
                          <div
                            key={c}
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: c, border: "1px solid rgba(255,255,255,0.1)" }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Resonant typography ─────────────────────────────────────── */}
        {resonantFonts.length > 0 && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={8}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-2"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              TIPOGRAFÍAS RESONANTES
            </h2>
            <p
              className="text-sm text-ink-muted/70 italic mb-5 max-w-xl"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              Tipografías que comparten emociones primarias con este color.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {resonantFonts.map((font) => (
                <div
                  key={font.id}
                  className="p-5 rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: `${color.hex}20`,
                    backgroundColor: `${color.hex}05`,
                  }}
                >
                  <p
                    className="text-3xl text-ink/95 leading-none mb-2"
                    style={{ fontFamily: `'${font.googleFontFamily}', serif`, fontWeight: 400 }}
                  >
                    {font.specimen}
                  </p>
                  <p
                    className="text-[0.65rem] text-ink-faint"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
                  >
                    {font.name.toUpperCase()} · {font.category.toUpperCase()}
                  </p>
                  <p
                    className="text-xs text-ink-muted/65 italic mt-2"
                    style={{ fontFamily: "var(--font-literary)" }}
                  >
                    {font.emotionalTone}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Navigation ─────────────────────────────────────────────── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={9}
          className="flex items-center justify-between pt-8 mt-8 border-t border-white/5"
        >
          {prev ? (
            <Link href={`/color/${prev.id}`} className="group flex items-center gap-3">
              <span className="text-ink-faint group-hover:text-ink transition-colors">←</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prev.hex }} />
                <span
                  className="text-sm text-ink/80 group-hover:text-ink transition-colors"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {prev.nameEs}
                </span>
              </div>
            </Link>
          ) : <div />}
          <Link
            href="/colors"
            className="text-xs text-ink-faint hover:text-ink transition-colors"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
          >
            ← Atlas cromático
          </Link>
          {next ? (
            <Link href={`/color/${next.id}`} className="group flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm text-ink/80 group-hover:text-ink transition-colors"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {next.nameEs}
                </span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: next.hex }} />
              </div>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </Link>
          ) : <div />}
        </motion.div>
      </div>
    </div>
  );
}
