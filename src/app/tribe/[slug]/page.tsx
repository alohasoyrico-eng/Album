import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TRIBES, TRIBE_MAP } from "@/data/ontology/tribes";
import { CLANS_BY_TRIBE } from "@/data/ontology/clans";
import { EMOTIONS } from "@/data/ontology/emotions";
import { TribeView } from "@/components/editorial/TribeView";
import type { TribeId } from "@/types";
import { groupCentroidResonance } from "@/lib/resonance-engine";
import { deriveTypeSet } from "@/lib/typeset";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";

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
  const tribe = TRIBE_MAP.get(slug as TribeId);
  if (!tribe) notFound();

  const clans = CLANS_BY_TRIBE[tribe.id] ?? [];
  const tribeEmotions = EMOTIONS.filter((e) => e.tribe === tribe.id);

  const fontUrl = tribeEmotions.length > 0
    ? buildTypeSetUrl(deriveTypeSet(groupCentroidResonance(tribeEmotions)))
    : null;

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <TribeView tribe={tribe} clans={clans} emotions={tribeEmotions} />
    </>
  );
}
