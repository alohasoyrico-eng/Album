export const runtime = 'edge';

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ColorView } from "@/components/editorial/ColorView";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getColorPageData } from "@/lib/server/colorPageData";
import { fetchColor, fetchAllColorIds } from "@/lib/server/supabase-queries";

interface Params { id: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const color = await fetchColor(id);
  if (!color) return { title: "Color no encontrado — Álbum" };
  return {
    title: `${color.name_es} — Atlas cromático — Álbum`,
    description: color.description || undefined,
  };
}

export default async function ColorPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const color = await fetchColor(id);
  if (!color) notFound();

  const pageData = getColorPageData(id);
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
      <ColorView pageData={pageData} />
    </>
  );
}
