"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Clan, Tribe, Emotion } from "@/types";
import { trackEvent } from "@/lib/analytics";
import { ResonanceProfile } from "./ResonanceProfile";
import { resolveClan } from "@/data/ontology/clans-claims";
import { useReadContext } from "@/lib/ReadContextProvider";
import type { ClanPageData } from "@/lib/server/clanPageData";

// Same lazy split as EmotionDetail — these chunks no longer pull the
// engine since they receive pre-computed data via props.
const EmergentResonance = dynamic(
  () => import("./EmergentResonance").then((m) => m.EmergentResonance),
  { ssr: true },
);
const PathwayDrift = dynamic(
  () => import("./PathwayDrift").then((m) => m.PathwayDrift),
  { ssr: true },
);

interface ClanViewProps {
  pageData: ClanPageData;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export function ClanView({ pageData }: ClanViewProps) {
  const { clan, tribe, canonical, clanEmotions, siblings, prev, next, presentation } = pageData;
  const {
    typeSet,
    typeVars,
    titleFontFamily,
    emergentPalette,
    texture,
    inkOverrides,
    motionPattern,
    motionVars,
    emergentHits,
    pathwayInitialCandidates,
  } = presentation;
  const titleFont = typeSet.display;
  const accent = emergentPalette[0]?.hex ?? tribe.color;
  const hasResonance = clanEmotions.length > 0 || canonical != null;

  useEffect(() => {
    trackEvent("editorial_page_opened", { entry: "clan", clanId: clan.id });
  }, [clan.id]);

  // ─── Lens-aware reads ─────────────────────────────────────────────────
  const readCtx = useReadContext();
  const resolvedClan = resolveClan(clan.id, { lens: readCtx.lens });
  const liveDescription = resolvedClan?.description ?? clan.description;
  const liveName = resolvedClan?.name ?? clan.name;
  const liveFeelings = resolvedClan?.feelings ?? clan.feelings;
  const liveAntonyms = resolvedClan?.antonyms ?? clan.antonyms;

  return (
    <div
      className="relative min-h-screen bg-atmospheric overflow-hidden"
      style={{ paddingTop: "80px", backgroundColor: texture.baseColor, ...typeVars, ...inkOverrides, ...motionVars }}
    >
      {/* Generative texture — gradient stack + overlay */}
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
        {/* ─── Breadcrumb + Tribe chip ─────────────────────────────────── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0} className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Link
              href={`/tribe/${tribe.id}`}
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
              style={{
                borderColor: `${tribe.color}40`,
                backgroundColor: `${tribe.color}12`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full transition-all duration-300 group-hover:scale-125"
                style={{ backgroundColor: tribe.color, boxShadow: `0 0 10px ${tribe.color}80` }}
              />
              <span
                className="text-xs"
                style={{
                  fontFamily: "var(--font-technical)",
                  color: tribe.color,
                  letterSpacing: "0.1em",
                }}
              >
                TRIBU · {tribe.name.toUpperCase()}
              </span>
            </Link>
            <p
              className="text-[0.6rem] text-ink-faint"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              CLAN · ONTOLOGÍA MARINA
            </p>
          </div>
        </motion.div>

        {/* ─── Title ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={1} className="mb-16">
          <h1
            className="text-5xl md:text-7xl text-ink leading-[0.95] mb-6"
            style={{
              fontFamily: `"${titleFontFamily}", "Cormorant Garamond", serif`,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              textShadow: `0 0 32px ${accent}33`,
            }}
          >
            {liveName}
          </h1>
          {titleFont && (
            <p
              className="text-[0.6rem] text-ink-faint mb-3"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
              title={titleFont.description}
            >
              VOZ TIPOGRÁFICA · {titleFont.name.toUpperCase()}
            </p>
          )}
          <p
            className="text-lg text-ink-muted/85 italic leading-relaxed max-w-2xl"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            {liveDescription}
          </p>
          <p
            className="text-xs text-ink-faint mt-6"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
          >
            {liveFeelings.length} SENTIMIENTOS · {liveAntonyms.length} ANTÓNIMOS
            {clanEmotions.length > 0 && ` · ${clanEmotions.length} EMOCIÓN${clanEmotions.length > 1 ? "ES" : ""} CANÓNICA${clanEmotions.length > 1 ? "S" : ""}`}
          </p>

          {/* Emergent palette derived from the clan's centroid. The 224-colour
              catalogue is queried by cosine similarity — what the clan looks
              like, not what the tribe paints it. */}
          {emergentPalette.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-1.5">
              {emergentPalette.map((c) => (
                <span
                  key={c.id}
                  className="block h-6 w-6 rounded-sm transition-transform hover:scale-125"
                  style={{ backgroundColor: c.hex, boxShadow: `0 0 12px ${c.hex}55` }}
                  title={`${c.name} · ${c.hex}`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── Sentimientos (the lexical layer) ──────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mb-16"
        >
          <h2
            className="text-xs text-ink-faint mb-3"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
          >
            SENTIMIENTOS
          </h2>
          <p
            className="text-sm text-ink-muted/70 italic mb-6 max-w-xl"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            La capa léxica del clan — las palabras del español que comparten esta atmósfera.
          </p>
          <div
            className="rounded-2xl border p-7"
            style={{
              borderColor: `${tribe.color}25`,
              backgroundColor: `${tribe.color}06`,
            }}
          >
            <div className="flex flex-wrap gap-x-3 gap-y-2.5">
              {liveFeelings.map((f, i) => (
                <motion.span
                  key={f}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xl text-ink/90"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {f}
                  {i < liveFeelings.length - 1 && (
                    <span className="text-ink-faint ml-3" style={{ fontFamily: "var(--font-literary)" }}>·</span>
                  )}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ─── Antónimos ──────────────────────────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mb-16"
        >
          <h2
            className="text-xs text-ink-faint mb-3"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
          >
            ANTÓNIMOS
          </h2>
          <p
            className="text-sm text-ink-muted/70 italic mb-6 max-w-xl"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            Las direcciones opuestas — adonde este clan no quiere ir.
          </p>
          <div className="flex flex-wrap gap-2">
            {liveAntonyms.map((a) => (
              <span
                key={a}
                className="text-base text-ink-muted/80 italic px-3 py-1 rounded-full"
                style={{
                  fontFamily: "var(--font-literary)",
                  backgroundColor: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </motion.section>

        {/* ─── Canonical emotion (if any) ─────────────────────────────── */}
        {canonical && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-3"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              EMOCIÓN CANÓNICA
            </h2>
            <p
              className="text-sm text-ink-muted/70 italic mb-6 max-w-xl"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              La emoción del catálogo editorial que representa este clan en su forma más desarrollada.
            </p>
            <Link
              href={`/emotion/${canonical.id}`}
              className="group block rounded-2xl border p-7 transition-all duration-300 hover:bg-white/[0.015]"
              style={{
                borderColor: `${tribe.color}30`,
                backgroundColor: `${tribe.color}0A`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-3xl text-ink/95 leading-tight mb-2"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.02em" }}
                  >
                    {canonical.name}
                  </h3>
                  <p
                    className="text-xs text-ink-faint"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
                  >
                    {canonical.nameEn.toUpperCase()}
                  </p>
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-2"
                  style={{ backgroundColor: tribe.color, boxShadow: `0 0 12px ${tribe.color}80` }}
                />
              </div>
              <p
                className="text-base text-ink-muted/80 italic leading-relaxed mb-5"
                style={{ fontFamily: "var(--font-literary)" }}
              >
                {canonical.poeticIntro}
              </p>
              <ResonanceProfile resonance={canonical.resonance} color={tribe.color} />
              <p
                className="text-xs mt-5 transition-colors duration-200 group-hover:opacity-80"
                style={{
                  color: tribe.color,
                  fontFamily: "var(--font-technical)",
                  letterSpacing: "0.08em",
                }}
              >
                EXPLORAR EMOCIÓN COMPLETA →
              </p>
            </Link>
          </motion.section>
        )}

        {/* ─── Other emotions in this clan ─────────────────────────────── */}
        {clanEmotions.length > 1 && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-3"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              OTRAS EMOCIONES DEL CLAN
            </h2>
            <div className="flex flex-wrap gap-2">
              {clanEmotions
                .filter((e) => e.id !== canonical?.id)
                .map((e) => (
                  <Link
                    key={e.id}
                    href={`/emotion/${e.id}`}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
                    style={{
                      borderColor: `${tribe.color}30`,
                      backgroundColor: `${tribe.color}08`,
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-150"
                      style={{ backgroundColor: tribe.color }}
                    />
                    <span
                      className="text-sm text-ink/85"
                      style={{ fontFamily: "var(--font-editorial)" }}
                    >
                      {e.name}
                    </span>
                  </Link>
                ))}
            </div>
          </motion.section>
        )}

        {/* ─── Emergent resonance for the clan ──────────────────────────── */}
        {hasResonance && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-15% 0px" }}
            custom={5.5}
          >
            <EmergentResonance
              hitsByMode={emergentHits}
              accentColor={tribe.color}
              title="RESONANCIA EMERGENTE · CLAN"
            />
          </motion.div>
        )}

        {/* ─── Multi-hop drift from the clan's centroid ─────────────────── */}
        {hasResonance && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-15% 0px" }}
            custom={5.7}
          >
            <PathwayDrift
              startId={clan.id}
              startLabel={`el clan ${clan.name}`}
              initialCandidates={pathwayInitialCandidates}
              accentColor={tribe.color}
            />
          </motion.div>
        )}

        {/* ─── Sibling clans (others in the same tribe) ────────────────── */}
        {siblings.length > 1 && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={6}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-3"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              CLANES HERMANOS · {tribe.name.toUpperCase()}
            </h2>
            <p
              className="text-sm text-ink-muted/70 italic mb-6 max-w-xl"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              Otros clanes de la misma tribu — variaciones de la misma experiencia fundamental.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {siblings
                .filter((s) => s.id !== clan.id)
                .map((s) => (
                  <Link
                    key={s.id}
                    href={`/clan/${s.id}`}
                    className="group block p-4 rounded-xl border transition-all duration-300 hover:bg-white/[0.015]"
                    style={{
                      borderColor: `${tribe.color}20`,
                      backgroundColor: `${tribe.color}05`,
                    }}
                  >
                    <p
                      className="text-lg text-ink/90 mb-1 transition-colors group-hover:text-ink"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
                    >
                      {s.name}
                    </p>
                    <p
                      className="text-xs text-ink-muted/70 line-clamp-2"
                      style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}
                    >
                      {s.description}
                    </p>
                    <p
                      className="text-[0.6rem] text-ink-faint mt-2"
                      style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
                    >
                      {s.feelings.length} SENTIMIENTOS
                    </p>
                  </Link>
                ))}
            </div>
          </motion.section>
        )}

        {/* ─── Navigation (prev/next clan in tribe) ────────────────────── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={7}
          className="flex items-center justify-between pt-8 mt-8 border-t border-white/5 flex-wrap gap-4"
        >
          {prev ? (
            <Link href={`/clan/${prev.id}`} className="group flex items-center gap-3">
              <span className="text-ink-faint group-hover:text-ink transition-colors">←</span>
              <div className="flex flex-col">
                <span
                  className="text-[0.55rem] text-ink-faint"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                >
                  CLAN ANTERIOR
                </span>
                <span
                  className="text-sm text-ink/80 group-hover:text-ink transition-colors"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {prev.name}
                </span>
              </div>
            </Link>
          ) : <div />}
          <Link
            href={`/tribe/${tribe.id}`}
            className="text-xs text-ink-faint hover:text-ink transition-colors"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
          >
            ← {tribe.name}
          </Link>
          {next ? (
            <Link href={`/clan/${next.id}`} className="group flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span
                  className="text-[0.55rem] text-ink-faint"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                >
                  CLAN SIGUIENTE
                </span>
                <span
                  className="text-sm text-ink/80 group-hover:text-ink transition-colors"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {next.name}
                </span>
              </div>
              <span className="text-ink-faint group-hover:text-ink transition-colors">→</span>
            </Link>
          ) : <div />}
        </motion.div>
      </div>
    </div>
  );
}
