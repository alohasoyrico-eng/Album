import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRIBES, TRIBE_MAP } from "@/data/ontology/tribes";
import { TribeView } from "@/components/editorial/TribeView";
import type { TribeId } from "@/types";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";
import { getTribePageData } from "@/lib/server/tribePageData";

interface Params { slug: string }

export function generateStaticParams() {
  return TRIBES.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tribe = TRIBE_MAP.get(slug as TribeId);
  if (!tribe) return { title: "Tribu no encontrada — Álbum" };
  return {
    title: `${tribe.name} — Tribu emocional — Álbum`,
    description: tribe.description,
  };
}

export default async function TribePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const pageData = getTribePageData(slug);
  if (!pageData) notFound();

  const fontUrl = buildTypeSetUrl(pageData.presentation.typeSet);

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <TribeView pageData={pageData} />
    </>
  );
}
