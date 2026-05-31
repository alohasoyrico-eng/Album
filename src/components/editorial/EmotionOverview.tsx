/**
 * EmotionOverview — the slim default view at /emotion/[slug].
 *
 * Renders the hero, recipe summary, emergent palette, transitions,
 * and related-emotions constellation. Heavy stuff (cultural sections,
 * resonance engine UI, plural readings + submission, chromatic
 * breakdown deep view) moved to /emotion/[slug]/explore.
 *
 * Why this exists separately from EmotionDetail
 * ──────────────────────────────────────────────
 * EmotionDetail bundled 11 cultural sections + EmergentResonance
 * (4 modes × 12 hits) + PathwayDrift + PluralReadings + ParticipationModule
 * + ChromaticBreakdown. That was 350 KB of HTML and ~9 islands hydrating
 * on a route that most visitors only scan. The split lets the common
 * "what is this emotion" answer load fast; the deep dives stay
 * reachable via an explicit "Explorar" link.
 *
 * This file is a Server Component. Only the tiny client islands
 * (EmotionPageBootstrap, EmotionLensText, SaveCollectionButton) ship
 * JS — and they're each ~10 lines.
 */

import Link from "next/link";
import { ResonanceProfile } from "./ResonanceProfile";
import { ChromaticBreakdown } from "./ChromaticBreakdown";
import { EmotionalAtmosphere } from "./EmotionalAtmosphere";
import {
  EmotionPageBootstrap,
  EmotionLensText,
  SaveCollectionButton,
} from "./EmotionDetailIslands";
import { Chip } from "@/components/ui/Chip";
import type { EmotionOverviewData } from "@/lib/server/emotionOverviewData";

const TRANSITION_COLORS: Record<string, string> = {
  intensification: "#C04040",
  attenuation:     "#4A9AA0",
  transformation:  "#C8935A",
  opposition:      "#7A4A9A",
};
const TRANSITION_LABELS: Record<string, string> = {
  intensification: "INTENSIFICACIÓN",
  attenuation:     "ATENUACIÓN",
  transformation:  "TRANSFORMACIÓN",
  opposition:      "OPOSICIÓN",
};

interface Props {
  pageData: EmotionOverviewData;
}

export function EmotionOverview({ pageData }: Props) {
  const {
    emotion, tribe, clan,
    recipe, behavior, behaviorVars,
    typeSet, typeVars, texture, inkOverrides, motionPattern, motionVars,
    titleFontFamily, isNervous,
    emergentPalette,
    relatedEmotions, transitions,
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
      <EmotionPageBootstrap emotionId={emotion.id} tribeId={emotion.tribe} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{ background: texture.background }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000"
        style={{ background: texture.overlay, mixBlendMode: texture.overlayBlend, opacity: 0.92 }}
      />
      <EmotionalAtmosphere color={recipe.finalHex} behavior={behavior} secondaryColor={tribeColor} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* ─── Breadcrumb (neutral ink) ─────────────────────────── */}
        <nav
          aria-label="Ruta"
          className="flex items-center gap-2 mb-10 flex-wrap text-xs text-ink-faint"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.04em" }}
        >
          <Link href="/" className="hover:text-ink-muted transition-colors">Mapa</Link>
          <span aria-hidden>/</span>
          <Link href={`/tribe/${tribe.id}`} className="hover:text-ink-muted transition-colors">
            {tribe.name}
          </Link>
          {clan && (
            <>
              <span aria-hidden>/</span>
              <Link href={`/clan/${clan.id}`} className="hover:text-ink-muted transition-colors">
                {clan.name}
              </Link>
            </>
          )}
          <span aria-hidden>/</span>
          <span className="text-ink-muted">{emotion.name}</span>
        </nav>

        {/* ─── Tribe + Clan chips ────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Chip href={`/tribe/${tribe.id}`} variant="solid" accent={tribeColor}>
            TRIBU · {tribe.name.toUpperCase()}
          </Chip>
          {clan && (
            <Chip href={`/clan/${clan.id}`} variant="outline" accent={tribeColor}>
              CLAN · {clan.name.toUpperCase()} · {clan.feelings.length} SENT.
            </Chip>
          )}
        </div>

        {/* ─── Title ─────────────────────────────────────────────── */}
        <div className="mb-2">
          <h1
            className={`leading-none text-ink ${isNervous ? "em-jitter" : ""}`}
            style={{
              fontFamily: `"${titleFontFamily}", "Cormorant Garamond", serif`,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              fontSize: "clamp(3rem, 8vw, 7rem)",
              textShadow: `0 0 var(--em-glow-radius, 0px) ${recipe.finalHex}40`,
            }}
          >
            {emotion.name}
          </h1>
          <p
            className="text-ink-muted/70 mt-2 flex items-center gap-3 flex-wrap"
            style={{ fontFamily: "var(--font-technical)", fontSize: "0.75rem", letterSpacing: "0.12em" }}
          >
            <span>{emotion.nameEn.toUpperCase()}</span>
            <span className="text-ink-faint">·</span>
            <span>TEMPERAMENTO {behavior.temperament.toUpperCase()}</span>
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

        {/* ─── Lens-driven text (poetic / etymology / description) ── */}
        <EmotionLensText
          emotionId={emotion.id}
          field="poeticIntro"
          fallback={emotion.poeticIntro}
          className="text-xl md:text-2xl text-ink-muted/85 max-w-prose mb-8 leading-relaxed"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
        />
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
        <div className="mb-12">
          <EmotionLensText
            emotionId={emotion.id}
            field="description"
            fallback={emotion.description}
            className="text-base text-ink/85 max-w-prose leading-relaxed"
            style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
          />
        </div>

        {/* ─── Resonance profile (data viz, lightweight) ────────── */}
        <div className="mb-16">
          <h2 className="text-xs text-ink-faint mb-4" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
            PERFIL DE RESONANCIA
          </h2>
          <ResonanceProfile resonance={emotion.resonance} color={tribeColor} />
        </div>

        {/* ─── Chromatic breakdown (single component, lightweight) ── */}
        <div className="mb-16">
          <ChromaticBreakdown
            recipe={recipe}
            tribeName={tribe.name}
            emotionName={emotion.name}
          />
        </div>

        {/* ─── Emergent palette ─────────────────────────────────── */}
        {emergentPalette.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-3" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              PALETA EMERGENTE
            </h2>
            <p className="text-sm text-ink-muted/80 italic max-w-prose leading-relaxed mb-6" style={{ fontFamily: "var(--font-literary)" }}>
              Los 16 colores cuyo vector resuena más con {emotion.name.toLowerCase()},
              extraídos del catálogo cromático completo (224 entradas) por
              proximidad coseno.
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
                  <div className="flex-1" style={{ backgroundColor: c.hex }} />
                  <div className="px-1.5 py-1 text-[0.55rem] text-ink-muted truncate"
                    style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.05em" }}>
                    {c.nameEs}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ─── Transitions ──────────────────────────────────────── */}
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
                        className="inline-flex items-center gap-1.5 text-xs text-ink-muted"
                        style={{ fontFamily: "var(--font-technical)", fontSize: "0.65rem", letterSpacing: "0.12em" }}
                      >
                        <span
                          aria-hidden
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: TRANSITION_COLORS[t.direction] }}
                        />
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

        {/* ─── Related emotions (constellation) ─────────────────── */}
        {relatedEmotions.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
              CONSTELACIÓN PRÓXIMA
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedEmotions.map((rel) => (
                <Chip
                  key={`${rel.rel}-${rel.id}`}
                  href={`/emotion/${rel.id}`}
                  variant="outline"
                  accent={rel.rel === "antonym" ? tribeColor : rel.tribeColor}
                >
                  <span
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: rel.rel === "antonym" ? "transparent" : rel.tribeColor,
                      border: rel.rel === "antonym" ? `1px solid ${tribeColor}` : "none",
                    }}
                  />
                  {rel.rel === "antonym" && <span className="opacity-60">↔</span>}
                  {rel.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        {/* ─── Deep-view link + actions ──────────────────────────── */}
        <div className="mb-8 p-6 rounded-2xl border border-album bg-white/[0.02]">
          <h2
            className="text-sm text-ink/90 mb-2"
            style={{ fontFamily: "var(--font-editorial)" }}
          >
            Explora a fondo
          </h2>
          <p
            className="text-sm text-ink-muted/80 italic mb-4 max-w-prose"
            style={{ fontFamily: "var(--font-literary)" }}
          >
            Las disciplinas culturales que resuenan con {emotion.name.toLowerCase()},
            las vecindades emergentes que el motor infiere, la deriva por el campo
            semántico, y las lecturas plurales que otras tradiciones dan a esta
            misma palabra.
          </p>
          <Link
            href={`/emotion/${emotion.id}/explore`}
            className="inline-flex items-center gap-2 rounded-full transition-transform duration-150 hover:scale-[1.02] min-h-[44px] px-5 py-2.5 text-sm border-[1.5px]"
            style={{
              borderColor: tribeColor,
              backgroundColor: `${tribeColor}10`,
              color: "var(--album-ink)",
              fontFamily: "var(--font-technical)",
              letterSpacing: "0.08em",
            }}
          >
            Explorar más →
          </Link>
        </div>

        {/* ─── Primary action ────────────────────────────────────── */}
        <div className="flex items-center gap-3 pb-20 flex-wrap">
          <SaveCollectionButton emotionId={emotion.id} accent={tribeColor} />
          <Link
            href="/atmosphere"
            className="inline-flex items-center justify-center gap-2 rounded-full transition-transform duration-150 hover:scale-[1.02] min-h-[44px] px-5 py-2.5 text-sm border-[1.5px] border-album text-ink"
            style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
          >
            Construir atmósfera →
          </Link>
        </div>
      </div>
    </div>
  );
}
