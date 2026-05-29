import { CollectionView } from "@/components/collection/CollectionView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Colección — Álbum",
  description: "Tu archivo personal de atmósferas, emociones y constelaciones.",
};

export default function CollectionPage() {
  return <CollectionView />;
}
