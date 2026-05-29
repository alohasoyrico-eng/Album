/**
 * Seed cultural overlays for the Color catalogue.
 *
 * Heller's data — western European, 2000 respondents — is the baseline.
 * Other traditions assign radically different meanings to the same hex.
 * These are the demonstrative overlays that prove the plurality engine
 * picks them up under the right lens.
 */

import { registerColorOverlay } from "./colors-claims";
import { curatorClaim } from "@/types/claims";

let _applied = false;
export function applyColorSeedOverlays() {
  if (_applied) return;
  _applied = true;
  _register();
}

function _register() {

// ─── Blanco / White ────────────────────────────────────────────────────
// Heller: purity, innocence, beginnings.
// Many East Asian traditions: mourning, death, ancestral white robes.

registerColorOverlay("blanco", {
  description: [
    curatorClaim(
      "Color del luto. En China, Japón y Corea, el blanco es la tela del duelo, no de la boda. Vestir blanco en un velorio es honrar; vestir blanco en una boda es una intromisión cultural reciente.",
      "lens:eastern-classical",
      0.9,
      "eastern",
      "Reformas Meiji en Japón y rituales sintoístas; tradición confuciana coreana.",
    ),
    curatorClaim(
      "Blanco como ausencia que requiere ser llenada. En las prácticas yoruba e Ifá, el blanco (funfun) es el color de Obatalá: cabeza serena, ética, mente que decide.",
      "lens:afrodiaspórico",
      0.82,
      "afrodiasporic",
      "Tradición Ifá / Lucumí; cosmovisión yoruba contemporánea.",
    ),
  ],
});

// ─── Rojo ───────────────────────────────────────────────────────────────
// Heller: love, anger, danger.
// Chinese tradition: prosperity, marriage. Inversa total del blanco.

registerColorOverlay("rojo", {
  description: [
    curatorClaim(
      "El color de la fiesta y del matrimonio. Rojo es el color que se viste para casarse, el del sobre de la suerte (hongbao), el del Año Nuevo. No tiene la carga de peligro de la lectura occidental.",
      "lens:eastern-classical",
      0.9,
      "eastern",
      "Tradición china han; rituales de boda; festividades del Lunar New Year.",
    ),
    curatorClaim(
      "Rojo guerrero. En la tradición zapoteca y muchas mexicas, el rojo (chihuilli) es la sangre que da vida al sol; el guerrero pinta su cara para acompañar al astro. No es agresión: es alianza cósmica.",
      "lens:originaria",
      0.78,
      "indigenous",
      "Códices mexicas; iconografía zapoteca-mixteca.",
    ),
  ],
});

// ─── Negro ──────────────────────────────────────────────────────────────
// Heller: death, elegance, void.
// Afro-diasporic tradition: power, ancestral memory, blackness as wealth.

registerColorOverlay("negro", {
  description: [
    curatorClaim(
      "Negro como poder y abundancia. La tradición afro-caribeña — especialmente la lucumí y la candomblé — lee el negro como el color de la noche fértil: lo que está oculto pero abunda.",
      "lens:afrodiaspórico",
      0.85,
      "afrodiasporic",
      "Cosmovisión bantú-yoruba en diáspora; Sylvia Wynter sobre la negritud como categoría afirmativa.",
    ),
  ],
});

// ─── Amarillo ──────────────────────────────────────────────────────────
// Heller: envy, betrayal, sun.
// Imperial Chinese tradition: divine right of emperors.

registerColorOverlay("amarillo", {
  description: [
    curatorClaim(
      "Color imperial. Vestir amarillo era prerrogativa exclusiva del emperador en la China Ming y Qing. El amarillo terroso es el centro de los cinco elementos, no la traición: el equilibrio.",
      "lens:eastern-classical",
      0.88,
      "eastern",
      "Dinastías Ming, Qing; cosmología Wu Xing.",
    ),
  ],
});

// ─── Verde ─────────────────────────────────────────────────────────────
registerColorOverlay("verde", {
  description: [
    curatorClaim(
      "Verde como esperanza practicada. En tradiciones andinas, el verde (q'umir) de la chacra es el trabajo paciente de la tierra; no un color, sino una promesa cumplida estación tras estación.",
      "lens:originaria",
      0.78,
      "indigenous",
      "Cosmovisión quechua-aymara; agricultura andina.",
    ),
  ],
});

// ─── Azul ──────────────────────────────────────────────────────────────
// Heller: trust, depth, distance.
// Afro-diasporic / Yoruba: Yemoja's blue — the orisha of waters and motherhood.

registerColorOverlay("azul", {
  description: [
    curatorClaim(
      "Azul de Yemoja. En la tradición yoruba y lucumí, el azul profundo pertenece a la orisha de las aguas saladas, madre de todas las orishas. Es protección, fertilidad y profundidad ancestral.",
      "lens:afrodiaspórico",
      0.86,
      "afrodiasporic",
      "Tradición Ifá y Lucumí; templos en Cuba y Brasil.",
    ),
    curatorClaim(
      "Indigo de Krishna. En el hinduismo, el azul oscuro es el cuerpo del avatar divino: lo infinito tomado carne. No es color: es darshan.",
      "lens:eastern-classical",
      0.82,
      "eastern",
      "Bhagavata Purana; iconografía vaishnava.",
    ),
  ],
});

// ─── Violeta ───────────────────────────────────────────────────────────
registerColorOverlay("violeta", {
  description: [
    curatorClaim(
      "Lila del sufragismo. Las sufragistas británicas adoptaron el violeta como dignidad, el blanco como pureza y el verde como esperanza. El violeta cargó la causa.",
      "lens:feminist",
      0.84,
      "feminist",
      "Women's Social and Political Union, 1908.",
    ),
    curatorClaim(
      "Bandera violeta del Día de la Mujer. En América Latina, el violeta y el morado son los colores del 8M: la marea feminista que toma la calle.",
      "lens:latin-american",
      0.86,
      "latin-american",
      "Movimiento #NiUnaMenos; marchas del 8M en Argentina, Chile, México.",
    ),
  ],
});

// ─── Rosa ──────────────────────────────────────────────────────────────
registerColorOverlay("rosa", {
  description: [
    curatorClaim(
      "Rosa como género impuesto. El rosa no era femenino hasta los años 40 del siglo XX — antes era el color masculino, considerado una versión 'enérgica' del rojo. La asignación es cultural, no biológica.",
      "lens:feminist",
      0.8,
      "feminist",
      "Jo Paoletti, 'Pink and Blue: Telling the Boys from the Girls in America'.",
    ),
    curatorClaim(
      "Rosa del triángulo. Color que la persecución nazi impuso a las personas homosexuales en los campos. Resignificado por el movimiento de liberación queer como bandera de orgullo y memoria.",
      "lens:queer-affect",
      0.85,
      "queer",
      "Símbolo reapropiado por ACT UP y la militancia LGBTQ+.",
    ),
  ],
});

// ─── Marron ────────────────────────────────────────────────────────────
registerColorOverlay("marron", {
  description: [
    curatorClaim(
      "Marrón de la tierra. En cosmovisiones andinas, el marrón (ch'umpi) es Pachamama hecha visible: el color que sostiene la chacra y la casa. Tiene dignidad, no humildad.",
      "lens:originaria",
      0.82,
      "indigenous",
      "Cosmovisión aymara; tradición pacha.",
    ),
  ],
});

// ─── Gris ──────────────────────────────────────────────────────────────
registerColorOverlay("gris", {
  description: [
    curatorClaim(
      "Wabi-sabi gris. En la estética japonesa, el gris ceniza es el color de la imperfección sabia: no la ausencia de color, sino su comprensión madura. La belleza de lo gastado y lo discreto.",
      "lens:eastern-classical",
      0.84,
      "eastern",
      "Junichiro Tanizaki, 'El elogio de la sombra'.",
    ),
  ],
});
}
