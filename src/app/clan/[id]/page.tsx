import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CLANS, CLAN_MAP } from "@/data/ontology/clans";
import { ClanView } from "@/components/editorial/ClanView";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";
import { getClanPageData } from "@/lib/server/clanPageData";

interface Params { id: string }

export function generateStaticParams() {
  return CLANS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const clan = CLAN_MAP.get(id);
  if (!clan) return { title: "Clan no encontrado — Álbum" };
  return {
    title: `${clan.name} — Clan emocional — Álbum`,
    description: clan.description,
  };
}

export default async function ClanPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  // All catalogue lookups + visual derivations on the server. ClanView
  // ships zero seed data + zero resonance-engine code to the client.
  const pageData = getClanPageData(id);
  if (!pageData) notFound();

  // Per-page font loading from the clan's pre-derived typeSet.
  const fontUrl = buildTypeSetUrl(pageData.presentation.typeSet);

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <ClanView pageData={pageData} />
    </>
  );
}
