import { notFound } from "next/navigation";
import { EMOTION_MAP, EMOTIONS } from "@/data/ontology/emotions";
import { EmotionOverview } from "@/components/editorial/EmotionOverview";
import { emotionTypeSet } from "@/lib/emotionFonts";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getEmotionOverviewData } from "@/lib/server/emotionOverviewData";

/**
 * /emotion/[slug] — the slim overview view.
 *
 * Heavy cultural, resonance, and plural-readings sections live at
 * /emotion/[slug]/explore. This page is what most visitors see and
 * it's intentionally lighter so it feels instant.
 */

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
  const pageData = getEmotionOverviewData(decodeURIComponent(slug));
  if (!pageData) notFound();

  // Per-page font split: title in `swap`, body in `optional`. See
  // lib/fontStylesheet.ts.
  const { primary: titleFontUrl, supporting: bodyFontsUrl } =
    buildTypeSetUrls(emotionTypeSet(pageData.emotion.id));

  return (
    <>
      {titleFontUrl && (
        <link rel="stylesheet" href={titleFontUrl} precedence="emergent-fonts" />
      )}
      {bodyFontsUrl && (
        <link rel="stylesheet" href={bodyFontsUrl} precedence="emergent-fonts" />
      )}
      <EmotionOverview pageData={pageData} />
    </>
  );
}
