// Art Institute of Chicago API — no key required
// https://api.artic.edu/docs/

const BASE = "https://api.artic.edu/api/v1";
const IMAGE_BASE = "https://www.artic.edu/iiif/2";

export interface ArticArtwork {
  id: number;
  title: string;
  artist_display: string;
  date_display: string;
  medium_display: string;
  place_of_origin: string;
  description: string | null;
  image_id: string | null;
  thumbnail: { alt_text?: string } | null;
  style_titles: string[];
  subject_titles: string[];
  technique_titles: string[];
  artwork_type_title: string;
}

export function getArticImageUrl(imageId: string, size = 843): string {
  return `${IMAGE_BASE}/${imageId}/full/${size},/0/default.jpg`;
}

export async function getArticArtwork(id: number): Promise<ArticArtwork | null> {
  try {
    const fields = "id,title,artist_display,date_display,medium_display,place_of_origin,description,image_id,thumbnail,style_titles,subject_titles,technique_titles,artwork_type_title";
    const res = await fetch(`${BASE}/artworks/${id}?fields=${fields}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function searchArtic(query: string, limit = 10): Promise<ArticArtwork[]> {
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit), fields: "id,title,artist_display,date_display,image_id,style_titles" });
    const res = await fetch(`${BASE}/artworks/search?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

// Curated ARTIC artwork IDs
export const ARTIC_EMOTIONAL_ARTWORKS: Record<string, number[]> = {
  serenidad: [27992], // Sunday on La Grande Jatte
  melancolía: [16568, 28560],
  amor: [14572],
  miedo: [11397],
};
