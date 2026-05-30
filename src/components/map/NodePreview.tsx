"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { EMOTION_MAP } from "@/data/ontology/emotions";
import { COLOR_MAP } from "@/data/colors/colorResonance";
import { ARTWORK_MAP } from "@/data/seed/artworks";
import { TRACK_MAP } from "@/data/seed/music";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { CLAN_MAP } from "@/data/ontology/clans";
import type { MapNode } from "@/types";
import { CulturalImage } from "@/components/ui/CulturalImage";
import { deriveTypeSet, typeSetToCssVars } from "@/lib/typeset";

interface Props {
  nodeId: string;
  nodes: MapNode[];
  /** When provided, renders a small × close button. */
  onClose?: () => void;
}

const RESONANCE_LABELS: Array<[string, keyof import("@/types").ResonanceAxes]> = [
  ["Energía",      "energy"],
  ["Temperatura",  "temperature"],
  ["Tensión",      "tension"],
  ["Densidad",     "density"],
  ["Movimiento",   "movement"],
  ["Temporalidad", "temporality"],
  ["Humanidad",    "humanity"],
  ["Claridad",     "clarity"],
  ["Intimidad",    "intimacy"],
  ["Control",      "control"],
];

export function NodePreview({ nodeId, nodes, onClose }: Props) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const emotion = node.type === "emotion" ? EMOTION_MAP.get(nodeId) : null;
  const color = node.type === "color" ? COLOR_MAP.get(nodeId) : null;
  const artwork = node.type === "artwork" ? ARTWORK_MAP.get(nodeId) : null;
  const track = node.type === "music" ? TRACK_MAP.get(nodeId) : null;
  const tribe = emotion?.tribe ? TRIBE_MAP.get(emotion.tribe) : null;
  const clan = emotion?.clan ? CLAN_MAP.get(emotion.clan) : null;

  // Each preview re-typesets to the entity's own resonance, so hovering
  // a different emotion changes the preview's display + body + technical
  // fonts in real time.
  const previewResonance =
    emotion?.resonance ?? color?.resonance ?? artwork?.resonance ?? track?.resonance ?? null;
  const previewTypeSet = previewResonance ? deriveTypeSet(previewResonance) : null;
  const previewTypeVars = previewTypeSet ? typeSetToCssVars(previewTypeSet) : {};

  return (
    <motion.div
      className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="glass-strong rounded-2xl px-7 py-6 pointer-events-auto relative"
        style={{
          width: "min(440px, calc(100vw - 48px))",
          boxShadow: tribe
            ? `0 10px 60px -10px ${tribe.color}30, 0 0 0 1px ${tribe.color}18`
            : "0 10px 60px -10px rgba(0,0,0,0.5)",
          ...previewTypeVars,
        }}
      >
        {/* Pinned-panel close affordance — Esc also closes (handled by map). */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="icon icon-sm absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-ink-faint hover:text-ink hover:bg-white/[0.06] transition-colors"
          >
            close
          </button>
        )}
        {/* ─── Emotion preview ─── */}
        {emotion && (
          <>
            {/* Header: tribe chip + clan, title, accent dot */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  {tribe && (
                    <Link
                      href={`/tribe/${tribe.id}`}
                      className="text-[0.6rem] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${tribe.color}1A`,
                        color: tribe.color,
                        fontFamily: "var(--font-technical)",
                        letterSpacing: "0.12em",
                      }}
                      title={`Tribu ${tribe.name}`}
                    >
                      {tribe.name.toUpperCase()}
                    </Link>
                  )}
                  {clan && (
                    <Link
                      href={`/clan/${clan.id}`}
                      className="text-[0.6rem] px-2 py-0.5 rounded-full text-ink-muted hover:text-ink transition-colors"
                      style={{
                        backgroundColor: "rgba(var(--album-ink-rgb), 0.04)",
                        fontFamily: "var(--font-technical)",
                        letterSpacing: "0.1em",
                      }}
                      title={`Clan ${clan.name} (${clan.feelings.length} sentimientos)`}
                    >
                      {clan.name.toUpperCase()}
                    </Link>
                  )}
                </div>
                <h3
                  className="text-3xl text-ink leading-[0.95] mb-1"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.02em" }}
                >
                  {emotion.name}
                </h3>
                <p
                  className="text-[0.7rem] text-ink-muted"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
                >
                  {emotion.nameEn}
                </p>
              </div>
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                style={{
                  backgroundColor: node.color,
                  boxShadow: `0 0 14px ${node.color}80`,
                }}
              />
            </div>

            {/* Poetic intro — give it room */}
            <p
              className="text-sm text-ink-muted/80 leading-relaxed mb-5 pb-5 border-b border-white/6"
              style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}
            >
              {emotion.poeticIntro}
            </p>

            {/* All 10 resonance axes — two columns */}
            <p
              className="text-[0.55rem] text-ink-faint mb-2.5"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
            >
              PERFIL DE RESONANCIA
            </p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 mb-5">
              {RESONANCE_LABELS.map(([label, key]) => {
                const v = emotion.resonance[key];
                return (
                  <div key={label} className="flex items-center gap-2.5">
                    <span
                      className="text-[0.6rem] text-ink-faint w-[64px] tabular-nums"
                      style={{ fontFamily: "var(--font-technical)" }}
                    >
                      {label}
                    </span>
                    <div className="flex-1 h-[2px] bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${v}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          backgroundColor: tribe?.color ?? "#C8935A",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <span
                      className="text-[0.6rem] text-ink-faint w-5 text-right tabular-nums"
                      style={{ fontFamily: "var(--font-technical)" }}
                    >
                      {v}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Atmosphere tags */}
            {emotion.atmosphereTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {emotion.atmosphereTags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="text-[0.62rem] px-1.5 py-0.5 rounded text-ink-muted/75"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.035)",
                      fontFamily: "var(--font-editorial)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/emotion/${emotion.id}`}
              className="text-xs inline-flex items-center gap-1.5 transition-colors duration-200 hover:opacity-80"
              style={{ color: tribe?.color ?? "#C8935A", fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
            >
              EXPLORAR EMOCIÓN →
            </Link>
          </>
        )}

        {/* ─── Color preview ─── */}
        {color && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex-shrink-0"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: `0 0 24px ${color.hex}40`,
                  border: color.hex.toLowerCase() === "#f5f2ec" ? "1px solid rgba(255,255,255,0.15)" : "none",
                }}
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="text-2xl text-ink leading-tight"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
                >
                  {color.nameEs}
                </h3>
                <p
                  className="text-[0.65rem] text-ink-faint mt-1"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
                >
                  HELLER · {color.appreciatedRank ? `#${color.appreciatedRank} APRECIADO` : "—"}
                  {color.lessAppreciatedRank ? ` · #${color.lessAppreciatedRank} RECHAZADO` : ""}
                </p>
              </div>
            </div>
            <p
              className="text-sm text-ink-muted/80 italic leading-relaxed mb-4"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              "{color.hellerQuote}"
            </p>
            {color.symbolism.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {color.symbolism.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="text-[0.62rem] px-1.5 py-0.5 rounded text-ink-muted/75"
                    style={{ backgroundColor: "rgba(255,255,255,0.035)", fontFamily: "var(--font-editorial)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/color/${color.id}`}
              className="text-xs inline-flex items-center gap-1.5 transition-colors duration-200 hover:opacity-80"
              style={{ color: color.hex, fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
            >
              EXPLORAR COLOR →
            </Link>
          </>
        )}

        {/* ─── Artwork preview ─── */}
        {artwork && (
          <>
            <div className="flex gap-4 mb-4">
              <CulturalImage
                src={artwork.imageUrl}
                alt={artwork.title}
                kind="artwork"
                accentColor="#888"
                width={80}
                height={96}
                className="w-20 h-24 object-cover rounded-lg opacity-80 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg text-ink leading-tight mb-1"
                  style={{ fontFamily: "var(--font-editorial)", fontWeight: 500 }}
                >
                  {artwork.title}
                </h3>
                <p
                  className="text-[0.7rem] text-ink-faint"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
                >
                  {artwork.artist} · {artwork.year}
                </p>
              </div>
            </div>
            <p
              className="text-sm text-ink-muted/80 italic leading-relaxed"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              {artwork.poeticDescription}
            </p>
          </>
        )}

        {/* ─── Music preview ─── */}
        {track && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center flex-shrink-0">
                <span className="text-ink-muted text-xl">♪</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base text-ink leading-tight mb-1"
                  style={{ fontFamily: "var(--font-editorial)" }}
                >
                  {track.title}
                </h3>
                <p
                  className="text-[0.7rem] text-ink-faint"
                  style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
                >
                  {track.artist}{track.year ? ` · ${track.year}` : ""}
                </p>
              </div>
            </div>
            <p
              className="text-sm text-ink-muted/80 italic leading-relaxed mb-3"
              style={{ fontFamily: "var(--font-literary)" }}
            >
              {track.description}
            </p>
            {track.moods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {track.moods.slice(0, 5).map((m) => (
                  <span
                    key={m}
                    className="text-[0.62rem] px-1.5 py-0.5 rounded text-ink-muted/75"
                    style={{ backgroundColor: "rgba(255,255,255,0.035)", fontFamily: "var(--font-editorial)" }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
