import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COLORS, COLOR_MAP } from "@/data/colors/colorResonance";
import { ColorView } from "@/components/editorial/ColorView";
import { buildTypeSetUrls } from "@/lib/fontStylesheet";
import { getColorPageData } from "@/lib/server/colorPageData";

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
