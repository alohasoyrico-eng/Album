export const runtime = 'edge';

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EmotionDetail } from "@/components/editorial/EmotionDetail";
import { emotionTypeSet } from "@/lib/emotionFonts";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getEmotionPageData } from "@/lib/server/emotionPageData";
import { PerfBeacon } from "@/components/devtools/PerfBeacon";
import { fetchEmotion, fetchAllEmotionIds } from "@/lib/server/supabase-queries";

/**
 * /emotion/[slug]/explore — the deep view.
 *
 * All the heavy sections that used to live on /emotion/[slug] are
 * now here: 11 cultural disciplines, EmergentResonance (4 modes ×
 * top-12 hits), PathwayDrift (semantic walking), PluralReadings +
 * Participation, ParticipationModule.
 *
 * Reached via the "Explorar más" CTA at the bottom of the overview.
 * Visitors who don't follow that link never pay the cost.
 *
 * Queries Supabase on-demand via edge runtime.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const emotion = await fetchEmotion(decodedSlug);
  if (!emotion) return { title: "Álbum" };
  return {
    title: `${emotion.name} · Explorar — Álbum`,
    description: `Disciplinas culturales, resonancia emergente y lecturas plurales en torno a ${emotion.name.toLowerCase()}.`,
  };
}

export default async function EmotionExplorePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const emotion = await fetchEmotion(decodedSlug);
  if (!emotion) notFound();

  const pageData = getEmotionPageData(decodedSlug);
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
      <div
        className="fixed top-20 left-4 z-30 pointer-events-auto"
        style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
      >
        <Link
          href={`/emotion/${decodedSlug}`}
          className="inline-flex items-center gap-2 text-xs text-ink-faint hover:text-ink transition-colors px-3 py-2 rounded-full border border-album bg-white/[0.03] backdrop-blur"
        >
          ← Overview
        </Link>
      </div>
      <EmotionDetail pageData={pageData} />
      <PerfBeacon page="emotion-explore" />
    </>
  );
}
