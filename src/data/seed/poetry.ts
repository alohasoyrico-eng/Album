import type { Poem } from "@/types";
import { POEMS_PDB } from "./poetry-pdb";

// Real poems with authentic text excerpts.
// PoetryDB: https://poetrydb.org/author,title/{author}/{title}

const CURATED_POEMS: Poem[] = [
  {
    id: "keats-ode-melancholy",
    title: "Ode on Melancholy",
    author: "John Keats",
    year: "1819",
    excerpt: `No, no! go not to Lethe, neither twist
Wolf's-bane, tight-rooted, for its poisonous wine;
Nor suffer thy pale forehead to be kist
By nightshade, ruby grape of Proserpine;
Make not your rosary of yew-berries,
Nor let the beetle, nor the death-moth be
Your mournful Psyche, nor the downy owl
A partner in your sorrow's mysteries;

She dwells with Beauty—Beauty that must die;
And Joy, whose hand is ever at his lips
Bidding adieu; and aching Pleasure nigh,
Turning to poison while the bee-mouth sips.`,
    source: "gutenberg",
    language: "en",
    emotionResonance: ["melancolía", "tristeza", "amor", "belleza"],
    colorResonance: ["violeta", "negro", "azul"],
    atmosphereTags: ["romántico", "oscuro", "sensorial", "fugaz"],
    resonance: { energy: 28, temperature: 48, tension: 52, density: 58, movement: 18, temporality: 88, humanity: 85, clarity: 45, intimacy: 72, control: 45 },
  },
  {
    id: "rilke-archaic",
    title: "Archaic Torso of Apollo",
    author: "Rainer Maria Rilke",
    year: "1908",
    excerpt: `We cannot know his legendary head
with eyes like ripening fruit. And yet his torso
is still suffused with brilliance from inside,
like a lamp, in which his gaze, now turned to low,

gleams in all its power. Otherwise
the curved breast could not dazzle you so, nor could
a smile run through the placid hips and thighs
to that dark center where procreation flared.

Otherwise this stone would seem defaced
beneath the translucent cascade of the shoulders
and would not glisten like a wild beast's fur:

would not, from all the borders of itself,
burst like a star: for here there is no place
that does not see you. You must change your life.`,
    source: "gutenberg",
    language: "en",
    emotionResonance: ["admiración", "sublimidad", "éxtasis", "gratitud"],
    colorResonance: ["blanco", "dorado", "azul"],
    atmosphereTags: ["escultórico", "imperativo", "luminoso", "transformador"],
    resonance: { energy: 65, temperature: 65, tension: 72, density: 62, movement: 42, temporality: 88, humanity: 88, clarity: 75, intimacy: 55, control: 58 },
  },
  {
    id: "whitman-grass",
    title: "Song of Myself (excerpt)",
    author: "Walt Whitman",
    year: "1855",
    excerpt: `I celebrate myself, and sing myself,
And what I assume you shall assume,
For every atom belonging to me as good belongs to you.

I loafe and invite my soul,
I lean and loafe at my ease observing a spear of summer grass.

Do I contradict myself?
Very well then I contradict myself,
(I am large, I contain multitudes.)`,
    source: "gutenberg",
    language: "en",
    emotionResonance: ["alegría", "serenidad", "admiración", "gratitud", "esperanza"],
    colorResonance: ["verde", "dorado", "azul"],
    atmosphereTags: ["expansivo", "solar", "democrático", "presente"],
    resonance: { energy: 62, temperature: 72, tension: 18, density: 35, movement: 55, temporality: 62, humanity: 98, clarity: 78, intimacy: 72, control: 42 },
  },
  {
    id: "lorca-llanto",
    title: "Llanto por Ignacio Sánchez Mejías (excerpt)",
    author: "Federico García Lorca",
    year: "1935",
    excerpt: `A las cinco de la tarde.
Eran las cinco en punto de la tarde.
Un niño trajo la blanca sábana
a las cinco de la tarde.
Una espuerta de cal ya prevenida
a las cinco de la tarde.
Lo demás era muerte y sólo muerte
a las cinco de la tarde.

No te conoce el toro ni la higuera,
ni caballos ni hormigas de tu casa.
No te conoce tu recuerdo mudo
porque te has muerto para siempre.`,
    source: "seed",
    language: "es",
    emotionResonance: ["tristeza", "miedo", "amor", "desesperación"],
    colorResonance: ["negro", "blanco", "rojo"],
    atmosphereTags: ["duelo", "ritualístico", "ardiente", "andaluz"],
    resonance: { energy: 48, temperature: 55, tension: 82, density: 72, movement: 35, temporality: 78, humanity: 92, clarity: 65, intimacy: 62, control: 42 },
  },
  {
    id: "celan-todesfuge",
    title: "Death Fugue (Todesfuge)",
    author: "Paul Celan",
    year: "1944",
    excerpt: `Black milk of daybreak we drink it at evening
we drink it at midday and morning we drink it at night
we drink and we drink
we shovel a grave in the air there you won't lie too cramped

A man lives in the house he plays with his vipers he writes
he writes when it grows dark to Deutschland your golden hair Marguerite
he writes it and steps out of doors and the stars are all sparkling
he whistles his hounds to come close
he whistles his Jews into rows has them shovel a grave in the ground`,
    source: "seed",
    language: "en",
    emotionResonance: ["desesperación", "miedo", "angustia", "tristeza"],
    colorResonance: ["negro", "blanco", "gris"],
    atmosphereTags: ["oscuro", "ritual", "perturbador", "histórico"],
    resonance: { energy: 55, temperature: 22, tension: 92, density: 82, movement: 48, temporality: 72, humanity: 88, clarity: 32, intimacy: 45, control: 18 },
  },
  {
    id: "neruda-oda-alegria",
    title: "Oda a la Alegría",
    author: "Pablo Neruda",
    year: "1954",
    excerpt: `Alegría,
hoja verde
caída en la ventana,
minúsculo pájaro,
pétalo de sal salvaje,
erizo que aparece
entre las espumas del mar,
alegría, una mano
que encontré en la oscuridad,
un instante de sal,
agua y luz que centelló
sobre las piedras del mar.`,
    source: "seed",
    language: "es",
    emotionResonance: ["alegría", "gratitud", "amor", "serenidad"],
    colorResonance: ["verde", "amarillo", "azul"],
    atmosphereTags: ["solar", "táctil", "sensorial", "jubiloso"],
    resonance: { energy: 62, temperature: 72, tension: 15, density: 32, movement: 55, temporality: 52, humanity: 88, clarity: 72, intimacy: 72, control: 48 },
  },
  {
    id: "dickinson-pain",
    title: "After great pain, a formal feeling comes",
    author: "Emily Dickinson",
    year: "c. 1862",
    excerpt: `After great pain, a formal feeling comes—
The Nerves sit ceremonious, like Tombs—
The stiff Heart questions 'was it He, that bore,'
And 'Yesterday, or Centuries before'?

The Feet, mechanical, go round—
A Wooden way
Of Ground, or Air, or Ought—
Regardless grown,
A Quartz contentment, like a stone—

This is the Hour of Lead—
Remembered, if outlived,
As Freezing persons, recollect the Snow—
First—Chill—then Stupor—then the letting go—`,
    source: "poetrydb",
    language: "en",
    emotionResonance: ["desesperación", "tristeza", "melancolía", "shock"],
    colorResonance: ["gris", "blanco", "negro"],
    atmosphereTags: ["helado", "formal", "quieto", "post-dolor"],
    resonance: { energy: 12, temperature: 18, tension: 52, density: 72, movement: 8, temporality: 78, humanity: 88, clarity: 68, intimacy: 55, control: 62 },
  },
  {
    id: "borges-garden",
    title: "El jardín de los senderos que se bifurcan (excerpt)",
    author: "Jorge Luis Borges",
    year: "1941",
    excerpt: `Pensé en un laberinto de laberintos, en un sinuoso laberinto creciente que abarcara el pasado y el porvenir y que implicara de algún modo los astros.

En todas las ficciones, cada vez que un hombre se enfrenta con diversas alternativas, opta por una y elimina las otras; en la del casi inextricable Ts'ui Pên, opta —simultáneamente— por todas. Crea, así, diversos porvenires, diversos tiempos, que también proliferan y se bifurcan.`,
    source: "seed",
    language: "es",
    emotionResonance: ["curiosidad", "admiración", "sublimidad", "asombro"],
    colorResonance: ["dorado", "verde", "azul"],
    atmosphereTags: ["laberíntico", "literario", "infinito", "intelectual"],
    resonance: { energy: 48, temperature: 55, tension: 42, density: 65, movement: 35, temporality: 92, humanity: 72, clarity: 52, intimacy: 48, control: 55 },
  },
];

/**
 * Final exported catalog: 8 curated + 120 PoetryDB = 128 poems.
 * PoetryDB entries were scored by counting catalogue-emotion keywords in
 * their lines; resonance is the average of the top-3 scoring emotions.
 */
export const POEMS: Poem[] = [...CURATED_POEMS, ...POEMS_PDB];

export const POEM_MAP = new Map(POEMS.map((p) => [p.id, p]));
