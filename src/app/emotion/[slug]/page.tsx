import { notFound } from "next/navigation";
import { EMOTION_MAP, EMOTIONS } from "@/data/ontology/emotions";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { EmotionDetail } from "@/components/editorial/EmotionDetail";
import { emotionTypeSet } from "@/lib/emotionFonts";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return EMOTIONS.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const emotion = EMOTION_MAP.get(decodeURIComponent(slug));
  if (!emotion) return { title: "Álbum" };
  return {
    title: `${emotion.name} — Álbum`,
    description: emotion.poeticIntro,
  };
}

export default async function EmotionPage({ params }: Props) {
  const { slug } = await params;
  const emotion = EMOTION_MAP.get(decodeURIComponent(slug));
  if (!emotion) notFound();

  const tribe = TRIBE_MAP.get(emotion.tribe);
  if (!tribe) notFound();

  // Per-page font loading: only the 4 fonts this emotion's typeset needs
  // are pulled from Google Fonts CSS API. Catalogue can scale to any size
  // without affecting this page's network cost.
  const fontUrl = buildTypeSetUrl(emotionTypeSet(emotion.id));

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <EmotionDetail emotion={emotion} tribe={tribe} />
    </>
  );
}
