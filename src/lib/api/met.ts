// Met Museum Open Access API — no key required
// https://metmuseum.github.io/

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

export interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  medium: string;
  culture: string;
  period: string;
  primaryImage: string;
  primaryImageSmall: string;
  additionalImages: string[];
  tags: Array<{ term: string }>;
  artistNationality: string;
  department: string;
  objectURL: string;
  isPublicDomain: boolean;
}

export async function getMetObject(objectId: number): Promise<MetObject | null> {
  try {
    const res = await fetch(`${BASE}/objects/${objectId}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function searchMet(query: string, isPublicDomain = true): Promise<number[]> {
  try {
    const params = new URLSearchParams({ q: query, isPublicDomain: String(isPublicDomain) });
    const res = await fetch(`${BASE}/search?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.objectIDs?.slice(0, 20) ?? [];
  } catch {
    return [];
  }
}

// Curated emotional artwork IDs from the Met (public domain)
export const MET_EMOTIONAL_ARTWORKS: Record<string, number[]> = {
  melancolía: [437984, 436535, 39646], // Van Gogh + other contemplative works
  alegría: [437980, 210191],
  miedo: [11417, 45434],
  amor: [193743, 437881],
  serenidad: [436528, 344791],
};
