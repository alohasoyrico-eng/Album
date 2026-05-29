/**
 * Demo overlays — seed lens-specific claims onto a handful of emotions so
 * the plurality system has something to render the first time we boot it.
 *
 * In production these would come from:
 *   - editorial curators with named overlays
 *   - lens-specific seed packages (afrodiasporic, queer, indigenous…)
 *   - the participation backend (user claims)
 *   - the inference engine (transitive / surprise claims)
 *
 * For now we author them by hand. The point is to prove that the consensus
 * algebra picks them up and the UI can render disagreement.
 */

import { registerOverlay } from "./emotions-claims";
import { curatorClaim, userClaim } from "@/types/claims";
import type { ResonanceAxes } from "@/types";

// Wrapped in a single side-effect-free function so the adapter can call
// it AFTER its own `_overlays` storage is initialised. ESM hoists imports
// to the top of the file regardless of source order, so a plain
// `import "./_seed-overlays"` at the bottom of emotions-claims runs
// before `const _overlays = {}` is materialised → TDZ error.
const R = (
  energy: number, temperature: number, tension: number, density: number, movement: number,
  temporality: number, humanity: number, clarity: number, intimacy: number, control: number,
): ResonanceAxes => ({ energy, temperature, tension, density, movement, temporality, humanity, clarity, intimacy, control });

let _applied = false;
export function applyEmotionSeedOverlays() {
  if (_applied) return;
  _applied = true;
  _register();
}

function _register() {

// ─── Melancolía ─────────────────────────────────────────────────────────
// Marina's reading frames melancolía as the grief of all possible pasts.
// An eastern reading (mono no aware) frames it as the bittersweet awareness
// of impermanence. A Latin American Boom curator emphasises political and
// historical sediment.

registerOverlay("melancolía", {
  description: [
    curatorClaim(
      "Mono no aware (物の哀れ). La conciencia agridulce de que todo lo bello también pasa. No es duelo: es atención al hecho de que las cosas se van mientras suceden.",
      "lens:eastern-classical",
      0.85,
      "eastern",
      "Motoori Norinaga, siglo XVIII: lectura clásica japonesa de la pena estética como modo cognitivo.",
    ),
    curatorClaim(
      "La saudade portuguesa: la presencia activa de una ausencia, sin objeto fijo. Difícil de traducir; vive entre el deseo y la pérdida.",
      "lens:lusofona",
      0.78,
      "personal",
      "Fernando Pessoa, Eduardo Lourenço: la saudade como categoría afectiva-nacional.",
    ),
    curatorClaim(
      "Tristeza histórica colectiva. La memoria de lo que la región fue obligada a olvidar. La melancolía aquí no es individual: es geopolítica.",
      "lens:boom-latinoamericano",
      0.72,
      "latin-american",
      "García Márquez, Galeano, Bolaño: la melancolía como herencia política.",
    ),
  ],
  poeticIntro: [
    curatorClaim(
      "La belleza pasa, y la conciencia de que pasa es ya parte de la belleza.",
      "lens:eastern-classical",
      0.85,
      "eastern",
    ),
  ],
  atmosphereTags: [
    curatorClaim(
      ["impermanente", "estacional", "translúcido", "doliente-sereno"],
      "lens:eastern-classical",
      0.85,
      "eastern",
    ),
  ],
  // Eastern reading shifts the resonance: less density / tension, more
  // serenity (clarity + control). Mono no aware is awareness, not weight.
  // Marina's canonical: energy 20, temp 40, tension 55, density 60,
  // movement 15, temporality 90, humanity 85, clarity 35, intimacy 75, control 40
  // Eastern claim pushes towards a clearer, calmer reading.
  resonance: [
    curatorClaim(
      R(22, 48, 28, 38, 18, 92, 78, 70, 72, 70),
      "lens:eastern-classical",
      0.85,
      "eastern",
      "El delta vectorial respecto a Marina: menos tensión y densidad (mono no aware no es duelo cargado), más claridad y control (es atención lúcida).",
    ),
  ],
});

// ─── Nostalgia ──────────────────────────────────────────────────────────
// Two community readings: a queer reading frames nostalgia as the memory
// of futures denied; a Caribbean reading frames it as homeland-as-rhythm.

registerOverlay("nostalgia", {
  description: [
    curatorClaim(
      "La memoria de futuros que fueron negados. No es regreso a un lugar: es duelo por las vidas que no se nos permitió vivir.",
      "lens:queer-affect",
      0.8,
      "queer",
      "José Esteban Muñoz, 'Cruising Utopia': nostalgia como horizonte queer.",
    ),
  ],
});

// ─── Soledad ────────────────────────────────────────────────────────────
registerOverlay("soledad", {
  description: [
    userClaim(
      "No me suena a falta. Me suena a anchura. Hay una soledad que es expansión, no privación.",
      "anon-7f3a",
      0.45,
      "personal",
      "Comentario anónimo de prueba — demostración de cómo se ve el disenso del público.",
    ),
    curatorClaim(
      "Soledad como práctica zen — la vacuidad fértil del satori. No es falta de compañía: es la disposición que permite que las cosas aparezcan tal como son.",
      "lens:eastern-classical",
      0.78,
      "eastern",
      "Dogen, Shobogenzo; tradición zen-soto.",
    ),
  ],
  // Eastern reading shifts resonance toward higher clarity and control,
  // less tension. Soledad as practice, not deprivation.
  resonance: [
    curatorClaim(
      R(28, 48, 22, 50, 18, 62, 70, 78, 50, 78),
      "lens:eastern-classical",
      0.78,
      "eastern",
    ),
  ],
});

// ─── Amor ───────────────────────────────────────────────────────────────
// Marina: love. Western romantic tradition emphasises union and devotion.
// Queer reading widens: love as the labour of seeing one another. Yoruba:
// amor as iyamapo, mother-earth's holding.

registerOverlay("amor", {
  description: [
    curatorClaim(
      "El trabajo paciente de ver al otro tal como es y, aún así, querer estar. No es flecha ni rapto: es atención sostenida.",
      "lens:queer-affect",
      0.82,
      "queer",
      "bell hooks, 'All About Love'; Sara Ahmed sobre la ética del cuidado.",
    ),
    curatorClaim(
      "Amor como iyamapo: el sostenimiento que la tierra-madre da a quien camina sobre ella. Es comunidad, no díada.",
      "lens:afrodiaspórico",
      0.75,
      "afrodiasporic",
      "Cosmovisión yoruba; Sylvia Wynter, 'Sociogenic Principle'.",
    ),
  ],
});

// ─── Ira ────────────────────────────────────────────────────────────────
// Marina: anger. Black feminist tradition: ira as righteous diagnosis,
// political clarity, not pathology.

registerOverlay("ira", {
  description: [
    curatorClaim(
      "Ira como lucidez política. Audre Lorde llamó al uso de la ira como un acto de claridad: 'la ira es información y energía'. No es descontrol: es diagnóstico.",
      "lens:feminist",
      0.85,
      "feminist",
      "Audre Lorde, 'The Uses of Anger' (1981).",
    ),
  ],
  resonance: [
    curatorClaim(
      // Feminist reading: more clarity (it's diagnosis), more control
      // (it's directed), tension stays high.
      R(85, 70, 88, 50, 80, 30, 78, 78, 55, 72),
      "lens:feminist",
      0.85,
      "feminist",
    ),
  ],
});

// ─── Vergüenza ──────────────────────────────────────────────────────────
registerOverlay("vergüenza", {
  description: [
    curatorClaim(
      "Vergüenza como afecto colectivo: lo que el cuerpo aprende del lugar al que no se le permite pertenecer. Eve Sedgwick: la vergüenza es 'pegamento social' — duele porque importa.",
      "lens:queer-affect",
      0.8,
      "queer",
      "Eve Sedgwick, 'Shame and Performativity'.",
    ),
  ],
});

// ─── Esperanza ──────────────────────────────────────────────────────────
registerOverlay("esperanza", {
  description: [
    curatorClaim(
      "Esperanza como práctica: no la convicción de que las cosas mejorarán, sino el hábito de actuar como si pudieran. Una disciplina, no un sentimiento.",
      "lens:latin-american",
      0.82,
      "latin-american",
      "Eduardo Galeano; Rebecca Solnit, 'Hope in the Dark'.",
    ),
    curatorClaim(
      "Sumak kawsay — el buen vivir. La esperanza no es proyección hacia el futuro: es atención a la red de relaciones presentes con la tierra y la comunidad.",
      "lens:originaria",
      0.78,
      "indigenous",
      "Cosmovisión quechua-aymara; Constitución Plurinacional de Bolivia 2009.",
    ),
  ],
});

// ─── Compasión ──────────────────────────────────────────────────────────
registerOverlay("compasión", {
  description: [
    curatorClaim(
      "Karuna (करुणा): el deseo activo de aliviar el sufrimiento del otro. Una de las cuatro moradas sublimes del budismo. No es lástima: es práctica.",
      "lens:eastern-classical",
      0.88,
      "eastern",
      "Budismo theravada y mahayana; Brahmavihara.",
    ),
  ],
});

// ─── Júbilo ─────────────────────────────────────────────────────────────
registerOverlay("júbilo", {
  description: [
    curatorClaim(
      "Mudita (मुदिता): la alegría que se siente por la felicidad del otro. La cuarta morada sublime. Antídoto al envidia.",
      "lens:eastern-classical",
      0.85,
      "eastern",
      "Budismo theravada; Brahmavihara.",
    ),
    curatorClaim(
      "Júbilo como práctica colectiva del cuerpo negro: la alegría como acto político de afirmación frente al borrado. No es ingenua: es resistencia.",
      "lens:afrodiaspórico",
      0.8,
      "afrodiasporic",
      "Joy James; Ross Gay, 'Inciting Joy'.",
    ),
  ],
});

// ─── Ansiedad ───────────────────────────────────────────────────────────
registerOverlay("ansiedad", {
  description: [
    curatorClaim(
      "Ansiedad como síntoma social, no individual. Lo que la sociedad enferma proyecta sobre los cuerpos que la atraviesan. No es bioquímica: es político-económica.",
      "lens:feminist",
      0.72,
      "feminist",
      "Mark Fisher, 'Capitalist Realism'; Eva Illouz, 'Cold Intimacies'.",
    ),
  ],
});

// ─── Gratitud ───────────────────────────────────────────────────────────
registerOverlay("gratitud", {
  description: [
    curatorClaim(
      "Gratitud como reconocimiento de la red. En la cosmovisión andina, 'pagar a la tierra' (despacho) no es ritual de agradecimiento: es restitución a una relación.",
      "lens:originaria",
      0.82,
      "indigenous",
      "Despacho andino; tradición ayllu.",
    ),
  ],
});

// ─── Nostalgia adicional (afrodiaspórica) ──────────────────────────────
registerOverlay("nostalgia", {
  description: [
    curatorClaim(
      "Nostalgia como sankofa: el regreso al pasado no como melancolía, sino como búsqueda activa de lo que es necesario para seguir adelante.",
      "lens:afrodiaspórico",
      0.78,
      "afrodiasporic",
      "Símbolo akan sankofa; tradición ashanti.",
    ),
  ],
});
}
