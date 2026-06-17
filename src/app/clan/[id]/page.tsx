export const runtime = 'edge';

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClanView } from "@/components/editorial/ClanView";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getClanPageData } from "@/lib/server/clanPageData";
import { fetchClan, fetchAllClanIds } from "@/lib/server/supabase-queries";

interface Params { id: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const clan = await fetchClan(id);
  if (!clan) return { title: "Clan no encontrado — Álbum" };
  return {
    title: `${clan.name} — Clan emocional — Álbum`,
    description: clan.description || undefined,
  };
}

export default async function ClanPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const clan = await fetchClan(id);
  if (!clan) notFound();

  const pageData = getClanPageData(id);
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
      <ClanView pageData={pageData} />
    </>
  );
}
