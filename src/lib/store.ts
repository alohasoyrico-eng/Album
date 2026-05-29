"use client";

import { create } from "zustand";
import type {
  Atmosphere,
  Collection,
  EmotionId,
  TribeId,
  NodeType,
  MapNode,
  MapLink,
} from "@/types";
import { trackEvent } from "./analytics";

// ─── Map Store ───────────────────────────────────────────────────────────────

interface MapStore {
  hoveredNode: string | null;
  selectedNode: string | null;
  activeFilter: NodeType | null;
  activeTribe: TribeId | null;
  zoom: number;
  expandedNodes: Set<string>;
  highlightedPath: string[];

  setHoveredNode: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  setActiveFilter: (filter: NodeType | null) => void;
  setActiveTribe: (tribe: TribeId | null) => void;
  setZoom: (zoom: number) => void;
  expandNode: (id: string) => void;
  setHighlightedPath: (path: string[]) => void;
  reset: () => void;
}

export const useMapStore = create<MapStore>((set) => ({
  hoveredNode: null,
  selectedNode: null,
  activeFilter: null,
  activeTribe: null,
  zoom: 1,
  expandedNodes: new Set(),
  highlightedPath: [],

  setHoveredNode: (id) => set({ hoveredNode: id }),
  setSelectedNode: (id) => {
    if (id) {
      trackEvent("node_clicked", { nodeId: id });
    }
    set({ selectedNode: id });
  },
  setActiveFilter: (filter) => {
    if (filter) trackEvent("filter_applied", { filter });
    set({ activeFilter: filter });
  },
  setActiveTribe: (tribe) => set({ activeTribe: tribe }),
  setZoom: (zoom) => set({ zoom }),
  expandNode: (id) =>
    set((state) => {
      const next = new Set(state.expandedNodes);
      next.add(id);
      trackEvent("constellation_expanded", { nodeId: id });
      return { expandedNodes: next };
    }),
  setHighlightedPath: (path) => {
    if (path.length > 1) {
      trackEvent("emotional_path_followed", { length: path.length, start: path[0], end: path[path.length - 1] });
    }
    set({ highlightedPath: path });
  },
  reset: () => set({ hoveredNode: null, selectedNode: null, activeFilter: null, activeTribe: null, highlightedPath: [] }),
}));

// ─── Atmosphere Builder Store ─────────────────────────────────────────────────

interface AtmosphereBuilderStore {
  selectedEmotion: EmotionId | null;
  selectedColor: string | null;
  selectedFont: string | null;
  selectedArtwork: string | null;
  selectedTrack: string | null;
  selectedFilm: string | null;
  selectedPoem: string | null;
  generatedAtmosphere: Atmosphere | null;
  isGenerating: boolean;

  setEmotion: (id: EmotionId | null) => void;
  setColor: (id: string | null) => void;
  setFont: (id: string | null) => void;
  setArtwork: (id: string | null) => void;
  setTrack: (id: string | null) => void;
  setFilm: (id: string | null) => void;
  setPoem: (id: string | null) => void;
  setGeneratedAtmosphere: (atm: Atmosphere | null) => void;
  setIsGenerating: (v: boolean) => void;
  reset: () => void;
}

export const useAtmosphereBuilderStore = create<AtmosphereBuilderStore>((set) => ({
  selectedEmotion: null,
  selectedColor: null,
  selectedFont: null,
  selectedArtwork: null,
  selectedTrack: null,
  selectedFilm: null,
  selectedPoem: null,
  generatedAtmosphere: null,
  isGenerating: false,

  setEmotion: (id) => set({ selectedEmotion: id }),
  setColor: (id) => set({ selectedColor: id }),
  setFont: (id) => set({ selectedFont: id }),
  setArtwork: (id) => set({ selectedArtwork: id }),
  setTrack: (id) => set({ selectedTrack: id }),
  setFilm: (id) => set({ selectedFilm: id }),
  setPoem: (id) => set({ selectedPoem: id }),
  setGeneratedAtmosphere: (atm) => {
    if (atm) trackEvent("atmosphere_generated", { name: atm.name, emotion: atm.emotion });
    set({ generatedAtmosphere: atm });
  },
  setIsGenerating: (v) => set({ isGenerating: v }),
  reset: () => set({
    selectedEmotion: null,
    selectedColor: null,
    selectedFont: null,
    selectedArtwork: null,
    selectedTrack: null,
    selectedFilm: null,
    selectedPoem: null,
    generatedAtmosphere: null,
    isGenerating: false,
  }),
}));

// ─── Collections Store (persisted) ───────────────────────────────────────────

interface CollectionsStore {
  collections: Collection[];
  activeCollectionId: string | null;

  createCollection: (name: string) => Collection;
  addAtmosphere: (collectionId: string, atmosphere: Atmosphere) => void;
  saveEmotion: (emotionId: EmotionId) => void;
  saveArtwork: (artworkId: string) => void;
  saveTrack: (trackId: string) => void;
  saveFilm: (filmId: string) => void;
  savePoem: (poemId: string) => void;
  setActiveCollection: (id: string | null) => void;
  getDefaultCollection: () => Collection;
}

function makeCollection(name: string): Collection {
  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    atmospheres: [],
    emotionPath: [],
    savedEmotions: [],
    savedArtworks: [],
    savedMusic: [],
    savedFilms: [],
    savedPoems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const COLLECTIONS_KEY = "album-collections";

function loadCollections(): { collections: Collection[]; activeCollectionId: string | null } {
  if (typeof window === "undefined") return { collections: [], activeCollectionId: null };
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_KEY);
    return raw ? JSON.parse(raw) : { collections: [], activeCollectionId: null };
  } catch {
    return { collections: [], activeCollectionId: null };
  }
}

function saveCollections(state: { collections: Collection[]; activeCollectionId: string | null }) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(state)); } catch {}
}

export const useCollectionsStore = create<CollectionsStore>()((set, get) => ({
  collections: [],
  activeCollectionId: null,

  createCollection: (name) => {
    const col = makeCollection(name);
    set((s) => {
      const next = { collections: [...s.collections, col], activeCollectionId: col.id };
      saveCollections(next);
      return next;
    });
    trackEvent("collection_created", { name });
    return col;
  },

  addAtmosphere: (collectionId, atmosphere) => {
    set((s) => {
      const next = { ...s, collections: s.collections.map((c) =>
        c.id === collectionId
          ? { ...c, atmospheres: [...c.atmospheres, atmosphere], updatedAt: new Date().toISOString() }
          : c
      )};
      saveCollections(next);
      return next;
    });
    trackEvent("atmosphere_saved", { atmosphereName: atmosphere.name });
  },

  saveEmotion: (emotionId) => {
    const col = get().getDefaultCollection();
    set((s) => {
      const next = { ...s, collections: s.collections.map((c) =>
        c.id === col.id && !c.savedEmotions.includes(emotionId)
          ? { ...c, savedEmotions: [...c.savedEmotions, emotionId], updatedAt: new Date().toISOString() }
          : c
      )};
      saveCollections(next);
      return next;
    });
  },

  saveArtwork: (artworkId) => {
    const col = get().getDefaultCollection();
    set((s) => {
      const next = { ...s, collections: s.collections.map((c) =>
        c.id === col.id && !c.savedArtworks.includes(artworkId)
          ? { ...c, savedArtworks: [...c.savedArtworks, artworkId], updatedAt: new Date().toISOString() }
          : c
      )};
      saveCollections(next);
      return next;
    });
  },

  saveTrack: (trackId) => {
    const col = get().getDefaultCollection();
    set((s) => {
      const next = { ...s, collections: s.collections.map((c) =>
        c.id === col.id && !c.savedMusic.includes(trackId)
          ? { ...c, savedMusic: [...c.savedMusic, trackId], updatedAt: new Date().toISOString() }
          : c
      )};
      saveCollections(next);
      return next;
    });
  },

  saveFilm: (filmId) => {
    const col = get().getDefaultCollection();
    set((s) => {
      const next = { ...s, collections: s.collections.map((c) =>
        c.id === col.id && !c.savedFilms.includes(filmId)
          ? { ...c, savedFilms: [...c.savedFilms, filmId], updatedAt: new Date().toISOString() }
          : c
      )};
      saveCollections(next);
      return next;
    });
  },

  savePoem: (poemId) => {
    const col = get().getDefaultCollection();
    set((s) => {
      const next = { ...s, collections: s.collections.map((c) =>
        c.id === col.id && !c.savedPoems.includes(poemId)
          ? { ...c, savedPoems: [...c.savedPoems, poemId], updatedAt: new Date().toISOString() }
          : c
      )};
      saveCollections(next);
      return next;
    });
  },

  setActiveCollection: (id) => {
    set((s) => {
      const next = { ...s, activeCollectionId: id };
      saveCollections(next);
      return next;
    });
  },

  getDefaultCollection: () => {
    const { collections, createCollection, activeCollectionId } = get();
    if (activeCollectionId) {
      const active = collections.find((c) => c.id === activeCollectionId);
      if (active) return active;
    }
    if (collections.length > 0) return collections[0];
    return createCollection("Mi constelación");
  },
}));

// ─── Participation Store ─────────────────────────────────────────────────────

const PARTICIPATION_KEY = "album-participation";

function loadAnswered(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(PARTICIPATION_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveAnswered(prompts: Set<string>) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(PARTICIPATION_KEY, JSON.stringify(Array.from(prompts))); } catch {}
}

interface ParticipationStore {
  answeredPrompts: Set<string>;
  markAnswered: (promptId: string) => void;
  hasAnswered: (promptId: string) => boolean;
}

export const useParticipationStore = create<ParticipationStore>()((set, get) => ({
  answeredPrompts: new Set(),
  markAnswered: (promptId) => {
    set((s) => {
      const next = new Set(Array.from(s.answeredPrompts).concat(promptId));
      saveAnswered(next);
      return { answeredPrompts: next };
    });
  },
  hasAnswered: (promptId) => get().answeredPrompts.has(promptId),
}));
