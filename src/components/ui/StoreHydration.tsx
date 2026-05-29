"use client";

import { useEffect } from "react";
import { useCollectionsStore, useParticipationStore } from "@/lib/store";
import type { Collection } from "@/types";

export function StoreHydration() {
  useEffect(() => {
    // Hydrate collections store from localStorage
    try {
      const collectionsRaw = window.localStorage.getItem("album-collections");
      if (collectionsRaw) {
        const { collections, activeCollectionId } = JSON.parse(collectionsRaw) as {
          collections: Collection[];
          activeCollectionId: string | null;
        };
        useCollectionsStore.setState({ collections, activeCollectionId });
      }
    } catch {}

    // Hydrate participation store from localStorage
    try {
      const participationRaw = window.localStorage.getItem("album-participation");
      if (participationRaw) {
        const ids = JSON.parse(participationRaw) as string[];
        useParticipationStore.setState({ answeredPrompts: new Set(ids) });
      }
    } catch {}
  }, []);

  return null;
}
