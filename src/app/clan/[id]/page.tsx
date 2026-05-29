import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CLANS, CLAN_MAP } from "@/data/ontology/clans";
import { TRIBE_MAP } from "@/data/ontology/tribes";
import { EMOTIONS, EMOTION_MAP } from "@/data/ontology/emotions";
import { ClanView } from "@/components/editorial/ClanView";
import { groupCentroidResonance } from "@/lib/resonance-engine";
import { deriveTypeSet } from "@/lib/typeset";
import { buildTypeSetUrl } from "@/lib/fontStylesheet";

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
  const clan = CLAN_MAP.get(id);
  if (!clan) notFound();

  const tribe = TRIBE_MAP.get(clan.tribe);
  if (!tribe) notFound();

  // Canonical emotion (if any)
  const canonical = clan.canonicalEmotion ? EMOTION_MAP.get(clan.canonicalEmotion) : null;

  // All emotions in the catalog that belong to this clan
  const clanEmotions = EMOTIONS.filter((e) => e.clan === clan.id);

  // Sibling clans (same tribe, ordered)
  const siblings = CLANS.filter((c) => c.tribe === tribe.id);
  const idx = siblings.findIndex((c) => c.id === clan.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  // Per-page font loading from the clan centroid. If a canonical emotion
  // exists, use its assigned typeset (so the clan title voice matches its
  // anchor emotion). Otherwise derive from the centroid via band picker.
  const centroid = clanEmotions.length > 0
    ? groupCentroidResonance(clanEmotions)
    : (canonical?.resonance ?? null);
  const fontUrl = centroid
    ? buildTypeSetUrl(deriveTypeSet(centroid, canonical?.id))
    : null;

  return (
    <>
      {fontUrl && (
        <link rel="stylesheet" href={fontUrl} precedence="emergent-fonts" />
      )}
      <ClanView
        clan={clan}
        tribe={tribe}
        canonical={canonical ?? null}
        clanEmotions={clanEmotions}
        siblings={siblings}
        prev={prev}
        next={next}
      />
    </>
  );
}
