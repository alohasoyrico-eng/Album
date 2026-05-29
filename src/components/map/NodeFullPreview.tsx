"use client";

/**
 * Full-screen node preview — replaces the small floating card.
 *
 * When the user clicks any node in the map, this overlay fills the screen,
 * paints itself with the entity's colour, applies the same typeset + texture
 * + ink-contrast system used by detail pages, and surfaces enough content
 * that the user can decide whether to navigate to the full detail page.
 *
 * Closes on: × button, Esc, click on backdrop, or selecting another node.
 */

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTION_MAP, EMOTIONS } from "@/data/ontology/emotions";
import { COLOR_MAP } from "@/data/colors/colorResonance";
import { ARTWORK_MAP } from "@/data/seed/artworks";
import { TRACK_MAP } from "@/data/seed/music";
import { FILM_MAP } from "@/data/seed/films";
import { POEM_MAP } from "@/data/seed/poetry";
import { SCULPTURE_MAP } from "@/data/seed/sculpture";
import { DANCE_MAP } from "@/data/seed/dance";
import { ARCHITECTURE_MAP } from "@/data/seed/architecture";
import { PHOTOGRAPHY_MAP } from "@/data/seed/photography";
import { LITERATURE_MAP } from "@/data/seed/literature";
import { RITUAL_MAP } from "@/data/seed/ritual";
import { THEATER_MAP } from "@/data/seed/theater";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { CLAN_MAP } from "@/data/ontology/clans";
import { FONT_MAP } from "@/data/typography/fonts";
import { deriveTypeSet, typeSetToCssVars } from "@/lib/typeset";
import { deriveTexture } from "@/lib/emotionTexture";
import { inkVars, blendHex, pickInkFor } from "@/lib/contrast";
import { ICON } from "@/lib/icons";
import { resolveEmotion } from "@/data/ontology/emotions-claims";
import { resolveColor } from "@/data/colors/colors-claims";
import { useReadContext } from "@/lib/ReadContextProvider";
import type { ReadContext } from "@/types/claims";
import type { MapNode, ResonanceAxes } from "@/types";
import { ResonanceProfile } from "@/components/editorial/ResonanceProfile";

interface Props {
  nodeId: string;
  nodes: MapNode[];
  onClose: () => void;
}

interface ResolvedEntity {
  title: string;
  subtitle: string;
  description: string;
  resonance: ResonanceAxes;
  hex: string;
  /** Optional CTA: where "Explorar completo" navigates. null = no CTA. */
  detailHref: string | null;
  /** Material Symbols icon key. */
  iconName: string;
  /** Optional badge labels above the title. */
  badges: string[];
}

function badges(...xs: Array<string | undefined>): string[] {
  return xs.filter((x): x is string => Boolean(x && x.length));
}

function resolve(node: MapNode, ctx: ReadContext = {}): ResolvedEntity | null {
  // Loose accessor — every cultural seed has slightly different fields.
  // We pull the common visual ones with optional chaining, which keeps the
  // resolver compact and tolerant to future schema growth.
  const any = (m: Map<string, unknown>) => m.get(node.id) as Record<string, unknown> | undefined;

  if (node.type === "emotion") {
    const e = EMOTION_MAP.get(node.id);
    if (!e) return null;
    const tribe = TRIBE_MAP.get(e.tribe);
    const clan = CLAN_MAP.get(e.clan);
    // Lens-aware: title / subtitle / description / resonance flow through
    // the claims consensus; fall back to canonical if no lens active.
    const live = resolveEmotion(e.id, ctx);
    return {
      title: live?.name ?? e.name,
      subtitle: live?.nameEn ?? e.nameEn,
      description: live?.poeticIntro ?? e.poeticIntro,
      resonance: live?.resonance ?? e.resonance,
      hex: node.color ?? "#888",
      detailHref: `/emotion/${e.id}`, iconName: ICON.emotion,
      badges: badges(tribe?.name ?? e.tribe, clan?.name ?? e.clan),
    };
  }
  if (node.type === "color") {
    const c = COLOR_MAP.get(node.id);
    if (!c) return null;
    const live = resolveColor(c.id, ctx);
    return {
      title: live?.nameEs ?? c.nameEs,
      subtitle: `${live?.name ?? c.name} · ${c.hex.toUpperCase()}`,
      description: live?.description ?? c.description,
      resonance: live?.resonance ?? c.resonance,
      hex: c.hex,
      detailHref: `/color/${c.id}`, iconName: ICON.color,
      badges: ["Atlas cromático"],
    };
  }

  const item = (() => {
    switch (node.type) {
      case "artwork":      return any(ARTWORK_MAP as unknown as Map<string, unknown>);
      case "music":        return any(TRACK_MAP as unknown as Map<string, unknown>);
      case "film":         return any(FILM_MAP as unknown as Map<string, unknown>);
      case "poem":         return any(POEM_MAP as unknown as Map<string, unknown>);
      case "sculpture":    return any(SCULPTURE_MAP as unknown as Map<string, unknown>);
      case "dance":        return any(DANCE_MAP as unknown as Map<string, unknown>);
      case "architecture": return any(ARCHITECTURE_MAP as unknown as Map<string, unknown>);
      case "photography":  return any(PHOTOGRAPHY_MAP as unknown as Map<string, unknown>);
      case "literature":   return any(LITERATURE_MAP as unknown as Map<string, unknown>);
      case "ritual":       return any(RITUAL_MAP as unknown as Map<string, unknown>);
      case "theater":      return any(THEATER_MAP as unknown as Map<string, unknown>);
      case "typography":   return any(FONT_MAP as unknown as Map<string, unknown>);
      default: return undefined;
    }
  })();
  if (!item) return null;

  const KIND_LABEL: Record<string, string> = {
    artwork: "Pintura", music: "Música", film: "Cine", poem: "Poesía",
    sculpture: "Escultura", dance: "Danza", architecture: "Arquitectura",
    photography: "Fotografía", literature: "Literatura", ritual: "Ritual",
    theater: "Teatro", typography: "Tipografía",
  };
  const ICON_KEY: Record<string, string> = {
    artwork: ICON.artwork, music: ICON.music, film: ICON.film, poem: ICON.poem,
    sculpture: ICON.sculpture, dance: ICON.dance, architecture: ICON.architecture,
    photography: ICON.photography, literature: ICON.literature, ritual: ICON.ritual,
    theater: ICON.theater, typography: ICON.typography,
  };

  const s = item as Record<string, unknown>;
  const author = (s.artist || s.author || s.director || s.choreographer
                  || s.architect || s.photographer || s.googleFontFamily || "") as string;
  const title = (s.title || s.name || node.id) as string;
  const year = s.year != null ? String(s.year) : "";
  const description = (s.description || s.poeticDescription || s.excerpt
                       || s.overview || s.fullText || "") as string;
  const culture = (s.culture || s.country || s.language || s.category || "") as string;

  return {
    title,
    subtitle: badges(author, year).join(" · "),
    description,
    resonance: s.resonance as ResonanceAxes,
    hex: node.color ?? "#888",
    detailHref: null,
    iconName: ICON_KEY[node.type] ?? ICON.artwork,
    badges: badges(KIND_LABEL[node.type], culture),
  };
}

export function NodeFullPreview({ nodeId, nodes, onClose }: Props) {
  const node = nodes.find((n) => n.id === nodeId);
  // Lens-aware: when the visitor pins a perspective, the preview
  // re-resolves entity fields through the consensus engine.
  const readCtx = useReadContext();
  const entity = node ? resolve(node, { lens: readCtx.lens, userId: readCtx.userId }) : null;

  // ─── Emergent style for this entity (typeset, texture, ink) ───────────
  const typeSet = useMemo(
    () => entity ? deriveTypeSet(entity.resonance, node?.type === "emotion" ? node.id : undefined) : null,
    [entity, node],
  );
  const typeVars = useMemo(() => typeSet ? typeSetToCssVars(typeSet) : {}, [typeSet]);
  const texture = useMemo(
    () => entity ? deriveTexture(entity.resonance, []) : null,
    [entity],
  );
  // The card's BASE is the entity's own hex. Ink comes from contrast guarantee.
  const inkOverrides = useMemo(
    () => entity ? inkVars(entity.hex) : {},
    [entity],
  );
  const inkScheme = useMemo(
    () => entity ? pickInkFor(entity.hex) : null,
    [entity],
  );

  // Esc to close (the map also handles this but a local listener is more
  // responsive when the full preview is mounted)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Build a small set of "resonant emotions" for cultural items — top 3 by
  // declared resonance, just to give the user a path back into the field.
  const linkedEmotions = useMemo(() => {
    if (!entity || !node) return [];
    if (node.type === "emotion") return [];
    // Use the entity's declared emotionResonance if present
    const ids: string[] = [];
    const raw = node as unknown as { emotionResonance?: string[] };
    if (Array.isArray(raw.emotionResonance)) ids.push(...raw.emotionResonance.slice(0, 5));
    return ids.map((id) => EMOTIONS.find((e) => e.id === id)).filter(Boolean) as typeof EMOTIONS;
  }, [entity, node]);

  return (
    <AnimatePresence>
      {entity && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{ ...typeVars, ...inkOverrides }}
        >
          {/* Backdrop click-to-close */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "rgba(5,5,8,0.55)", backdropFilter: "blur(12px)" }}
          />

          <motion.div
            initial={{ y: 16, scale: 0.985, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.985, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full overflow-hidden"
            style={{
              backgroundColor: entity.hex,
              color: inkScheme?.ink ?? "#000",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Texture layer over the solid colour for depth */}
            {texture && (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: texture.background, mixBlendMode: "soft-light" }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: texture.overlay, mixBlendMode: texture.overlayBlend, opacity: 0.75 }}
                />
              </>
            )}

            {/* Close affordance */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="icon icon-lg absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full hover:bg-black/[0.06] transition-colors"
              style={{ color: inkScheme?.ink, border: `1px solid ${inkScheme?.inkMuted}33` }}
            >
              close
            </button>

            {/* Content column */}
            <div className="relative z-[1] h-full flex items-center justify-center px-6 md:px-12 lg:px-20 py-20 md:py-24 overflow-y-auto">
              <div className="w-full max-w-4xl mx-auto">
                {/* Discipline icon + badges */}
                <div className="flex items-center gap-3 mb-8 flex-wrap">
                  <span className="icon icon-xl" style={{ color: inkScheme?.inkMuted, fontSize: 36 }}>
                    {entity.iconName}
                  </span>
                  {entity.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[0.7rem] uppercase px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${inkScheme?.inkMuted}1A`,
                        border: `1px solid ${inkScheme?.inkMuted}30`,
                        color: inkScheme?.inkMuted,
                        fontFamily: "var(--font-technical)",
                        letterSpacing: "0.18em",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>

                {/* Title in the emergent display font */}
                <h2
                  className="leading-none mb-5"
                  style={{
                    fontFamily: `"${typeSet?.display?.googleFontFamily ?? 'Cormorant Garamond'}", "Cormorant Garamond", serif`,
                    fontSize: "clamp(3.5rem, 10vw, 9rem)",
                    fontWeight: 400,
                    letterSpacing: "-0.025em",
                    color: inkScheme?.ink,
                  }}
                >
                  {entity.title}
                </h2>

                <p
                  className="text-base md:text-lg mb-10"
                  style={{
                    fontFamily: "var(--font-technical)",
                    letterSpacing: "0.08em",
                    color: inkScheme?.inkMuted,
                  }}
                >
                  {entity.subtitle.toUpperCase()}
                </p>

                {entity.description && (
                  <p
                    className="text-xl md:text-2xl italic max-w-3xl mb-12 leading-relaxed"
                    style={{
                      fontFamily: `"${typeSet?.literary?.googleFontFamily ?? 'EB Garamond'}", Georgia, serif`,
                      color: blendHex(entity.hex, inkScheme?.ink ?? "#000", 0.82),
                    }}
                  >
                    {entity.description}
                  </p>
                )}

                {/* Resonance profile — larger bars on full-screen */}
                <div className="mb-12">
                  <p
                    className="text-xs mb-4"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em", color: inkScheme?.inkMuted }}
                  >
                    PERFIL DE RESONANCIA
                  </p>
                  <div style={{ color: inkScheme?.ink }}>
                    <ResonanceProfile resonance={entity.resonance} color={inkScheme?.ink ?? "#000"} />
                  </div>
                </div>

                {/* Linked emotions for cultural items */}
                {linkedEmotions.length > 0 && (
                  <div className="mb-10">
                    <p
                      className="text-xs mb-3"
                      style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em", color: inkScheme?.inkMuted }}
                    >
                      RESUENA CON
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {linkedEmotions.map((e) => (
                        <Link
                          key={e.id}
                          href={`/emotion/${e.id}`}
                          onClick={onClose}
                          className="px-3 py-1.5 rounded-full text-sm hover:scale-105 transition-transform"
                          style={{
                            border: `1px solid ${inkScheme?.inkMuted}40`,
                            backgroundColor: `${inkScheme?.inkMuted}14`,
                            color: inkScheme?.ink,
                            fontFamily: "var(--font-editorial)",
                          }}
                        >
                          {e.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {entity.detailHref && (
                  <Link
                    href={entity.detailHref}
                    onClick={onClose}
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full text-sm hover:scale-105 transition-transform"
                    style={{
                      border: `2px solid ${inkScheme?.ink}`,
                      color: inkScheme?.ink,
                      fontFamily: "var(--font-technical)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    EXPLORAR COMPLETO
                    <span className="icon icon-md">arrow_forward</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
