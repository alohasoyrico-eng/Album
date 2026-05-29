/**
 * Seed lens overlays for tribes — the broadest narrative layer.
 * Re-narrate what an entire emotional family means under each tradition.
 */

import { registerTribeOverlay } from "./tribes-claims";
import { curatorClaim } from "@/types/claims";

let _applied = false;
export function applyTribeSeedOverlays() {
  if (_applied) return;
  _applied = true;
  _register();
}

function _register() {

// ─── Tribu perdida ──────────────────────────────────────────────────────
registerTribeOverlay("perdida", {
  description: [
    curatorClaim(
      "La tribu de las cosas que se fueron. En la lectura clásica oriental, perder no es opuesto a tener: es la forma natural de toda posesión. Esta tribu honra la impermanencia.",
      "lens:eastern-classical",
      0.85,
      "eastern",
      "Mono no aware; tradición budista del anitya.",
    ),
  ],
});

// ─── Tribu obstaculo (Ira) ──────────────────────────────────────────────
registerTribeOverlay("obstaculo", {
  description: [
    curatorClaim(
      "La tribu de la rabia diagnóstica. Las emociones que aquí habitan son lectura política del mundo: la indignación que reconoce la injusticia, no la furia ciega.",
      "lens:feminist",
      0.82,
      "feminist",
      "Audre Lorde, 'The Uses of Anger'.",
    ),
  ],
});

// ─── Tribu bien-deseado (Amor) ──────────────────────────────────────────
registerTribeOverlay("bien-deseado", {
  description: [
    curatorClaim(
      "La tribu del cuidado sostenido. Aquí los afectos son práctica colectiva, no posesión privada. Una familia emocional centrada en sostener al otro.",
      "lens:queer-affect",
      0.8,
      "queer",
      "bell hooks; Sara Ahmed.",
    ),
    curatorClaim(
      "La tribu de iyamapo. Lo que une es la tierra que sostiene a todos los que caminan sobre ella. El bien-deseado aquí es comunal, no diádico.",
      "lens:afrodiaspórico",
      0.78,
      "afrodiasporic",
      "Cosmovisión yoruba.",
    ),
  ],
});

// ─── Tribu vitalidad ────────────────────────────────────────────────────
registerTribeOverlay("vitalidad", {
  description: [
    curatorClaim(
      "La tribu del júbilo afirmativo. Joy como acto político: el cuerpo negro que decide alegrarse frente al borrado. La vitalidad como resistencia, no ingenuidad.",
      "lens:afrodiaspórico",
      0.82,
      "afrodiasporic",
      "Ross Gay, 'Inciting Joy'; Joy James.",
    ),
  ],
});
}
