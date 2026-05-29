/**
 * Seed lens overlays for clans. Marina's curated readings are the baseline;
 * these are claims from other traditions of meaning.
 */

import { registerClanOverlay } from "./clans-claims";
import { curatorClaim } from "@/types/claims";

let _applied = false;
export function applyClanSeedOverlays() {
  if (_applied) return;
  _applied = true;
  _register();
}

function _register() {

// ─── Clan melancolía ────────────────────────────────────────────────────
registerClanOverlay("melancolia", {
  description: [
    curatorClaim(
      "El clan del lamento sereno. Aquí caben aquellas tristezas que se reconocen sin escándalo: la melancolía como práctica de atención al irse de las cosas.",
      "lens:eastern-classical",
      0.85,
      "eastern",
      "Tradición mono no aware; lectura zen-soto.",
    ),
  ],
});

// ─── Clan ira ───────────────────────────────────────────────────────────
registerClanOverlay("ira", {
  description: [
    curatorClaim(
      "El clan de las ferocidades lúcidas. Iras que diagnostican, no destruyen — la familia afectiva de quienes han aprendido a leer la rabia como dato.",
      "lens:feminist",
      0.82,
      "feminist",
      "Audre Lorde; bell hooks sobre la rabia como inteligencia política.",
    ),
  ],
});

// ─── Clan amor ──────────────────────────────────────────────────────────
registerClanOverlay("amor", {
  description: [
    curatorClaim(
      "El clan de las atenciones sostenidas. Aquí los amores son trabajo y disposición ética, no rapto ni flecha. Familia afectiva del cuidado.",
      "lens:queer-affect",
      0.8,
      "queer",
      "bell hooks; José Esteban Muñoz, 'Cruising Utopia'.",
    ),
  ],
});
}
