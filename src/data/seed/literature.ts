import type { Literature } from "@/types";
import { LITERATURES_OL } from "./literature-ol";

/**
 * Seed catalogue of narrative literature and essays — long-form emotional
 * cartographies. Poetry is held separately; this catalogue gathers novels,
 * novellas, memoirs and essays. Cross-cultural and cross-period.
 */
const CURATED_LITERATURES: Literature[] = [
  {
    id: "sebald-austerlitz",
    title: "Austerlitz",
    author: "W. G. Sebald",
    year: "2001",
    form: "novel",
    language: "German",
    excerpt:
      "And so they are ever returning to us, the dead. At times they come back from the ice more than seven decades later and are found at the edge of the moraine, a few polished bones and a pair of hobnailed boots.",
    emotionResonance: ["nostalgia", "soledad", "melancolía", "compasión", "anhelo", "horror"],
    colorResonance: ["gris", "marron", "negro"],
    atmosphereTags: ["fragmentado","memorioso","fotográfico","umbralino","atemporal"],
    resonance: { energy: 22, temperature: 32, tension: 52, density: 78, movement: 28, temporality: 98, humanity: 92, clarity: 42, intimacy: 78, control: 58 },
    description: "Austerlitz, a Welsh boy raised by adoptive parents, slowly discovers he was a child of the Kindertransport. Sebald wrote prose like archeology: black and white photographs embedded in long, breathless sentences.",
    poeticDescription: "Sebald escribió la memoria como una excavación. Cada frase saca a la luz lo que ya no quería recordarse pero seguía ahí.",
  },
  {
    id: "duras-amante",
    title: "L'Amant (The Lover)",
    author: "Marguerite Duras",
    year: "1984",
    form: "novella",
    language: "French",
    excerpt:
      "Very early in my life it was too late. It was already too late when I was eighteen. Between eighteen and twenty-five my face took off in a new direction.",
    emotionResonance: ["pasión", "soledad", "nostalgia", "deseo", "tristeza", "anhelo"],
    colorResonance: ["amarillo", "marron", "rojo"],
    atmosphereTags: ["tropical","sensual","memorioso","ralentizado","colonial"],
    resonance: { energy: 38, temperature: 78, tension: 62, density: 58, movement: 32, temporality: 92, humanity: 92, clarity: 48, intimacy: 92, control: 38 },
    description: "A 15-year-old French girl in colonial Vietnam crosses a river to begin her first affair with a Chinese man. Duras wrote it at 70, looking back at herself looking back. Prix Goncourt 1984.",
    poeticDescription: "Duras escribió la novela de un cuerpo joven recordado por uno viejo. Lo que pasó no pasó: estaba pasando todo el tiempo.",
  },
  {
    id: "bolano-2666",
    title: "2666",
    author: "Roberto Bolaño",
    year: "2004 (posth.)",
    form: "novel",
    language: "Spanish",
    excerpt:
      "Hay un instante para el cual se vive y muere; un instante perdido, irrecuperable, en que cualquier hombre cualquiera, alcanza la dimensión del hombre que pudo ser.",
    emotionResonance: ["horror", "desesperación", "fracaso", "compasión", "ira", "sublimidad"],
    colorResonance: ["negro", "amarillo", "rojo"],
    atmosphereTags: ["fronterizo","violento","panorámico","fragmentado","apocalíptico"],
    resonance: { energy: 58, temperature: 48, tension: 88, density: 88, movement: 62, temporality: 72, humanity: 88, clarity: 32, intimacy: 38, control: 22 },
    description: "Five interlocking books circling the femicides of Ciudad Juárez. Bolaño finished it while dying of liver failure. The fourth book, 'La parte de los crímenes', is a forensic catalogue of murdered women — unbearable and unavoidable.",
    poeticDescription: "Bolaño escribió la novela del fracaso del siglo XX. Cinco libros que no se reúnen: queda la suma de su desencuentro.",
  },
  {
    id: "lispector-agua-viva",
    title: "Água Viva",
    author: "Clarice Lispector",
    year: "1973",
    form: "novel",
    language: "Portuguese",
    excerpt:
      "I am not going to be autobiographical. I want to be 'bio'. I write what I want, what I dream, what I am.",
    emotionResonance: ["éxtasis", "anhelo", "soledad", "pasión", "trascendencia", "amor"],
    colorResonance: ["azul", "blanco", "dorado"],
    atmosphereTags: ["fluido","místico","interior","entrecortado","femenino"],
    resonance: { energy: 52, temperature: 62, tension: 62, density: 42, movement: 78, temporality: 58, humanity: 92, clarity: 32, intimacy: 95, control: 28 },
    description: "Not a novel; an inner stream. Lispector called it 'an unbridled writing'. A painter writes to her lover about painting, about time, about being. There is no plot — only the present tense, sustained.",
    poeticDescription: "Lispector escribió como quien respira sin pulmones. El libro no termina porque nunca empezó: estaba siempre en el ahora.",
  },
  {
    id: "yourcenar-adriano",
    title: "Mémoires d'Hadrien (Memoirs of Hadrian)",
    author: "Marguerite Yourcenar",
    year: "1951",
    form: "novel",
    language: "French",
    excerpt:
      "When all our books are lost, that of Hadrian will remain.",
    emotionResonance: ["serenidad", "resignación", "amor", "trascendencia", "melancolía", "gratitud"],
    colorResonance: ["dorado", "marron", "azul"],
    atmosphereTags: ["epistolar","filosófico","atardecer","clásico","reposado"],
    resonance: { energy: 32, temperature: 58, tension: 38, density: 68, movement: 22, temporality: 92, humanity: 88, clarity: 78, intimacy: 78, control: 88 },
    description: "Emperor Hadrian, dying, writes a long letter to his young successor. Yourcenar took twenty years to write it. The sentences move like Roman aqueducts — measured, monumental, indispensable.",
    poeticDescription: "Yourcenar prestó la voz a un emperador moribundo y descubrió una serenidad sin victoria. El que escribe ya está despidiéndose.",
  },
  {
    id: "calvino-ciudades",
    title: "Le città invisibili (Invisible Cities)",
    author: "Italo Calvino",
    year: "1972",
    form: "novel",
    language: "Italian",
    excerpt:
      "The inferno of the living is not something that will be; if there is one, it is what is already here, the inferno where we live every day, that we form by being together. There are two ways to escape suffering it. The first is easy for many: accept the inferno and become such a part of it that you can no longer see it. The second is risky and demands constant vigilance and apprehension: seek and learn to recognize who and what, in the midst of the inferno, are not inferno, then make them endure, give them space.",
    emotionResonance: ["pasmo", "anhelo", "nostalgia", "admiración", "serenidad", "curiosidad"],
    colorResonance: ["dorado", "azul", "blanco"],
    atmosphereTags: ["enumerativo","onírico","viajero","arquitectónico","luminoso"],
    resonance: { energy: 38, temperature: 58, tension: 22, density: 42, movement: 58, temporality: 78, humanity: 68, clarity: 88, intimacy: 52, control: 78 },
    description: "Marco Polo describes 55 imaginary cities to Kublai Khan. None of them exist. All of them are Venice. Or all of them are inside the listener. Calvino wrote a book about how cities feel before they have walls.",
    poeticDescription: "Calvino enumeró ciudades que no existen para hablar de la única ciudad que existe: la que llevamos dentro.",
  },
  {
    id: "ferrante-amica",
    title: "L'amica geniale (My Brilliant Friend)",
    author: "Elena Ferrante",
    year: "2011",
    form: "novel",
    language: "Italian",
    excerpt:
      "There is no gesture, no word, no sigh that doesn't contain the sum of all the crimes that humans have committed.",
    emotionResonance: ["amistad", "envidia", "amor", "ira", "soledad", "anhelo"],
    colorResonance: ["rosa", "rojo", "marron"],
    atmosphereTags: ["urbano","barrial","femenino","longitudinal","viscoso"],
    resonance: { energy: 62, temperature: 62, tension: 78, density: 68, movement: 52, temporality: 82, humanity: 95, clarity: 58, intimacy: 88, control: 42 },
    description: "Lila and Lenù, two girls in postwar Naples, grow up bound by a friendship that is also rivalry. Ferrante anatomizes female friendship with surgical honesty: the love that includes the wish to surpass.",
    poeticDescription: "Ferrante escribió la amistad como una guerra que dura sesenta años. Las dos amigas se necesitan tanto que no pueden perdonarse.",
  },
  {
    id: "rulfo-paramo",
    title: "Pedro Páramo",
    author: "Juan Rulfo",
    year: "1955",
    form: "novel",
    language: "Spanish",
    excerpt:
      "Vine a Comala porque me dijeron que acá vivía mi padre, un tal Pedro Páramo.",
    emotionResonance: ["soledad", "nostalgia", "desesperación", "ira", "resignación", "horror"],
    colorResonance: ["marron", "negro", "amarillo"],
    atmosphereTags: ["fantasmal","seco","circular","susurrante","muerto"],
    resonance: { energy: 32, temperature: 58, tension: 72, density: 88, movement: 28, temporality: 92, humanity: 88, clarity: 28, intimacy: 58, control: 32 },
    description: "A son arrives in his father's town to find that everyone there is dead, but they keep talking. Rulfo wrote 250 pages and stopped. The book invented Latin American magical realism a decade before Macondo.",
    poeticDescription: "Rulfo escribió un pueblo de muertos que no terminan de morirse. Comala es la patria de quienes ya no tienen patria.",
  },
];

export const LITERATURES: Literature[] = [...CURATED_LITERATURES, ...LITERATURES_OL];

export const LITERATURE_MAP = new Map(LITERATURES.map((l) => [l.id, l]));
