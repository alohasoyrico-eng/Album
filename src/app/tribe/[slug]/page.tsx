export const runtime = 'edge';

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TribeView } from "@/components/editorial/TribeView";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getTribePageData } from "@/lib/server/tribePageData";
import { fetchTribe, fetchAllTribeIds } from "@/lib/server/supabase-queries";

interface Params { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tribe = await fetchTribe(slug);
  if (!tribe) return { title: "Tribu no encontrada — Álbum" };
  return {
    title: `${tribe.name} — Tribu emocional — Álbum`,
    description: tribe.description || undefined,
  };
}

export default async function TribePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tribe = await fetchTribe(slug);
  if (!tribe) notFound();

  const pageData = getTribePageData(slug);
  if (!pageData) notFound();

  const { primary: titleFontUrl, supporting: bodyFontsUrl } =
    buildTypeSetUrls(pageData.presentation.typeSet);

  return (
    <>
      {titleFontUrl && (
        <link rel="stylesheet" href={titleFontUrl} precedence="emergent-fonts" />
      )}
      {bodyFontsUrl && (
        <link rel="stylesheet" href={bodyFontsUrl} precedence="emergent-fonts" />
      )}
      <TribeView pageData={pageData} />
    </>
  );
}
