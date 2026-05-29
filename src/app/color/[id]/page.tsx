import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COLORS, COLOR_MAP } from "@/data/colors/colorResonance";
import { EMOTIONS } from "@/data/ontology/emotions";
import { ARTWORKS } from "@/data/seed/artworks";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { ColorView } from "@/components/editorial/ColorView";
import { deriveTypeSet } from "@/lib/typeset";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";

interface Params { id: string }

export function generateStaticParams() {
  return COLORS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const color = COLOR_MAP.get(id);
  if (!color) return { title: "Color no encontrado — Álbum" };
  return {
    title: `${color.nameEs} — Atlas cromático — Álbum`,
    description: color.description,
  };
}

export default async function ColorPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const color = COLOR_MAP.get(id);
  if (!color) notFound();

  // Emotions canonically tied to this color (declared on the color side)
  const primaryEmotions = color.primaryEmotions
    .map((eId) => EMOTIONS.find((e) => e.id === eId))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const contradictoryEmotions = color.contradictoryEmotions
    .map((eId) => EMOTIONS.find((e) => e.id === eId))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  // Emotions that themselves cite this color in their resonance
  const resonantEmotions = EMOTIONS.filter(
    (e) => e.colorResonance.includes(color.id) && !color.primaryEmotions.includes(e.id),
  );

  // Artworks that include this color in their colorResonance
  const resonantArtworks = ARTWORKS.filter((a) => a.colorResonance.includes(color.id));

  // Fonts that share emotion resonance with this color's primary emotions
  const primaryEmotionIds = new Set(color.primaryEmotions);
  const resonantFonts = TYPOGRAPHY.filter((f) =>
    f.emotionResonance.some((e) => primaryEmotionIds.has(e)),
  );

  const fontUrl = buildTypeSetUrl(deriveTypeSet(color.resonance));

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <ColorView
        color={color}
        primaryEmotions={primaryEmotions}
        contradictoryEmotions={contradictoryEmotions}
        resonantEmotions={resonantEmotions}
        resonantArtworks={resonantArtworks}
        resonantFonts={resonantFonts}
      />
    </>
  );
}
