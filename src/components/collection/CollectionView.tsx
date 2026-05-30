"use client";
import Link from "next/link";
import { useCollectionsStore } from "@/lib/store";
import { EMOTION_MAP } from "@/data/ontology/emotions";
import { CulturalImage } from "@/components/ui/CulturalImage";
import { ARTWORK_MAP } from "@/data/seed/artworks";
import { TRACK_MAP } from "@/data/seed/music";
import { FILM_MAP } from "@/data/seed/films";
import { POEM_MAP } from "@/data/seed/poetry";
import { COLOR_MAP } from "@/data/colors/colorResonance";
import { FONT_MAP } from "@/data/typography/fonts";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import type { Atmosphere } from "@/types";
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }),
};
export function CollectionView() {
  const { collections } = useCollectionsStore();
  const allSavedEmotions = collections.flatMap((c) => c.savedEmotions);
  const allSavedArtworks = collections.flatMap((c) => c.savedArtworks);
  const allSavedMusic = collections.flatMap((c) => c.savedMusic);
  const allSavedFilms = collections.flatMap((c) => c.savedFilms);
  const allSavedPoems = collections.flatMap((c) => c.savedPoems);
  const allAtmospheres = collections.flatMap((c) => c.atmospheres);
  const isEmpty =
    allSavedEmotions.length === 0 &&
    allSavedArtworks.length === 0 &&
    allAtmospheres.length === 0;
  return (
    <div className="min-h-screen bg-atmospheric" style={{ paddingTop: "80px" }}>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <p className="text-xs text-ink-faint mb-3" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}>
            ARCHIVO PERSONAL
          </p>
          <h1
            className="text-5xl md:text-6xl text-ink leading-none mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.03em" }}
>
            Mi constelación
          </h1>
          <p className="text-ink-muted/60" style={{ fontFamily: "var(--font-literary)", fontStyle: "italic" }}>
            Lo que has elegido guardar en el observatorio.
          </p>
        </div>
        {isEmpty ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full border border-white/8 flex items-center justify-center mx-auto mb-6">
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>
            <p
              className="text-lg text-ink-muted/60 mb-6"
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
>
              Tu colección está vacía todavía.
            </p>
            <p
              className="text-sm text-ink-faint max-w-sm mx-auto mb-8 leading-relaxed"
              style={{ fontFamily: "var(--font-body)", fontWeight: 300 }}
>
              Explora el mapa semántico, guarda emociones que resuenen contigo, y construye atmósferas que quieras conservar.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-5 py-2.5 rounded-full border border-white/10 text-sm text-ink-muted hover:text-ink hover:border-white/20 transition-all duration-300"
                style={{ fontFamily: "var(--font-technical)" }}
>
                Explorar el mapa
              </Link>
              <Link
                href="/atmosphere"
                className="px-5 py-2.5 rounded-full border border-amber/30 text-sm text-amber hover:bg-amber/8 transition-all duration-300"
                style={{ fontFamily: "var(--font-technical)" }}
>
                Construir atmósfera
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Atmospheres */}
            {allAtmospheres.length> 0 && (
              <section>
                <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
                  ATMÓSFERAS ({allAtmospheres.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {allAtmospheres.map((atm, i) => (
                    <AtmosphereCard key={atm.id} atmosphere={atm} index={i} />
                  ))}
                </div>
              </section>
            )}
            {/* Saved emotions */}
            {allSavedEmotions.length> 0 && (
              <section>
                <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
                  EMOCIONES GUARDADAS ({allSavedEmotions.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {Array.from(new Set(allSavedEmotions)).map((id) => {
                    const emotion = EMOTION_MAP.get(id);
                    const tribe = emotion?.tribe ? TRIBE_MAP.get(emotion.tribe) : null;
                    if (!emotion) return null;
                    return (
                      <Link
                        key={id}
                        href={`/emotion/${id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 hover:scale-105"
                        style={{
                          borderColor: `${tribe?.color ?? "#888"}40`,
                          color: tribe?.color ?? "#888",
                          backgroundColor: `${tribe?.color ?? "#888"}08`,
                        }}
>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tribe?.color ?? "#888", opacity: 0.7 }} />
                        <span className="text-sm" style={{ fontFamily: "var(--font-editorial)" }}>{emotion.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
            {/* Saved artworks */}
            {allSavedArtworks.length> 0 && (
              <section>
                <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
                  OBRAS GUARDADAS ({allSavedArtworks.length})
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from(new Set(allSavedArtworks)).map((id) => {
                    const artwork = ARTWORK_MAP.get(id);
                    if (!artwork) return null;
                    return (
                      <div key={id} className="rounded-xl overflow-hidden border border-white/5 group">
                        <div className="relative h-28 bg-surface overflow-hidden">
                          <CulturalImage
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            kind="artwork"
                            accentColor="#888"
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-deep/80 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-xs text-ink/80 truncate" style={{ fontFamily: "var(--font-editorial)" }}>{artwork.title}</p>
                            <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>{artwork.artist}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {/* Saved music */}
            {allSavedMusic.length> 0 && (
              <section>
                <h2 className="text-xs text-ink-faint mb-6" style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.15em" }}>
                  MÚSICA GUARDADA ({allSavedMusic.length})
                </h2>
                <div className="grid gap-2">
                  {Array.from(new Set(allSavedMusic)).map((id) => {
                    const track = TRACK_MAP.get(id);
                    if (!track) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5">
                        <div className="w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-ink-faint">♪</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink/80 truncate" style={{ fontFamily: "var(--font-editorial)" }}>{track.title}</p>
                          <p className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>{track.artist}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function AtmosphereCard({ atmosphere, index }: { atmosphere: Atmosphere; index: number }) {
  const emotion = EMOTION_MAP.get(atmosphere.emotion);
  const color = COLOR_MAP.get(atmosphere.color);
  const font = FONT_MAP.get(atmosphere.typography);
  const tribe = emotion?.tribe ? TRIBE_MAP.get(emotion.tribe) : null;
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 border cursor-default"
      style={{
        borderColor: `${color?.hex ?? "#888"}20`,
        background: `
          radial-gradient(ellipse at 20% 30%, ${color?.hex ?? "#888"}12 0%, transparent 55%),
          rgba(20, 20, 32, 0.8)
        `,
      }}
>
      <div className="mb-3">
        <p
          className="text-xl md:text-2xl text-ink leading-tight mb-1"
          style={{
            fontFamily: font ? `${font.googleFontFamily}, serif` : "var(--font-display)",
            fontWeight: 300,
          }}
>
          {atmosphere.name}
        </p>
        <div className="flex items-center gap-2">
          {color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex, opacity: 0.6 }} />}
          <span className="text-xs text-ink-faint" style={{ fontFamily: "var(--font-technical)", fontSize: "0.6rem" }}>
            {emotion?.name} · {color?.nameEs} · {font?.name}
          </span>
        </div>
      </div>
      <p
        className="text-xs text-ink-muted/60 italic leading-relaxed mb-3 line-clamp-2"
        style={{ fontFamily: "var(--font-literary)" }}
>
        {atmosphere.poeticDescription}
      </p>
      <div className="flex flex-wrap gap-1">
        {atmosphere.atmosphereTags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${color?.hex ?? "#888"}12`,
              color: `${color?.hex ?? "#C8935A"}`,
              fontFamily: "var(--font-technical)",
              fontSize: "0.55rem",
              letterSpacing: "0.05em",
            }}
>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
