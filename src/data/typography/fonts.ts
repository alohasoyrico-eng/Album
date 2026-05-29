import type { TypographyResonance } from "@/types";
import { TYPOGRAPHY_EXTENDED } from "./fonts-extended";

/**
 * 8 hand-authored canonical fonts with curated emotional tone descriptions
 * and full Google Font integration. Plus 83 derived fonts spanning all
 * typographic axes (humanist, transitional, modern, slab, neo-grotesque,
 * geometric, humanist sans, mono, display, handwriting, blackletter).
 *
 * The resonance engine indexes all of them in the same vector space.
 */
const CANONICAL_TYPOGRAPHY: TypographyResonance[] = [
  {
    id: "garamond",
    name: "Garamond",
    googleFontFamily: "EB Garamond",
    category: "serif",
    description: "El tipo de letra de la memoria literaria occidental. Diseñado por Claude Garamond en el siglo XVI, sobrevivió cinco siglos porque encontró la forma perfecta de la voz humana escrita.",
    emotionalTone: "Literary, contemplative, melancholic elegance",
    resonance: { energy: 22, temperature: 52, tension: 28, density: 48, movement: 15, temporality: 95, humanity: 88, clarity: 68, intimacy: 78, control: 62 },
    emotionResonance: ["melancolía", "nostalgia", "serenidad", "amor", "añoranza"],
    specimen: "La melancolía tiene el peso exacto de las palabras que no se dicen.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "1540 — Claude Garamond, Paris",
    historicalContext: "Born in Renaissance Paris, Garamond's type became the voice of humanism — scholarly, precise, deeply human.",
  },
  {
    id: "bodoni",
    name: "Bodoni",
    googleFontFamily: "Libre Bodoni",
    category: "serif",
    description: "El extremo del contraste: trazo fino como un filo, trazo grueso como el silencio después del grito. Giambattista Bodoni llevó la tipografía al límite de su propia drama.",
    emotionalTone: "Dramatic tension, high contrast, elegant severity",
    resonance: { energy: 65, temperature: 38, tension: 88, density: 55, movement: 28, temporality: 72, humanity: 52, clarity: 75, intimacy: 25, control: 85 },
    emotionResonance: ["angustia", "pasión", "ira", "sublimidad"],
    specimen: "Entre el trazo fino y el grueso habita toda la tensión del mundo.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "1798 — Giambattista Bodoni, Parma",
    historicalContext: "Bodoni was the typographic equivalent of high drama — born in the neoclassical age, still used for luxury brands and fashion.",
  },
  {
    id: "helvetica",
    name: "Helvetica",
    googleFontFamily: "Inter",
    category: "sans-serif",
    description: "La tipografía que quiso ser invisible — y se convirtió en la más reconocible del mundo. Diseñada en 1957 para eliminar la expresión, terminó siendo la expresión de la modernidad.",
    emotionalTone: "Rational neutrality, cool distance, institutional clarity",
    resonance: { energy: 48, temperature: 28, tension: 38, density: 42, movement: 38, temporality: 42, humanity: 28, clarity: 92, intimacy: 15, control: 95 },
    emotionResonance: ["angustia", "ansiedad", "desprecio", "claridad"],
    specimen: "La neutralidad perfecta también es una posición.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "1957 — Max Miedinger, Switzerland",
    historicalContext: "Helvetica became the typeface of institutions — airports, corporations, governments. Its neutrality is itself a statement.",
  },
  {
    id: "courier",
    name: "Courier",
    googleFontFamily: "Courier Prime",
    category: "monospace",
    description: "La letra de la máquina de escribir: cada carácter ocupa el mismo espacio, como si el tiempo se midiera en letras. Hay algo de soledad en su uniformidad mecánica.",
    emotionalTone: "Archival melancholy, typewriter nostalgia, raw documentation",
    resonance: { energy: 32, temperature: 38, tension: 42, density: 52, movement: 8, temporality: 88, humanity: 72, clarity: 62, intimacy: 55, control: 68 },
    emotionResonance: ["nostalgia", "melancolía", "soledad", "culpa"],
    specimen: "Todo lo que se escribe en esta letra parece un testimonio.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "1955 — Howard Kettler, IBM",
    historicalContext: "Courier was the typeface of the 20th century document — the memo, the screenplay, the confession.",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    googleFontFamily: "Playfair Display",
    category: "display",
    description: "Generosidad expresiva con raíces clásicas. Playfair Display lleva el serif al territorio editorial contemporáneo: cálido, literario, capaz de sostener emoción sin colapsar.",
    emotionalTone: "Editorial warmth, expressive literary voice, cultivated elegance",
    resonance: { energy: 48, temperature: 68, tension: 35, density: 45, movement: 28, temporality: 68, humanity: 82, clarity: 72, intimacy: 72, control: 58 },
    emotionResonance: ["alegría", "amor", "admiración", "éxtasis"],
    specimen: "La belleza necesita espacio para desplegarse sin disculpas.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "2011 — Claus Eggers Sørensen",
    historicalContext: "Designed for contemporary editorial use, Playfair carries the warmth of 18th-century types into the digital age.",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    googleFontFamily: "Merriweather",
    category: "serif",
    description: "Diseñada para pantallas, pero con el peso y calidad óptica de la imprenta clásica. Legible, cálida, digna: la tipografía de las cosas que importan.",
    emotionalTone: "Warm readability, steady trustworthiness, grounded presence",
    resonance: { energy: 35, temperature: 62, tension: 22, density: 52, movement: 15, temporality: 62, humanity: 88, clarity: 78, intimacy: 65, control: 72 },
    emotionResonance: ["gratitud", "ternura", "esperanza", "amor"],
    specimen: "Hay letras que sostienen. Esta es una de ellas.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "2010 — Eben Sorkin",
    historicalContext: "Built specifically for reading on screens, Merriweather brings print-quality optical compensation to digital text.",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    googleFontFamily: "Space Grotesk",
    category: "sans-serif",
    description: "Geometría con alma: la grilla racional interrumpida por detalles inesperados. Space Grotesk sugiere inteligencia artificial que aún no ha perdido la curiosidad.",
    emotionalTone: "Technological curiosity, spatial distance, geometric humanity",
    resonance: { energy: 58, temperature: 42, tension: 45, density: 38, movement: 48, temporality: 32, humanity: 48, clarity: 85, intimacy: 28, control: 75 },
    emotionResonance: ["curiosidad", "anticipación", "admiración", "ansiedad"],
    specimen: "La geometría también tiene nervios.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "2020 — Florian Karsten",
    historicalContext: "Designed in the era of space exploration revival, Space Grotesk sits between the technical and the poetic.",
  },
  {
    id: "dm-serif",
    name: "DM Serif Display",
    googleFontFamily: "DM Serif Display",
    category: "display",
    description: "Un serif para titulares que necesitan peso sin rigidez. El contraste moderado y los terminales suavizados crean una voz editorial que no grita pero no puede ignorarse.",
    emotionalTone: "Authoritative softness, editorial weight, refined gravity",
    resonance: { energy: 52, temperature: 55, tension: 48, density: 58, movement: 18, temporality: 72, humanity: 72, clarity: 68, intimacy: 45, control: 75 },
    emotionResonance: ["sublimidad", "admiración", "melancolía"],
    specimen: "La gravedad no excluye la gracia.",
    sampleText: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789",
    designerEra: "2018 — Colophon Foundry",
    historicalContext: "Designed for the DeepMind editorial identity, DM Serif marries scientific precision with editorial warmth.",
  },
];

// Dedupe by id (canonical wins)
const _canonicalIds = new Set(CANONICAL_TYPOGRAPHY.map((t) => t.id));
const _extendedDeduped = TYPOGRAPHY_EXTENDED.filter((t) => !_canonicalIds.has(t.id));

export const TYPOGRAPHY: TypographyResonance[] = [...CANONICAL_TYPOGRAPHY, ..._extendedDeduped];

export const FONT_MAP = new Map(TYPOGRAPHY.map((t) => [t.id, t]));
