"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { TRIBES } from "@/data/ontology/tribes";
import { trackEvent } from "@/lib/analytics";
import { resolveTribe } from "@/data/ontology/tribes-claims";
import { useReadContext } from "@/lib/ReadContextProvider";
import type { TribePageData } from "@/lib/server/tribePageData";

const EmergentResonance = dynamic(
  () => import("./EmergentResonance").then((m) => m.EmergentResonance),
  { ssr: true },
);
const PathwayDrift = dynamic(
  () => import("./PathwayDrift").then((m) => m.PathwayDrift),
  { ssr: true },
);

interface TribeViewProps {
  pageData: TribePageData;
}

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

// Roman numeral of the tribe (I → XXII)
function romanNumeral(tribeId: string): string {
  const idx = TRIBES.findIndex((t) => t.id === tribeId);
  const numerals = [
    "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI",
    "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII",
  ];
  return idx >= 0 ? numerals[idx] : "";
}

export function TribeView({ pageData }: TribeViewProps) {
  const { tribe, clans, emotions, presentation } = pageData;
  const {
    typeSet,
    typeVars,
    titleFontFamily,
    emergentPalette,
    texture,
    inkOverrides,
    motionVars,
    emergentHits,
    pathwayInitialCandidates,
  } = presentation;
  const titleFont = typeSet.display;
  const accent = emergentPalette[0]?.hex ?? tribe.color;
  const tribeQueryName = `la tribu ${tribe.name}`;

  // ─── Lens-aware reads ─────────────────────────────────────────────────
  const readCtx = useReadContext();
  const resolvedTribe = resolveTribe(tribe.id, { lens: readCtx.lens });
  const liveName = resolvedTribe?.name ?? tribe.name;
  const liveDescription = resolvedTribe?.description ?? tribe.description;
  useEffect(() => {
    trackEvent("editorial_page_opened", { entry: "tribe", tribeId: tribe.id });
  }, [tribe.id]);

  // Prev/next tribe navigation (canonical order)
  const idx = TRIBES.findIndex((t) => t.id === tribe.id);
  const prev = idx > 0 ? TRIBES[idx - 1] : null;
  const next = idx < TRIBES.length - 1 ? TRIBES[idx + 1] : null;

  // Compose all sentimientos and antónimos across the clans
  const totalFeelings = clans.reduce((acc, c) => acc + c.feelings.length, 0);

  return (
    <div
      className="relative min-h-screen bg-atmospheric overflow-hidden"
      style={{ paddingTop: "80px", backgroundColor: texture.baseColor, ...typeVars, ...inkOverrides, ...motionVars }}
    >
      {/* Generative texture — gradient stack + overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{ background: texture.background }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{ background: texture.overlay, mixBlendMode: texture.overlayBlend, opacity: 0.9 }}
        aria-hidden
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0} className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: tribe.color,
                boxShadow: `0 0 20px ${tribe.color}80`,
              }}
            />
            <p
              className="text-xs text-ink-faint"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.25em" }}
            >
              TRIBU {romanNumeral(tribe.id)} · ONTOLOGÍA MARINA
            </p>
          </div>
          <h1
            className="text-5xl md:text-7xl text-ink leading-[0.95] mb-6"
            style={{
              fontFamily: `"${titleFontFamily}", "Cormorant Garamond", serif`,
              fontWeight: 300,
              letterSpacing: "-0.03em",
              textShadow: `0 0 40px ${accent}33`,
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
            {clans.length} {clans.length === 1 ? "CLAN" : "CLANES"} · {totalFeelings} SENTIMIENTOS · {emotions.length} EMOCIONES CANÓNICAS
          </p>

          {/* Paleta emergente — vista cromática derivada del centroide de la tribu */}
          {emergentPalette.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-1.5">
              {emergentPalette.map((c) => (
                <span
                  key={c.id}
                  className="block h-6 w-6 rounded-sm transition-transform hover:scale-125"
                  style={{ backgroundColor: c.hex, boxShadow: `0 0 14px ${c.hex}55` }}
                  title={`${c.name} · ${c.hex}`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ─── Canonical emotions on the map ─────────────────────────── */}
        {emotions.length > 0 && (
          <motion.section
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mb-16"
          >
            <h2
              className="text-xs text-ink-faint mb-6"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
            >
              EMOCIONES CANÓNICAS
            </h2>
            <div className="flex flex-wrap gap-2">
              {emotions.map((emo) => (
                <Link
                  key={emo.id}
                  href={`/emotion/${emo.id}`}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300"
                  style={{
                    borderColor: `${tribe.color}40`,
                    backgroundColor: `${tribe.color}10`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300 group-hover:scale-150"
                    style={{ backgroundColor: tribe.color, boxShadow: `0 0 8px ${tribe.color}80` }}
                  />
                  <span
                    className="text-sm text-ink/85 transition-colors duration-300"
                    style={{ fontFamily: "var(--font-editorial)" }}
                  >
                    {emo.name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── Clans ───────────────────────────────────────────────────── */}
        <motion.section
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mb-16"
        >
          <h2
            className="text-xs text-ink-faint mb-6"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
          >
            {clans.length === 1 ? "CLAN" : "CLANES"} DE LA TRIBU
          </h2>
          <div className="grid gap-5">
            {clans.map((clan, i) => (
              <motion.article
                key={clan.id}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                custom={2 + i * 0.4}
                className="rounded-2xl border p-6 transition-all duration-300 hover:bg-white/[0.015]"
                style={{
                  borderColor: `${tribe.color}25`,
                  backgroundColor: `${tribe.color}06`,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <Link
                    href={`/clan/${clan.id}`}
                    className="group flex items-center gap-3 hover:opacity-90 transition-opacity"
                    title={`Explorar clan ${clan.name}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full transition-transform duration-300 group-hover:scale-125"
                      style={{ backgroundColor: tribe.color, boxShadow: `0 0 10px ${tribe.color}60` }}
                    />
                    <h3
                      className="text-2xl text-ink/90 group-hover:text-ink transition-colors"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 400, letterSpacing: "-0.01em" }}
                    >
                      {clan.name}
                    </h3>
                    <span
                      className="text-[0.6rem] text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
                    >
                      EXPLORAR →
                    </span>
                  </Link>
                  {clan.canonicalEmotion && (
                    <Link
                      href={`/emotion/${clan.canonicalEmotion}`}
                      className="text-xs px-2.5 py-1 rounded-full border text-ink-faint hover:text-ink transition-colors duration-200"
                      style={{
                        borderColor: `${tribe.color}40`,
                        fontFamily: "var(--font-technical)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Ver {clan.canonicalEmotion} →
                    </Link>
                  )}
                </div>

                <p
                  className="text-sm text-ink-muted/75 italic leading-relaxed mb-5"
                  style={{ fontFamily: "var(--font-literary)" }}
                >
                  {clan.description}
                </p>

                {/* Sentimientos */}
                <div className="mb-4">
                  <p
                    className="text-[0.6rem] text-ink-faint mb-2"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                  >
                    SENTIMIENTOS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {clan.feelings.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-0.5 rounded text-ink/75"
                        style={{
                          backgroundColor: `${tribe.color}12`,
                          fontFamily: "var(--font-editorial)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Antónimos */}
                <div>
                  <p
                    className="text-[0.6rem] text-ink-faint mb-2"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                  >
                    ANTÓNIMOS
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {clan.antonyms.map((a) => (
                      <span
                        key={a}
                        className="text-xs px-2 py-0.5 rounded text-ink-muted/55"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.025)",
                          fontFamily: "var(--font-editorial)",
                          fontSize: "0.75rem",
                          fontStyle: "italic",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.section>

        {/* ─── Emergent resonance for the whole tribe ──────────────────── */}
        {emotions.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-15% 0px" }}
            custom={3.5}
          >
            <EmergentResonance
              hitsByMode={emergentHits}
              accentColor={tribe.color}
              title="RESONANCIA EMERGENTE · TRIBU"
            />
          </motion.div>
        )}

        {/* ─── Multi-hop drift from the tribe's centroid ───────────────── */}
        {emotions.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-15% 0px" }}
            custom={3.7}
          >
            <PathwayDrift
              startId={tribe.id}
              startLabel={tribeQueryName}
              initialCandidates={pathwayInitialCandidates}
              accentColor={tribe.color}
            />
          </motion.div>
        )}

        {/* ─── Tribe navigation (prev / next in Marina order) ─────────── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex items-center justify-between pt-8 mt-8 border-t border-white/5"
        >
          {prev ? (
            <Link
              href={`/tribe/${prev.id}`}
              className="group flex items-center gap-3"
            >
              <span className="text-ink-faint group-hover:text-ink transition-colors">←</span>
              <div className="flex flex-col">
                <span
                  className="text-[0.55rem] text-ink-faint"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                >
                  TRIBU {romanNumeral(prev.id)}
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
            href="/"
            className="text-xs text-ink-faint hover:text-ink transition-colors"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
          >
            ← Volver al mapa
          </Link>
          {next ? (
            <Link
              href={`/tribe/${next.id}`}
              className="group flex items-center gap-3"
            >
              <div className="flex flex-col items-end">
                <span
                  className="text-[0.55rem] text-ink-faint"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
                >
                  TRIBU {romanNumeral(next.id)}
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
