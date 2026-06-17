export const runtime = 'edge';

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmotionOverview } from "@/components/editorial/EmotionOverview";
import { emotionTypeSet } from "@/lib/emotionFonts";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getEmotionOverviewData } from "@/lib/server/emotionOverviewData";
import { PerfBeacon } from "@/components/devtools/PerfBeacon";
import { fetchEmotion, fetchAllEmotionIds } from "@/lib/server/supabase-queries";

/**
 * /emotion/[slug] — the slim overview view.
 *
 * Queries Supabase for emotion data. On-demand rendering with edge runtime.
 * Changes in Supabase = instant updates (no rebuild).
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const emotion = await fetchEmotion(decodedSlug);
  if (!emotion) {
    return { title: "Álbum" };
  }

  return {
    title: `${emotion.name} — Álbum`,
    description: emotion.poetic_intro || undefined,
  };
}

export default async function EmotionPage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const emotion = await fetchEmotion(decodedSlug);
  if (!emotion) notFound();

  // Use local helper to build presentation (still uses local data, that's ok)
  // In future, this could query Supabase for full pageData too
  const pageData = getEmotionOverviewData(decodedSlug);
  if (!pageData) notFound();

  const { primary: titleFontUrl, supporting: bodyFontsUrl } =
    buildTypeSetUrls(emotionTypeSet(decodedSlug));

  return (
    <>
      {titleFontUrl && (
        <link rel="stylesheet" href={titleFontUrl} precedence="emergent-fonts" />
      )}
      {bodyFontsUrl && (
        <link rel="stylesheet" href={bodyFontsUrl} precedence="emergent-fonts" />
      )}
      <EmotionOverview pageData={pageData} />
      <PerfBeacon page="emotion-overview" />
    </>
  );
}
