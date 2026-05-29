// PoetryDB API — no key required
// https://poetrydb.org/

const BASE = "https://poetrydb.org";

export interface PoetryDBPoem {
  title: string;
  author: string;
  lines: string[];
  linecount: string;
}

export async function getPoemByTitle(title: string): Promise<PoetryDBPoem | null> {
  try {
    const res = await fetch(`${BASE}/title/${encodeURIComponent(title)}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 404) return null;
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

export async function getPoemsByAuthor(author: string, limit = 5): Promise<PoetryDBPoem[]> {
  try {
    const res = await fetch(`${BASE}/author/${encodeURIComponent(author)}`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status === 404) return [];
    return (Array.isArray(data) ? data : []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getRandomPoem(): Promise<PoetryDBPoem | null> {
  try {
    const res = await fetch(`${BASE}/random`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : null;
  } catch {
    return null;
  }
}

export async function searchPoems(keyword: string, limit = 5): Promise<PoetryDBPoem[]> {
  try {
    const res = await fetch(`${BASE}/lines/${encodeURIComponent(keyword)};abs`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status === 404) return [];
    return (Array.isArray(data) ? data : []).slice(0, limit);
  } catch {
    return [];
  }
}

// Curated PoetryDB poems by emotion
export const POETRYDB_POEMS: Record<string, Array<{ title: string; author: string }>> = {
  melancolía: [
    { title: "When I Have Fears That I May Cease to Be", author: "John Keats" },
    { title: "Alone", author: "Edgar Allan Poe" },
  ],
  amor: [
    { title: "How Do I Love Thee?", author: "Elizabeth Barrett Browning" },
    { title: "Sonnet 18", author: "William Shakespeare" },
  ],
  tristeza: [
    { title: "Grief", author: "Elizabeth Barrett Browning" },
  ],
  serenidad: [
    { title: "I Wandered Lonely as a Cloud", author: "William Wordsworth" },
  ],
  admiración: [
    { title: "I Hear America Singing", author: "Walt Whitman" },
  ],
};
