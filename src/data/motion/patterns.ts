/**
 * Motion catalogue — the third dimension of the system, alongside the
 * 224 colours and 91 typographies.
 *
 * Each pattern is a complete movement vocabulary:
 *   pace        — breath / pulse period in ms (fast ↔ slow)
 *   inertia     — CSS cubic-bezier of every transition (snappy ↔ molasses)
 *   trajectory  — idle drift shape: linear, arc, jitter, spiral, wander
 *   decay       — how movement ends: cut, fade, linger, echo
 *   sizeBias    — multiplier on the node's base radius in the map
 *
 * The resonance vector tells the assignment engine which emotions this
 * pattern fits best. Like fonts/colours, we then run a unique-assignment
 * pass so every canonical emotion lands on its OWN motion identity.
 */

import type { ResonanceAxes } from "@/types";

export type MotionTrajectory = "linear" | "arc" | "jitter" | "spiral" | "wander";
export type MotionDecay = "cut" | "fade" | "linger" | "echo";

export interface MotionPattern {
  id: string;
  name: string;
  description: string;
  /** Breath / pulse period in milliseconds. */
  pace: number;
  /** CSS cubic-bezier easing for transitions. */
  inertia: string;
  trajectory: MotionTrajectory;
  decay: MotionDecay;
  /** Multiplier on the node base radius on the map (0.7 quiet → 1.6 commanding). */
  sizeBias: number;
  /** Resonance vector — used by the assignment engine. */
  resonance: ResonanceAxes;
}

const R = (
  energy: number, temperature: number, tension: number, density: number, movement: number,
  temporality: number, humanity: number, clarity: number, intimacy: number, control: number,
): ResonanceAxes => ({ energy, temperature, tension, density, movement, temporality, humanity, clarity, intimacy, control });

// Common easing curves
const EASE_SOFT     = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_LINGER   = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_SHARP    = "cubic-bezier(0.4, 0, 0.6, 1)";
const EASE_SPRING   = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const EASE_SNAP     = "cubic-bezier(0.7, 0, 0.3, 1)";
const EASE_FADE     = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const EASE_MECH     = "cubic-bezier(0.5, 0, 0.5, 1)";
const EASE_OVERSHOOT = "cubic-bezier(0.68, -0.55, 0.27, 1.55)";

export const MOTION_PATTERNS: MotionPattern[] = [
  // ─── Breath patterns (low energy, contemplative) ─────────────────────
  { id: "respiracion-honda",    name: "Respiración honda",     description: "Pecho que se llena despacio y suelta despacio.",
    pace: 5400, inertia: EASE_LINGER, trajectory: "wander", decay: "linger", sizeBias: 1.75,
    resonance: R(15, 50, 20, 55, 12,  80, 78, 78, 70, 70) },
  { id: "respiracion-tibia",    name: "Respiración tibia",     description: "Pecho que se llena de calor lento.",
    pace: 4800, inertia: EASE_LINGER, trajectory: "wander", decay: "linger", sizeBias: 2.10,
    resonance: R(28, 72, 18, 48, 22,  60, 88, 70, 80, 65) },
  { id: "respiracion-fria",     name: "Respiración fría",      description: "Aire que entra y se queda quieto.",
    pace: 5800, inertia: EASE_FADE,   trajectory: "linear", decay: "fade",   sizeBias: 1.00,
    resonance: R(18, 22, 35, 55, 12,  68, 50, 78, 50, 78) },
  { id: "respiracion-clara",    name: "Respiración clara",     description: "Aire transparente, ritmo regular.",
    pace: 4400, inertia: EASE_FADE,   trajectory: "linear", decay: "fade",   sizeBias: 1.05,
    resonance: R(30, 55, 18, 35, 30,  55, 65, 92, 55, 85) },
  { id: "respiracion-densa",    name: "Respiración densa",     description: "Pecho cargado que casi no respira.",
    pace: 6000, inertia: EASE_LINGER, trajectory: "linear", decay: "linger", sizeBias: 2.20,
    resonance: R(12, 35, 60, 92, 8,   78, 80, 35, 72, 50) },
  { id: "respiracion-recogida", name: "Respiración recogida",  description: "Aliento corto, próximo, contenido.",
    pace: 3800, inertia: EASE_SOFT,   trajectory: "wander", decay: "linger", sizeBias: 0.65,
    resonance: R(22, 60, 35, 45, 20,  62, 85, 60, 92, 70) },

  // ─── Jitter patterns (high tension, low control) ──────────────────────
  { id: "jitter-ansioso",       name: "Jitter ansioso",        description: "Vibración fina e ininterrumpida.",
    pace: 800,  inertia: EASE_SHARP,  trajectory: "jitter", decay: "cut",    sizeBias: 0.55,
    resonance: R(50, 35, 92, 50, 70,  35, 70, 38, 65, 18) },
  { id: "jitter-panico",        name: "Jitter pánico",         description: "Vibración violenta sin centro.",
    pace: 600,  inertia: EASE_SHARP,  trajectory: "jitter", decay: "cut",    sizeBias: 1.00,
    resonance: R(85, 30, 98, 55, 92,  18, 65, 25, 50, 8 ) },
  { id: "jitter-rabioso",       name: "Jitter rabioso",        description: "Vibración caliente que late.",
    pace: 700,  inertia: EASE_SPRING, trajectory: "jitter", decay: "echo",   sizeBias: 1.75,
    resonance: R(92, 85, 90, 55, 85,  22, 72, 40, 55, 12) },
  { id: "jitter-controlado",    name: "Jitter controlado",     description: "Pulso fino dentro de una cuadrícula.",
    pace: 1100, inertia: EASE_MECH,   trajectory: "jitter", decay: "cut",    sizeBias: 0.70,
    resonance: R(55, 40, 78, 55, 60,  45, 50, 85, 35, 88) },

  // ─── Drift patterns (high temporality, slow wander) ───────────────────
  { id: "deriva-polvorienta",   name: "Deriva polvorienta",    description: "Polvo en suspensión que se va asentando.",
    pace: 5600, inertia: EASE_LINGER, trajectory: "wander", decay: "linger", sizeBias: 1.60,
    resonance: R(20, 55, 35, 65, 25,  88, 60, 38, 55, 38) },
  { id: "deriva-anciana",       name: "Deriva anciana",        description: "El movimiento que ya casi no se mueve.",
    pace: 6000, inertia: EASE_LINGER, trajectory: "wander", decay: "fade",   sizeBias: 1.95,
    resonance: R(18, 40, 30, 78, 18,  95, 78, 55, 62, 65) },
  { id: "deriva-nebulosa",      name: "Deriva nebulosa",       description: "Materia indecisa que se desplaza.",
    pace: 4800, inertia: EASE_FADE,   trajectory: "wander", decay: "fade",   sizeBias: 1.10,
    resonance: R(28, 45, 50, 60, 35,  78, 55, 22, 55, 35) },
  { id: "deriva-callada",       name: "Deriva callada",        description: "Andar sin destino, sin ruido.",
    pace: 5400, inertia: EASE_FADE,   trajectory: "wander", decay: "linger", sizeBias: 0.85,
    resonance: R(20, 38, 28, 50, 22,  75, 68, 50, 75, 55) },
  { id: "deriva-extranjera",    name: "Deriva extranjera",     description: "Anda lejos de su propia casa.",
    pace: 5200, inertia: EASE_FADE,   trajectory: "wander", decay: "fade",   sizeBias: 1.00,
    resonance: R(32, 30, 55, 55, 38,  82, 60, 45, 38, 40) },

  // ─── Spiral patterns (control + flow) ─────────────────────────────────
  { id: "espiral-lenta",        name: "Espiral lenta",         description: "Vuelta sobre sí mismo, suave.",
    pace: 4200, inertia: EASE_LINGER, trajectory: "spiral", decay: "linger", sizeBias: 1.75,
    resonance: R(35, 50, 28, 50, 55,  72, 65, 72, 70, 78) },
  { id: "espiral-magnetica",    name: "Espiral magnética",     description: "Cuerpos que se buscan girando.",
    pace: 3200, inertia: EASE_SOFT,   trajectory: "spiral", decay: "linger", sizeBias: 1.50,
    resonance: R(50, 72, 45, 50, 70,  55, 92, 60, 88, 55) },
  { id: "espiral-rapida",       name: "Espiral rápida",        description: "Vértigo controlado.",
    pace: 1800, inertia: EASE_SNAP,   trajectory: "spiral", decay: "cut",    sizeBias: 2.10,
    resonance: R(82, 65, 60, 40, 88,  35, 60, 75, 50, 78) },

  // ─── Burst / leap patterns (high energy) ──────────────────────────────
  { id: "salto-electrico",      name: "Salto eléctrico",       description: "Chispa instantánea.",
    pace: 850,  inertia: EASE_SNAP,   trajectory: "linear", decay: "cut",    sizeBias: 1.75,
    resonance: R(95, 55, 55, 25, 95,  20, 55, 88, 40, 60) },
  { id: "salto-explosivo",      name: "Salto explosivo",       description: "Estallido con rebote.",
    pace: 1100, inertia: EASE_SPRING, trajectory: "arc",    decay: "echo",   sizeBias: 1.85,
    resonance: R(92, 88, 70, 35, 90,  18, 65, 60, 50, 18) },
  { id: "salto-frio",           name: "Salto frío",            description: "Movimiento limpio sin temperatura.",
    pace: 1000, inertia: EASE_SNAP,   trajectory: "linear", decay: "cut",    sizeBias: 1.00,
    resonance: R(80, 22, 55, 30, 88,  35, 35, 90, 25, 82) },

  // ─── Flight patterns (movement + arc) ─────────────────────────────────
  { id: "vuelo-lucido",         name: "Vuelo lúcido",          description: "Ala que ve adonde va.",
    pace: 2200, inertia: EASE_SOFT,   trajectory: "arc",    decay: "linger", sizeBias: 2.10,
    resonance: R(65, 58, 32, 28, 88,  40, 55, 92, 50, 75) },
  { id: "vuelo-calido",         name: "Vuelo cálido",          description: "Ala sobre el aire del verano.",
    pace: 2600, inertia: EASE_SOFT,   trajectory: "arc",    decay: "linger", sizeBias: 2.10,
    resonance: R(60, 78, 28, 30, 85,  50, 75, 78, 65, 68) },

  // ─── Wave / oscillation patterns ──────────────────────────────────────
  { id: "ondulacion-calida",    name: "Ondulación cálida",     description: "Olas suaves de luz tibia.",
    pace: 3200, inertia: EASE_SOFT,   trajectory: "wander", decay: "linger", sizeBias: 2.10,
    resonance: R(50, 78, 30, 42, 65,  55, 78, 65, 70, 60) },
  { id: "ondulacion-aguda",     name: "Ondulación aguda",      description: "Olas tensas, cortas.",
    pace: 1500, inertia: EASE_SHARP,  trajectory: "wander", decay: "cut",    sizeBias: 0.90,
    resonance: R(62, 45, 78, 45, 70,  38, 55, 62, 50, 38) },

  // ─── Mechanical / controlled patterns ─────────────────────────────────
  { id: "mecanico-frio",        name: "Mecánico frío",         description: "Engranaje limpio, sin afecto.",
    pace: 2400, inertia: EASE_MECH,   trajectory: "linear", decay: "cut",    sizeBias: 0.75,
    resonance: R(48, 18, 45, 50, 60,  40, 22, 92, 18, 95) },
  { id: "mecanico-tenso",       name: "Mecánico tenso",        description: "Maquinaria al filo de romperse.",
    pace: 1600, inertia: EASE_SHARP,  trajectory: "linear", decay: "cut",    sizeBias: 1.00,
    resonance: R(60, 28, 88, 55, 55,  45, 30, 85, 30, 78) },
  { id: "mecanico-vacio",       name: "Mecánico vacío",        description: "Reloj que sigue marcando sin nadie.",
    pace: 3200, inertia: EASE_FADE,   trajectory: "linear", decay: "fade",   sizeBias: 0.65,
    resonance: R(22, 28, 28, 55, 35,  60, 25, 78, 22, 88) },

  // ─── Liquid patterns (humanity, warmth) ───────────────────────────────
  { id: "liquido-tibio",        name: "Líquido tibio",         description: "Agua en mano.",
    pace: 3400, inertia: EASE_SOFT,   trajectory: "wander", decay: "linger", sizeBias: 2.10,
    resonance: R(38, 78, 25, 42, 50,  55, 90, 60, 78, 50) },
  { id: "liquido-intimo",       name: "Líquido íntimo",        description: "Aceite que se vierte despacio entre dos.",
    pace: 4800, inertia: EASE_LINGER, trajectory: "wander", decay: "linger", sizeBias: 1.60,
    resonance: R(28, 75, 35, 50, 40,  62, 92, 55, 95, 55) },

  // ─── Ritual patterns (temporality + control + density) ────────────────
  { id: "ritual-ancestral",     name: "Ritual ancestral",      description: "Movimiento que se repite hace siglos.",
    pace: 5800, inertia: EASE_LINGER, trajectory: "linear", decay: "linger", sizeBias: 2.10,
    resonance: R(28, 55, 30, 78, 30,  95, 75, 70, 60, 90) },
  { id: "ritual-vivo",          name: "Ritual vivo",           description: "Gesto antiguo hecho con cuerpo presente.",
    pace: 4200, inertia: EASE_LINGER, trajectory: "arc",    decay: "linger", sizeBias: 1.75,
    resonance: R(45, 62, 35, 65, 50,  85, 88, 65, 78, 75) },

  // ─── Halo / glow patterns (luminosity + low movement) ─────────────────
  { id: "halo-luminoso",        name: "Halo luminoso",         description: "Luz que se ofrece.",
    pace: 3600, inertia: EASE_SOFT,   trajectory: "arc",    decay: "linger", sizeBias: 1.60,
    resonance: R(72, 68, 22, 28, 55,  50, 70, 92, 65, 72) },
  { id: "halo-tremulo",         name: "Halo trémulo",          description: "Vela que tiembla pero no se apaga.",
    pace: 2800, inertia: EASE_FADE,   trajectory: "wander", decay: "fade",   sizeBias: 0.85,
    resonance: R(28, 60, 50, 42, 35,  68, 78, 40, 78, 38) },
  { id: "halo-frio",            name: "Halo frío",             description: "Luna que no calienta.",
    pace: 4400, inertia: EASE_FADE,   trajectory: "arc",    decay: "fade",   sizeBias: 1.00,
    resonance: R(28, 22, 35, 38, 32,  68, 38, 78, 35, 72) },

  // ─── Stillness / weight patterns ──────────────────────────────────────
  { id: "horizontal-quieto",    name: "Horizontal quieto",     description: "Casi no hay movimiento. Sólo respiración.",
    pace: 6000, inertia: EASE_LINGER, trajectory: "linear", decay: "linger", sizeBias: 1.75,
    resonance: R(8,  40, 12, 60, 8,   80, 70, 70, 80, 78) },
  { id: "vertical-ascendente",  name: "Vertical ascendente",   description: "Algo sube y no quiere bajar.",
    pace: 2800, inertia: EASE_SNAP,   trajectory: "linear", decay: "linger", sizeBias: 1.50,
    resonance: R(78, 62, 32, 25, 88,  35, 55, 92, 50, 75) },
  { id: "vertical-descendente", name: "Vertical descendente",  description: "Algo baja y se asienta.",
    pace: 4400, inertia: EASE_LINGER, trajectory: "linear", decay: "linger", sizeBias: 1.95,
    resonance: R(22, 35, 35, 85, 25,  72, 70, 50, 65, 55) },

  // ─── Bounce patterns ──────────────────────────────────────────────────
  { id: "rebote-jugueton",      name: "Rebote juguetón",       description: "Pelota tibia que no se cansa.",
    pace: 1200, inertia: EASE_OVERSHOOT, trajectory: "arc", decay: "echo",   sizeBias: 1.75,
    resonance: R(82, 72, 32, 28, 90,  30, 78, 75, 60, 55) },
  { id: "rebote-nervioso",      name: "Rebote nervioso",       description: "Algo no se decide a aterrizar.",
    pace: 950,  inertia: EASE_OVERSHOOT, trajectory: "arc", decay: "echo",   sizeBias: 1.00,
    resonance: R(72, 50, 80, 35, 85,  28, 50, 55, 45, 22) },

  // ─── Precarious patterns ──────────────────────────────────────────────
  { id: "deriva-precaria",      name: "Deriva precaria",       description: "Andar a punto de caerse.",
    pace: 1900, inertia: EASE_SHARP,  trajectory: "wander", decay: "echo",   sizeBias: 0.55,
    resonance: R(48, 40, 75, 45, 60,  40, 62, 38, 60, 18) },

  // ─── Dense / heavy patterns ───────────────────────────────────────────
  { id: "peso-muerto",          name: "Peso muerto",           description: "Materia que ya no quiere moverse.",
    pace: 6000, inertia: EASE_LINGER, trajectory: "linear", decay: "linger", sizeBias: 2.30,
    resonance: R(8,  25, 45, 92, 8,   80, 82, 28, 68, 35) },
  { id: "peso-oscuro",          name: "Peso oscuro",           description: "Sombra densa que no se aclara.",
    pace: 5400, inertia: EASE_LINGER, trajectory: "wander", decay: "linger", sizeBias: 2.10,
    resonance: R(18, 22, 65, 88, 18,  72, 60, 22, 50, 38) },
];

/**
 * Convenience map for callers that already know the pattern id.
 */
export const MOTION_PATTERN_MAP = new Map(MOTION_PATTERNS.map((p) => [p.id, p]));
