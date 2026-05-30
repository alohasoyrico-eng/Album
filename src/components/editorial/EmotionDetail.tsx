/**
 * EmotionDetail — Server Component (RSC).
 *
 * Renders the whole emotion page as static HTML on the server. The
 * only things that need browser JavaScript are surfaced as small
 * client islands (see EmotionDetailIslands.tsx) or as dynamically
 * loaded child components for genuinely interactive sub-features
 * (PluralReadings, EmergentResonance, PathwayDrift, ParticipationModule).
 *
 * What changed when we removed `"use client"` from this file:
 *  - The page no longer hydrates as a single 1000+ line React tree.
 *    The browser parses the HTML, paints, and only commits the small
 *    islands. Time-to-interactive drops drastically.
 *  - framer-motion is gone from this module. The `reveal` variants
 *    were already a no-op (animations disabled for perf); removing
 *    them removes thousands of lines of motion-component setup that
 *    React would otherwise reconcile during hydration.
 *  - The hooks that used to live here (useEffect, useReadContext,
 *    useClaimsVersion, useCollectionsStore) moved into focused
 *    islands of ~10 lines each.
 *
 * If you need a new piece of interactivity, prefer creating a new
 * island in EmotionDetailIslands.tsx (or a sibling client component)
 * over re-marking this file as `"use client"`. The whole point is to
 * keep the page mostly server-rendered.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { ResonanceProfile } from "./ResonanceProfile";
import { YouTubeEmbed } from "@/components/ui/YouTubeEmbed";
import { ChromaticBreakdown } from "./ChromaticBreakdown";
import { EmotionalAtmosphere } from "./EmotionalAtmosphere";
import {
  EmotionPageBootstrap,
  EmotionLensText,
  SaveCollectionButton,
} from "./EmotionDetailIslands";
import type { EmotionPageData } from "@/lib/server/emotionPageData";
// ─── Lazy-loaded below-the-fold sections ───────────────────────────────
// These components each pull in heavy dependencies (resonance-engine
// imports all 11 cultural catalogues; ParticipationModule imports COLORS
// + TYPOGRAPHY + EMOTIONS). They appear well below the first paint, so
// next/dynamic splits them into their own chunks that load after the
// initial bundle is parsed. ssr:true (default) keeps them in the static
// HTML — only the JS payload is deferred.
const PluralReadings = dynamic(
  () => import("./PluralReadings").then((m) => m.PluralReadings),
  { ssr: true },
);
const EmergentResonance = dynamic(
  () => import("./EmergentResonance").then((m) => m.EmergentResonance),
  { ssr: true },
);
const PathwayDrift = dynamic(
  () => import("./PathwayDrift").then((m) => m.PathwayDrift),
  { ssr: true },
);
const ParticipationModule = dynamic(
  () => import("./ParticipationModule").then((m) => m.ParticipationModule),
  { ssr: true },
);
interface Props {
  pageData: EmotionPageData;
}

export function EmotionDetail({ pageData }: Props) {
  // Destructure the server-pre-computed payload. The data assembly
  // lives in src/lib/server/emotionPageData.ts and runs once per
  // emotion at build time. Catalogue imports, derivation libraries,
  // and the resonance engine all stay on the server — none of them
  // are bundled into the client.
  const {
    emotion,
    tribe,
    clan,
    recipe,
    behavior,
    behaviorVars,
    typeSet,
    typeVars,
    texture,
    inkOverrides,
    motionPattern,
    motionVars,
    titleFontFamily,
    isNervous,
    relatedColors,
    relatedFonts,
    emergentPalette,
    relatedArtworks,
    relatedTracks,
    relatedFilms,
    relatedPoems,
    relatedSculptures,
    relatedDances,
    relatedArchitectures,
    relatedPhotographs,
    relatedLiterature,
    relatedRituals,
    relatedTheater,
    relatedEmotions,
    transitions,
  } = pageData;
  const titleFont = typeSet.display;
  const tribeColor = tribe.color;
  return (
    <div
      className="min-h-screen bg-atmospheric relative isolate"
      style={{
        paddingTop: "80px",
        backgroundColor: texture.baseColor,
        ...behaviorVars,
        ...typeVars,
        ...inkOverrides,
        ...motionVars,
      }}
>
      {/* Mount analytics + participation bridge as a side-effect island.
          Renders nothing visible; just owns the useEffect hooks that
          used to live in this (now server-rendered) component. */}
      <EmotionPageBootstrap emotionId={emotion.id} tribeId={emotion.tribe} />
      {/* Generative texture ground — distinctive per emotion. Two layers:
          a saturated gradient stack as the body of the surface, then an
          overlay (conic spokes, stripes, or grain) blended on top. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          background: texture.background,
          // Drift animation disabled for perf — atmosphere stays static.
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{
          background: texture.overlay,
          mixBlendMode: texture.overlayBlend,
          opacity: 0.92,
          // Drift animation disabled for perf.
        }}
      />
      {/* Behavioural atmosphere — breathes at the emotion's rhythm */}
      <EmotionalAtmosphere color={recipe.finalHex} behavior={behavior} secondaryColor={tribeColor} />
      {/* The tribal hero gradient stays as a residual hint — most of the
          atmospheric weight now lives in the EmotionalAtmosphere layer. */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb — Mapa / Tribu / Clan / Emoción */}
        <div className="flex items-center gap-2 mb-12 flex-wrap">
          <Link href="/" className="text-ink-faint text-xs hover:text-ink-muted transition-colors" style={{ fontFamily: "var(--font-technical)" }}>
            Mapa
          </Link>
          <span className="text-ink-faint text-xs">/</span>
          <Link
            href={`/tribe/${tribe.id}`}
            className="text-xs hover:opacity-80 transition-opacity"
            style={{ color: tribeColor, fontFamily: "var(--font-technical)", fontSize: "0.7rem" }}
>
            {tribe.name}
          </Link>
          {clan && (
            <>
              <span className="text-ink-faint text-xs">/</span>
              <Link
                href={`/clan/${clan.id}`}
                className="text-xs hover:opacity-80 transition-opacity"
                style={{ color: tribeColor, fontFamily: "var(--font-technical)", fontSize: "0.7rem" }}
>
                {clan.name}
              </Link>
            </>
          )}
          <span className="text-ink-faint text-xs">/</span>
          <span className="text-xs text-ink-muted" style={{ fontFamily: "var(--font-technical)" }}>{emotion.name}</span>
        </div>
        {/* Tribe + Clan chips */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Link
            href={`/tribe/${tribe.id}`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all duration-300 hover:bg-white/[0.02]"
            style={{
              backgroundColor: `${tribeColor}15`,
              color: tribeColor,
              border: `1px solid ${tribeColor}30`,
              fontFamily: "var(--font-technical)",
              letterSpacing: "0.1em",
              fontSize: "0.65rem",
            }}
            title={`Ir a la tribu ${tribe.name}`}
>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: tribeColor }}
            />
            TRIBU · {tribe.name.toUpperCase()}
          </Link>
          {clan && (
            <Link
              href={`/clan/${clan.id}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all duration-300 hover:bg-white/[0.02]"
              style={{
                color: tribeColor,
                border: `1px solid ${tribeColor}25`,
                fontFamily: "var(--font-technical)",
                letterSpacing: "0.1em",
                fontSize: "0.65rem",
              }}
              title={`Ir al clan ${clan.name}`}
>
              CLAN · {clan.name.toUpperCase()} · {clan.feelings.length} SENT.
            </Link>
          )}
        </div>
        {/* Title — gains micro-jitter for nervous emotions (anxiety, fear, rage) */}
        <div className="mb-2">
          <h1
            className={`leading-none text-ink ${isNervous ? "em-jitter" : ""}`}
            style={{
              // Emergent typography — the page's title is rendered in the
              // font whose vector resonates most with this emotion. This is
              // the most visible expression of Álbum's dynamism: each
              // emotion literally speaks in its own typeface.
              fontFamily: `"${titleFontFamily}", "Cormorant Garamond", serif`,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              fontSize: "clamp(3rem, 8vw, 7rem)",
              textShadow: `0 0 var(--em-glow-radius, 0px) ${recipe.finalHex}40`,
              // The title breathes at the assigned motion pattern's pace.
              // A "respiración honda" emotion pulses every 5.4s; a "jitter
              // ansioso" one every 0.8s. Visible motion identity per page.
              // Breath animation disabled for perf.
            }}
>
            {emotion.name}
          </h1>
          <p
            className="text-ink-muted/60 mt-1 flex items-center gap-3 flex-wrap"
            style={{ fontFamily: "var(--font-technical)", fontSize: "0.75rem", letterSpacing: "0.12em" }}
>
            <span>{emotion.nameEn.toUpperCase()}</span>
            <span className="text-ink-faint">·</span>
            <span style={{ color: recipe.finalHex }}>
              TEMPERAMENTO {behavior.temperament.toUpperCase()}
            </span>
            {titleFont && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="text-ink-muted/80" title={titleFont.description}>
                  VOZ TIPOGRÁFICA {titleFont.name.toUpperCase()}
                </span>
              </>
            )}
            {motionPattern && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="text-ink-muted/80" title={motionPattern.description}>
                  MOTION {motionPattern.name.toUpperCase()} · {motionPattern.pace}MS
                </span>
              </>
            )}
          </p>
        </div>
        {/* Poetic intro — lens-driven, rendered by a tiny client island. */}
        <EmotionLensText
          emotionId={emotion.id}
          field="poeticIntro"
          fallback={emotion.poeticIntro}
          className="text-xl md:text-2xl text-ink-muted/80 max-w-2xl mb-8 leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
        />
        {/* Etymology */}
        <div className="mb-8 pl-4 border-l border-white/8">
          <p className="text-xs text-ink-faint mb-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}>
            ETIMOLOGÍA
          </p>
          <EmotionLensText
            emotionId={emotion.id}
            field="etymology"
            fallback={emotion.etymology}
            className="text-sm text-ink-muted/70"
            style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}
          />
        </div>
        {/* Definition */}
        <div className="mb-12">
          <EmotionLensText
            emotionId={emotion.id}
            field="description"
            fallback={emotion.description}
            className="text-base text-ink/70 max-w-2xl leading-relaxed"
            style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
          />
          {/* PluralReadings — the first consumer of the Claim<T> system.
              Shows alternative readings (cultural / curator / user) and a
              lens picker if any overlays exist for this emotion. Silently
              renders nothing for emotions that only have Marina's claim. */}
          <PluralReadings emotionId={emotion.id} accent={recipe.finalHex} />
        </div>
        {/* Resonance profile */}
        <div className="mb-16">
          <h2 className="text-xs text-ink-faint mb-4" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
            PERFIL DE RESONANCIA
          </h2>
          <ResonanceProfile resonance={emotion.resonance} color={tribeColor} />
        </div>
        {/* Chromatic breakdown — how this emotion's color is built */}
        <div className="mb-16">
          <ChromaticBreakdown
            recipe={recipe}
            tribeName={tribe.name}
            emotionName={emotion.name}
          />
        </div>
        {/* ─── Emergent palette — top 16 colors by vector similarity ─── */}
        {emergentPalette.length > 0 && (
          <div
            className="mb-16"
>
            <h2
              className="text-xs text-ink-faint mb-3"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}
>
              PALETA EMERGENTE
            </h2>
            <p
              className="text-sm text-ink-muted/65 italic max-w-xl leading-relaxed mb-6"
              style={{ fontFamily: "var(--font-literary)" }}
>
              Los 16 colores cuyo vector resuena más con {emotion.name.toLowerCase()},
              extraídos del catálogo cromático completo (224 entradas) por
              proximidad coseno. No son etiquetas curadas — son el campo
              cromático que la emoción realmente convoca.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {emergentPalette.map((c) => (
                <a
                  key={c.id}
                  href={`/color/${c.id}`}
                  className="group relative em-card flex flex-col rounded-md overflow-hidden border border-album"
                  style={{ width: 64, height: 80 }}
                  title={`${c.nameEs} · ${c.hex.toUpperCase()}`}
>
                  <div
                    className="flex-1"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="px-1.5 py-1 text-[0.55rem] text-ink-muted truncate"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.05em" }}>
                    {c.nameEs}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        {/* Transitions */}
        {transitions.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              TRÁNSITOS EMOCIONALES
            </h2>
            <div className="grid gap-3">
              {transitions.map((t, i) => (
                <Link key={i} href={`/emotion/${t.to}`} className="group">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:bg-white/2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1.5 h-8 rounded-full"
                        style={{ backgroundColor: t.toTribeColor, opacity: 0.5 }}
                      />
                      <div>
                        <span className="text-sm text-ink/80 group-hover:text-ink transition-colors" style={{ fontFamily: "var(--font-editorial)" }}>
                          {t.toName}
                        </span>
                        <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}>
                          {t.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          color: TRANSITION_COLORS[t.direction],
                          backgroundColor: `${TRANSITION_COLORS[t.direction]}12`,
                          fontFamily: "var(--font-technical)",
                          fontSize: "0.6rem",
                          letterSpacing: "0.08em",
                        }}
>
                        {TRANSITION_LABELS[t.direction]}
                      </span>
                      <p className="text-xs text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>
                        {Math.round(t.strength * 100)}% fuerza
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* Colors */}
        {relatedColors.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              RESONANCIA DE COLOR
            </h2>
            <div className="flex flex-wrap gap-4">
              {relatedColors.map((color) => color && (
                <div key={color.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
                  <div
                    className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: color.hex, boxShadow: `0 0 20px ${color.hex}30` }}
                  />
                  <div>
                    <p className="text-sm text-ink/80" style={{ fontFamily: "var(--font-editorial)" }}>
                      {color.nameEs}
                    </p>
                    <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                      Eva Heller rank #{color.hellerRank}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Typography */}
        {relatedFonts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              TIPOGRAFÍA RESONANTE
            </h2>
            <div className="grid gap-4">
              {relatedFonts.map((font) => font && (
                <div key={font.id} className="p-4 rounded-xl border border-white/5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-ink/60" style={{ fontFamily: "var(--font-technical)" }}>{font.name}</p>
                      <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                        {font.designerEra}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-lg text-ink/80 leading-relaxed"
                    style={{
                      fontFamily: `${font.googleFontFamily}, serif`,
                      fontStyle: "italic",
                    }}
>
                    {font.specimen}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Emergent Resonance — computed neighborhood across the catalogue ── */}
        <div
>
          <EmergentResonance
            hitsByMode={pageData.emergentHits}
            accentColor={recipe.finalHex}
          />
        </div>
        {/* ─── Multi-hop drift — semantic pathway navigation ───────────────── */}
        <div
>
          <PathwayDrift
            startId={emotion.id}
            startLabel={emotion.name}
            initialCandidates={pageData.pathwayInitialCandidates}
            accentColor={recipe.finalHex}
          />
        </div>
        {/* Artworks (curated layer — kept as the "verified" canonical pairing) */}
        {relatedArtworks.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              ARTE RESONANTE · CAPA CURADA
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedArtworks.map((artwork) => artwork && (
                <div
                  key={artwork.id}
                  className="em-card em-artwork-card group rounded-xl overflow-hidden border border-white/5 hover:border-white/10 cursor-pointer relative"
                  style={{
                    // Glow color drives the CSS :hover rule in globals.css.
                    // Doing it through a CSS variable means the parent can
                    // stay a server-rendered <div> — no client handlers
                    // needed — and the hover repaint runs entirely on the
                    // GPU compositor without React in the loop.
                    ["--em-artwork-glow" as string]: `${recipe.finalHex}80`,
                  }}
>
                  <div className="relative h-48 overflow-hidden bg-surface">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/90 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm text-ink leading-tight" style={{ fontFamily: "var(--font-editorial)" }}>
                        {artwork.title}
                      </p>
                      <p className="text-xs text-ink-muted/70" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                        {artwork.artist} · {artwork.year}
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-ink-muted/60 italic leading-relaxed" style={{ fontFamily: "var(--font-literary)" }}>
                      {artwork.poeticDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Music */}
        {relatedTracks.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              MÚSICA RESONANTE
            </h2>
            <div className="grid gap-4">
              {relatedTracks.map((track) => track && (
                <div key={track.id} className="em-card p-4 rounded-xl border border-white/5 hover:border-white/10">
                  <div className="flex items-start gap-4 mb-3">
                    {/* Music icon pulses at the behavior's pulseFreq — rhythmic identity */}
                    <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center relative">
                      <span className="text-ink-faint relative z-10">♪</span>
                      <span
                        aria-hidden
                        className="em-pulse absolute inset-0 rounded-lg"
                        style={{ backgroundColor: recipe.finalHex, mixBlendMode: "screen" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink/80 truncate" style={{ fontFamily: "var(--font-editorial)" }}>
                        {track.title}
                      </p>
                      <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                        {track.artist}{track.album ? ` · ${track.album}` : ""}{track.year ? ` · ${track.year}` : ""}
                      </p>
                      <p className="text-xs text-ink-muted/60 mt-1.5 italic leading-relaxed" style={{ fontFamily: "var(--font-literary)" }}>
                        {track.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {track.moods.slice(0, 4).map((mood) => (
                          <span
                            key={mood}
                            className="text-xs px-1.5 py-0.5 rounded text-ink-faint"
                            style={{ backgroundColor: "rgba(255,255,255,0.04)", fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}
>
                            {mood}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {track.youtubeId && (
                    <YouTubeEmbed
                      youtubeId={track.youtubeId}
                      title={`${track.title} — ${track.artist}`}
                      variant="video"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Films */}
        {relatedFilms.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              CINE RESONANTE
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedFilms.map((film) => film && (
                <div key={film.id} className="p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="flex gap-3 mb-3">
                    {film.posterUrl && (
                      <img
                        src={film.posterUrl}
                        alt={film.title}
                        className="w-14 h-20 object-cover rounded-lg opacity-70 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink/80" style={{ fontFamily: "var(--font-editorial)" }}>
                        {film.title}
                      </p>
                      <p className="text-xs text-ink-faint mb-2" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                        {film.director} · {film.year}
                      </p>
                      <p className="text-xs text-ink-muted/60 italic leading-relaxed" style={{ fontFamily: "var(--font-literary)" }}>
                        {film.poeticDescription}
                      </p>
                    </div>
                  </div>
                  {film.youtubeId && (
                    <YouTubeEmbed
                      youtubeId={film.youtubeId}
                      title={`${film.title} — trailer`}
                      variant="video"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Poetry */}
        {relatedPoems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              POESÍA RESONANTE
            </h2>
            <div className="grid gap-4">
              {relatedPoems.map((poem) => poem && (
                <div key={poem.id} className="p-5 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-ink/80" style={{ fontFamily: "var(--font-editorial)" }}>
                        {poem.title}
                      </p>
                      <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem" }}>
                        {poem.author}{poem.year ? `, ${poem.year}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="pl-4 border-l-2" style={{ borderColor: `${tribeColor}30` }}>
                    <p className="poem-text text-sm text-ink-muted/70">
                      {poem.excerpt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Escultura ─────────────────────────────────────────────── */}
        {relatedSculptures.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              ESCULTURA RESONANTE
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedSculptures.map((s) => s && (
                <div key={s.id} className="rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.015]"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  <div className="flex gap-3 mb-2">
                    <img src={s.imageUrl} alt={s.title} className="w-16 h-20 object-cover rounded-lg opacity-80 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{s.title}</p>
                      <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                        {s.artist.toUpperCase()} · {s.year}
                      </p>
                      <p className="text-[0.6rem] text-ink-faint mt-0.5" style={{ fontFamily: "var(--font-technical)" }}>
                        {s.medium}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted/70 italic leading-relaxed" style={{ fontFamily: "var(--font-literary)" }}>
                    {s.poeticDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Danza ──────────────────────────────────────────────────── */}
        {relatedDances.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              DANZA RESONANTE
            </h2>
            <div className="grid gap-4">
              {relatedDances.map((d) => d && (
                <div key={d.id} className="rounded-xl border p-5 transition-all duration-300"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{d.title}</p>
                      <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                        {d.choreographer.toUpperCase()} · {d.year}
                      </p>
                      <p className="text-[0.6rem] mt-0.5" style={{ fontFamily: "var(--font-technical)", color: tribeColor, letterSpacing: "0.1em" }}>
                        {d.tradition.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-ink-muted/75 italic leading-relaxed mb-3" style={{ fontFamily: "var(--font-literary)" }}>
                    {d.poeticDescription}
                  </p>
                  {d.youtubeId && (
                    <YouTubeEmbed youtubeId={d.youtubeId} title={`${d.title} — ${d.choreographer}`} variant="video" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Arquitectura ───────────────────────────────────────────── */}
        {relatedArchitectures.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              ARQUITECTURA RESONANTE
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedArchitectures.map((a) => a && (
                <div key={a.id} className="rounded-xl border overflow-hidden transition-all duration-300"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  <img src={a.imageUrl} alt={a.title} className="w-full h-40 object-cover opacity-80" />
                  <div className="p-4">
                    <p className="text-sm text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{a.title}</p>
                    <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                      {a.architect.toUpperCase()} · {a.year}
                    </p>
                    <p className="text-[0.6rem] text-ink-faint mt-0.5" style={{ fontFamily: "var(--font-technical)" }}>
                      {a.location}
                    </p>
                    <p className="text-xs text-ink-muted/70 italic leading-relaxed mt-2" style={{ fontFamily: "var(--font-literary)" }}>
                      {a.poeticDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Fotografía ─────────────────────────────────────────────── */}
        {relatedPhotographs.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              FOTOGRAFÍA RESONANTE
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedPhotographs.map((p) => p && (
                <div key={p.id} className="rounded-xl border overflow-hidden transition-all duration-300"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  <img src={p.imageUrl} alt={p.title} className="w-full h-48 object-cover opacity-85" />
                  <div className="p-4">
                    <p className="text-sm text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{p.title}</p>
                    <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                      {p.photographer.toUpperCase()} · {p.year}
                    </p>
                    {p.series && (
                      <p className="text-[0.6rem] mt-0.5" style={{ fontFamily: "var(--font-technical)", color: tribeColor, letterSpacing: "0.08em" }}>
                        SERIE · {p.series.toUpperCase()}
                      </p>
                    )}
                    <p className="text-xs text-ink-muted/70 italic leading-relaxed mt-2" style={{ fontFamily: "var(--font-literary)" }}>
                      {p.poeticDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Literatura ─────────────────────────────────────────────── */}
        {relatedLiterature.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              LITERATURA RESONANTE
            </h2>
            <div className="grid gap-4">
              {relatedLiterature.map((l) => l && (
                <div key={l.id} className="rounded-xl border p-5 transition-all duration-300"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{l.title}</p>
                      <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                        {l.author.toUpperCase()} · {l.year}
                      </p>
                      <p className="text-[0.6rem] mt-0.5" style={{ fontFamily: "var(--font-technical)", color: tribeColor, letterSpacing: "0.08em" }}>
                        {l.form.toUpperCase()} · {l.language.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {l.excerpt && (
                    <blockquote className="pl-4 border-l-2 mb-3" style={{ borderColor: `${tribeColor}40` }}>
                      <p className="text-sm text-ink/85 leading-relaxed italic" style={{ fontFamily: "var(--font-literary)" }}>
                        "{l.excerpt}"
                      </p>
                    </blockquote>
                  )}
                  <p className="text-xs text-ink-muted/70 italic leading-relaxed" style={{ fontFamily: "var(--font-literary)" }}>
                    {l.poeticDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Teatro ─────────────────────────────────────────────────── */}
        {relatedTheater.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              TEATRO RESONANTE
            </h2>
            <div className="grid gap-4">
              {relatedTheater.map((t) => t && (
                <div key={t.id} className="em-card rounded-xl border p-5 transition-all duration-300"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{t.title}</p>
                      <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                        {t.author.toUpperCase()} · {t.year}
                      </p>
                      <p className="text-[0.6rem] mt-0.5" style={{ fontFamily: "var(--font-technical)", color: tribeColor, letterSpacing: "0.08em" }}>
                        {t.form.toUpperCase()} · {t.origin.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {t.excerpt && (
                    <blockquote className="pl-4 border-l-2 mb-3" style={{ borderColor: `${tribeColor}40` }}>
                      <p className="text-sm text-ink/85 leading-relaxed italic" style={{ fontFamily: "var(--font-literary)" }}>
                        "{t.excerpt}"
                      </p>
                    </blockquote>
                  )}
                  <p className="text-xs text-ink-muted/70 italic leading-relaxed" style={{ fontFamily: "var(--font-literary)" }}>
                    {t.poeticDescription}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ─── Ritual ─────────────────────────────────────────────────── */}
        {relatedRituals.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              RITUAL RESONANTE
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {relatedRituals.map((r) => r && (
                <div key={r.id} className="rounded-xl border overflow-hidden transition-all duration-300"
                  style={{ borderColor: `${tribeColor}25`, backgroundColor: `${tribeColor}06` }}>
                  {r.imageUrl && <img src={r.imageUrl} alt={r.title} className="w-full h-40 object-cover opacity-80" />}
                  <div className="p-4">
                    <p className="text-sm text-ink/90" style={{ fontFamily: "var(--font-editorial)" }}>{r.title}</p>
                    <p className="text-[0.65rem] text-ink-faint mt-1" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}>
                      {r.tradition.toUpperCase()}
                    </p>
                    <p className="text-[0.6rem] text-ink-faint mt-0.5" style={{ fontFamily: "var(--font-technical)" }}>
                      {r.region} · {r.period}
                    </p>
                    <p className="text-xs text-ink-muted/70 italic leading-relaxed mt-2" style={{ fontFamily: "var(--font-literary)" }}>
                      {r.poeticDescription}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Related emotions */}
        {relatedEmotions.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              CONSTELACIÓN PRÓXIMA
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedEmotions.map((rel) => (
                <Link
                  key={`${rel.rel}-${rel.id}`}
                  href={`/emotion/${rel.id}`}
                  className="group px-3 py-2 rounded-full border transition-all duration-300 hover:scale-105"
                  style={{
                    borderColor: rel.rel === "antonym"
                      ? `${tribeColor}30`
                      : `${rel.tribeColor}30`,
                    color: rel.rel === "antonym"
                      ? `${tribeColor}70`
                      : rel.tribeColor,
                    backgroundColor: rel.rel === "antonym"
                      ? "transparent"
                      : `${rel.tribeColor}10`,
                  }}
>
                  <span className="text-xs" style={{ fontFamily: "var(--font-technical)" }}>
                    {rel.rel === "antonym" && <span className="opacity-50 mr-1">↔</span>}
                    {rel.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {/* Participation module */}
        <div className="mb-16">
          <ParticipationModule emotion={emotion} tribe={tribe} options={pageData.participationOptions} />
        </div>
        {/* Actions */}
        <div
          className="flex items-center gap-4 pb-20"
>
          <SaveCollectionButton emotionId={emotion.id} accent={tribeColor} />
          <Link
            href="/atmosphere"
            className="px-4 py-2 rounded-full border transition-all duration-300 hover:bg-white/4 text-sm text-ink-muted border-white/10"
            style={{ fontFamily: "var(--font-technical)" }}
>
            Construir atmósfera →
          </Link>
        </div>
      </div>
    </div>
  );
}
const TRANSITION_COLORS: Record<string, string> = {
  intensification: "#C04040",
  attenuation: "#4A9AA0",
  transformation: "#C8935A",
  opposition: "#7A4A9A",
};
const TRANSITION_LABELS: Record<string, string> = {
  intensification: "INTENSIFICACIÓN",
  attenuation: "ATENUACIÓN",
  transformation: "TRANSFORMACIÓN",
  opposition: "OPOSICIÓN",
};
