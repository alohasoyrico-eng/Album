import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { COLORS, COLOR_MAP } from "@/data/colors/colorResonance";
import { ColorView } from "@/components/editorial/ColorView";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";
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

  const fontUrl = buildTypeSetUrl(pageData.presentation.typeSet);

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <ColorView pageData={pageData} />
    </>
  );
}
