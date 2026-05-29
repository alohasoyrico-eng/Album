/**
 * Unified search index across all Álbum entities.
 *
 * At module load we build a flat list of every searchable record:
 *   - 72 emotions, 58 clans, 22 tribes
 *   - 224 colours, 91 typographies
 *   - ~1100 cultural items (artworks, music, films, poetry, sculpture,
 *     dance, architecture, photography, literature, ritual, theater)
 *
 * Each record gets a normalized title + a haystack string concatenating
 * everything queryable: name, synonyms, tribe, atmosphere tags, author,
 * year. The search function does cheap substring + word-prefix matching
 * with a small ranking heuristic — fast enough to run on keystroke for
 * ~1500 records without a fuzzy library.
 */

import { EMOTIONS } from "@/data/ontology/emotions";
import { CLANS } from "@/data/ontology/clans";
import { TRIBES, TRIBE_MAP } from "@/data/ontology/tribes";
import { COLORS } from "@/data/colors/colorResonance";
import { TYPOGRAPHY } from "@/data/typography/fonts";
import { ARTWORKS } from "@/data/seed/artworks";
import { TRACKS } from "@/data/seed/music";
import { FILMS } from "@/data/seed/films";
import { POEMS } from "@/data/seed/poetry";
import { SCULPTURES } from "@/data/seed/sculpture";
import { DANCES } from "@/data/seed/dance";
import { ARCHITECTURES } from "@/data/seed/architecture";
import { PHOTOGRAPHS } from "@/data/seed/photography";
import { LITERATURES } from "@/data/seed/literature";
import { RITUALS } from "@/data/seed/ritual";
import { THEATERS } from "@/data/seed/theater";

export type SearchKind =
  | "emotion" | "clan" | "tribe" | "color" | "typography"
  | "artwork" | "music" | "film" | "poem"
  | "sculpture" | "dance" | "architecture" | "photography"
  | "literature" | "ritual" | "theater";

export interface SearchRecord {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;     // 1 line of context
  href: string;
  /** Lowercased haystack — name + synonyms + tags + author etc. */
  haystack: string;
  /** Optional accent colour for visual badge. */
  accent?: string;
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function buildIndex(): SearchRecord[] {
  const out: SearchRecord[] = [];

  // Emotions
  for (const e of EMOTIONS) {
    const tribe = TRIBE_MAP.get(e.tribe);
    const hay = [e.name, e.nameEn, ...(e.neighbors ?? []), ...(e.antonyms ?? []),
                 e.tribe, e.clan, ...(e.atmosphereTags ?? [])].join(" ");
    out.push({
      id: e.id, kind: "emotion",
      title: e.name,
      subtitle: `${tribe?.name ?? e.tribe} · ${e.clan}`,
      href: `/emotion/${e.id}`,
      haystack: norm(hay),
      accent: tribe?.color,
    });
  }

  // Clans
  for (const c of CLANS) {
    const tribe = TRIBE_MAP.get(c.tribe);
    const hay = [c.name, c.description, c.tribe, ...c.feelings, ...c.antonyms].join(" ");
    out.push({
      id: c.id, kind: "clan",
      title: c.name,
      subtitle: `Clan · ${tribe?.name ?? c.tribe}`,
      href: `/clan/${c.id}`,
      haystack: norm(hay),
      accent: tribe?.color,
    });
  }

  // Tribes
  for (const t of TRIBES) {
    const hay = [t.name, t.description].join(" ");
    out.push({
      id: t.id, kind: "tribe",
      title: t.name,
      subtitle: "Tribu emocional",
      href: `/tribe/${t.id}`,
      haystack: norm(hay),
      accent: t.color,
    });
  }

  // Colours
  for (const c of COLORS) {
    const hay = [c.nameEs, c.name, c.hex].join(" ");
    out.push({
      id: c.id, kind: "color",
      title: c.nameEs,
      subtitle: `Color · ${c.hex.toUpperCase()}`,
      href: `/color/${c.id}`,
      haystack: norm(hay),
      accent: c.hex,
    });
  }

  // Typographies — no detail page yet, but searchable
  for (const t of TYPOGRAPHY) {
    const hay = [t.name, t.googleFontFamily, t.category,
                 ...(t.emotionResonance ?? [])].join(" ");
    out.push({
      id: t.id, kind: "typography",
      title: t.name,
      subtitle: `Tipografía · ${t.category}`,
      href: `/atmosphere?font=${encodeURIComponent(t.id)}`,
      haystack: norm(hay),
    });
  }

  // Cultural disciplines — author / title / year / medium / culture
  const cultural: Array<[SearchKind, Array<{
    id: string; title?: string; artist?: string; author?: string;
    director?: string; choreographer?: string; architect?: string;
    photographer?: string; year?: string | number; medium?: string;
    culture?: string; description?: string;
  }>]> = [
    ["artwork", ARTWORKS], ["music", TRACKS], ["film", FILMS],
    ["poem", POEMS], ["sculpture", SCULPTURES], ["dance", DANCES],
    ["architecture", ARCHITECTURES], ["photography", PHOTOGRAPHS],
    ["literature", LITERATURES], ["ritual", RITUALS], ["theater", THEATERS],
  ];

  const KIND_LABEL: Record<SearchKind, string> = {
    emotion: "Emoción", clan: "Clan", tribe: "Tribu",
    color: "Color", typography: "Tipografía",
    artwork: "Pintura", music: "Música", film: "Cine",
    poem: "Poesía", sculpture: "Escultura", dance: "Danza",
    architecture: "Arquitectura", photography: "Fotografía",
    literature: "Literatura", ritual: "Ritual", theater: "Teatro",
  };

  for (const [kind, list] of cultural) {
    for (const item of list) {
      const author = item.artist || item.author || item.director
                  || item.choreographer || item.architect || item.photographer
                  || "";
      const title = item.title || `${author}`.trim();
      const hay = [title, author, String(item.year ?? ""), item.medium ?? "",
                   item.culture ?? "", item.description ?? ""].join(" ");
      out.push({
        id: item.id, kind,
        title: title || item.id,
        subtitle: [KIND_LABEL[kind], author, item.year].filter(Boolean).join(" · "),
        href: "#",
        haystack: norm(hay),
      });
    }
  }

  return out;
}

let _index: SearchRecord[] | null = null;
function index(): SearchRecord[] {
  if (!_index) _index = buildIndex();
  return _index;
}

/**
 * Score a record against a query. Higher is better.
 *   exact title match → 1000
 *   title starts-with → 500
 *   word-prefix in haystack → 100 per term
 *   substring in haystack  → 10 per term
 *   penalize long titles slightly (prefer concise hits)
 */
function score(rec: SearchRecord, terms: string[]): number {
  if (terms.length === 0) return 0;
  const title = norm(rec.title);
  let s = 0;
  for (const t of terms) {
    if (title === t) s += 1000;
    else if (title.startsWith(t)) s += 500;
    if (rec.haystack.includes(` ${t}`) || rec.haystack.startsWith(t)) s += 100;
    if (rec.haystack.includes(t)) s += 10;
  }
  // Tie-breakers: prefer shorter titles (concise wins)
  s -= title.length * 0.05;
  return s;
}

export function searchAll(query: string, limit = 40): SearchRecord[] {
  const q = norm(query.trim());
  if (q.length === 0) return [];
  const terms = q.split(/\s+/).filter((t) => t.length >= 1);
  const all = index();
  const scored: Array<{ rec: SearchRecord; s: number }> = [];
  for (const rec of all) {
    const s = score(rec, terms);
    if (s > 0) scored.push({ rec, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.rec);
}

/**
 * For empty queries: surface a curated "discovery" set so the palette
 * is useful even with no input. Mixes the highest-resonance emotions,
 * a handful of clans, and a few canonical art pieces.
 */
export function recentSuggestions(limit = 12): SearchRecord[] {
  const all = index();
  const emos = all.filter((r) => r.kind === "emotion").slice(0, 6);
  const tribes = all.filter((r) => r.kind === "tribe").slice(0, 3);
  const colors = all.filter((r) => r.kind === "color").slice(0, 3);
  return [...emos, ...tribes, ...colors].slice(0, limit);
}
