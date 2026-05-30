import { notFound } from "next/navigation";
import { EMOTION_MAP, EMOTIONS } from "@/data/ontology/emotions";
import { EmotionDetail } from "@/components/editorial/EmotionDetail";
import { emotionTypeSet } from "@/lib/emotionFonts";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getEmotionPageData } from "@/lib/server/emotionPageData";

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
  // All catalogue lookups + visual derivations happen here, on the server.
  // The client component receives a single, fully-materialised payload —
  // it imports zero seed catalogues, zero derivation libraries, and zero
  // resonance-engine code. See lib/server/emotionPageData.ts for the
  // rationale and what's pre-computed.
  const pageData = getEmotionPageData(decodeURIComponent(slug));
  if (!pageData) notFound();

  // Per-page font loading. We split the typeset into two requests so
  // they can use different `font-display` strategies — see
  // lib/fontStylesheet.ts for the rationale. Title font uses `swap`
  // (FOUT acceptable, identity visible); body/literary/technical use
  // `optional` (no mid-paint jank).
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
      <EmotionDetail pageData={pageData} />
    </>
  );
}
