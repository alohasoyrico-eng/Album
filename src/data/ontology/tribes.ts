import type { Tribe } from "@/types";

/**
 * The 22 tribes of José Antonio Marina's emotional ontology.
 * Each tribe represents a phenomenological experience type — a fundamental
 * mode of feeling. Tribes are subdivided into clans (~80 total), and clans
 * contain individual sentimientos.
 *
 * Order follows Marina's original numeration (I–XXII), which roughly groups
 * tribes into thematic arcs:
 *   I–II      desire / aversion
 *   III–VIII  vitality / its loss / unrest / calm
 *   IX–XV     negative outward (anger, hate, envy, fear, futility)
 *   XVI       loss / grief
 *   XVII–XX   wonder / fulfillment / love
 *   XXI–XXII  self-evaluation (pride / shame)
 *
 * Color choices try to translate each tribe's phenomenological character
 * into a perceptual signature on the map.
 */
export const TRIBES: Tribe[] = [
  // I — IMPULSO ─────────────────────────────────────────────────────────────
  {
    id: "impulso",
    name: "Impulso",
    nameEn: "Drive",
    description:
      "Experiencia de un impulso, necesidad o motivación. El cuerpo y la psique reclaman algo que aún no tienen.",
    color: "#A8542B",
    textColor: "#F5DCC8",
    clans: ["ansia", "afan", "capricho", "coaccion", "deseo"],
  },
  // II — AVERSIÓN FÍSICA ────────────────────────────────────────────────────
  {
    id: "aversion-fisica",
    name: "Aversión física",
    nameEn: "Physical Aversion",
    description:
      "Experiencia de aversión física, psicológica o moral. El organismo rechaza con todo su peso somático.",
    color: "#8B8B3D",
    textColor: "#EBEBC5",
    clans: ["asco"],
  },
  // III — VITALIDAD ─────────────────────────────────────────────────────────
  {
    id: "vitalidad",
    name: "Vitalidad",
    nameEn: "Vitality",
    description:
      "Experiencia de la propia vitalidad y energía. El sujeto se siente capaz, lleno, listo para irradiar.",
    color: "#E8C034",
    textColor: "#F8EEC0",
    clans: ["animo", "euforia"],
  },
  // IV — FALTA DE VITALIDAD ─────────────────────────────────────────────────
  {
    id: "falta-vitalidad",
    name: "Falta de vitalidad",
    nameEn: "Lack of Vitality",
    description:
      "Experiencia de la falta de propia vitalidad y energía. El cuerpo no responde, el deseo se ha apagado.",
    color: "#7A8590",
    textColor: "#DCE0E5",
    clans: ["desanimo", "debilidad", "desgana"],
  },
  // V — CAMBIO NEGATIVO ─────────────────────────────────────────────────────
  {
    id: "cambio-negativo",
    name: "Cambio negativo",
    nameEn: "Unrest",
    description:
      "Experiencias negativas de cambio o alteración. Algo dentro vibra sin permiso, sin descanso.",
    color: "#C58530",
    textColor: "#F4E0BE",
    clans: ["intranquilidad", "ansiedad", "impaciencia"],
  },
  // VI — INSEGURIDAD ────────────────────────────────────────────────────────
  {
    id: "inseguridad",
    name: "Inseguridad",
    nameEn: "Insecurity",
    description:
      "La falta de los recursos necesarios para conocer o actuar inhibe la acción y produce un sentimiento negativo.",
    color: "#6A6A78",
    textColor: "#D5D5DC",
    clans: ["inseguridad-clan", "confusion"],
  },
  // VII — ALIVIO ────────────────────────────────────────────────────────────
  {
    id: "alivio",
    name: "Alivio",
    nameEn: "Relief",
    description:
      "Experiencia de ausencia o disminución de una alteración desagradable. El sistema vuelve a respirar.",
    color: "#6FB5A8",
    textColor: "#D8ECE6",
    clans: ["alivio-clan", "tranquilidad", "seguridad"],
  },
  // VIII — AUSENCIA ─────────────────────────────────────────────────────────
  {
    id: "ausencia",
    name: "Ausencia",
    nameEn: "Absence",
    description:
      "Experiencia de la ausencia de estímulos relevantes o activadores. El mundo se vuelve plano.",
    color: "#B0A282",
    textColor: "#E8E2D2",
    clans: ["aburrimiento"],
  },
  // IX — OBSTÁCULO ──────────────────────────────────────────────────────────
  {
    id: "obstaculo",
    name: "Obstáculo",
    nameEn: "Obstacle",
    description:
      "Sentimientos negativos contra lo que obstaculiza el deseo. El choque entre voluntad y mundo.",
    color: "#C73A3A",
    textColor: "#F8D8D8",
    clans: ["enfado", "ira", "furia", "rencor"],
  },
  // X — AVERSIÓN DURADERA ───────────────────────────────────────────────────
  {
    id: "aversion-duradera",
    name: "Aversión duradera",
    nameEn: "Lasting Aversion",
    description:
      "Experiencia de aversión duradera o negación del valor de alguien. El rechazo se vuelve estructura.",
    color: "#6B2C30",
    textColor: "#E8C8CC",
    clans: ["desamor", "desprecio", "odio"],
  },
  // XI — BIEN AJENO ─────────────────────────────────────────────────────────
  {
    id: "bien-ajeno",
    name: "Bien ajeno",
    nameEn: "The Good of the Other",
    description:
      "El bien de una persona provoca malestar en otra. La medida del deseo propio en el espejo del otro.",
    color: "#7CA040",
    textColor: "#DEEACA",
    clans: ["envidia", "celos"],
  },
  // XII — PELIGRO ───────────────────────────────────────────────────────────
  {
    id: "peligro",
    name: "Peligro",
    nameEn: "Danger",
    description:
      "Experiencia de la aparición de un peligro o de algo que excede la posibilidad de control.",
    color: "#6A3FA8",
    textColor: "#E2D0F0",
    clans: ["miedo", "susto", "horror", "fobia"],
  },
  // XIII — DESMENTIDO ───────────────────────────────────────────────────────
  {
    id: "desmentido",
    name: "Desmentido",
    nameEn: "Disappointment",
    description:
      "Experiencia de cómo una previsión agradable resulta desmentida por los hechos.",
    color: "#9A6678",
    textColor: "#E8D2D8",
    clans: ["decepcion", "fracaso"],
  },
  // XIV — FUTURO POSITIVO ───────────────────────────────────────────────────
  {
    id: "futuro-positivo",
    name: "Futuro positivo",
    nameEn: "Positive Future",
    description:
      "Experiencias derivadas de una evaluación positiva del futuro. El tiempo se inclina hacia el bien.",
    color: "#4EAA76",
    textColor: "#D2EADD",
    clans: ["expectacion", "esperanza", "confianza"],
  },
  // XV — FUTURO NEGATIVO ────────────────────────────────────────────────────
  {
    id: "futuro-negativo",
    name: "Futuro negativo",
    nameEn: "Negative Future",
    description:
      "Experiencias derivadas de una evaluación negativa del futuro. El tiempo se inclina hacia la pérdida.",
    color: "#4A5A82",
    textColor: "#CED4E0",
    clans: ["desesperanza", "desconfianza"],
  },
  // XVI — PÉRDIDA ───────────────────────────────────────────────────────────
  {
    id: "perdida",
    name: "Pérdida",
    nameEn: "Loss",
    description:
      "Experiencia de la pérdida del objeto de nuestros deseos o proyectos. La tribu donde habita la melancolía.",
    color: "#3B6CAF",
    textColor: "#D2DCEC",
    clans: [
      "tristeza",
      "melancolia",
      "desamparo",
      "compasion",
      "nostalgia",
      "resignacion",
    ],
  },
  // XVII — NO HABITUAL ──────────────────────────────────────────────────────
  {
    id: "no-habitual",
    name: "No habitual",
    nameEn: "The Unusual",
    description:
      "Experiencias derivadas de la aparición de algo no habitual. El asombro, la fascinación, el respeto.",
    color: "#2D9FB4",
    textColor: "#CDE8EE",
    clans: [
      "sorpresa",
      "pasmo",
      "admiracion",
      "respeto",
      "sentimiento-estetico",
      "sentimiento-comico",
      "sentimiento-religioso",
    ],
  },
  // XVIII — REALIZACIÓN ─────────────────────────────────────────────────────
  {
    id: "realizacion",
    name: "Realización",
    nameEn: "Fulfillment",
    description:
      "Experiencias derivadas de la realización de nuestros deseos y proyectos. Plenitud, alegría, júbilo.",
    color: "#E59B2C",
    textColor: "#F8E2C2",
    clans: ["satisfaccion", "alegria", "jubilo", "felicidad"],
  },
  // XIX — BIEN RECIBIDO ─────────────────────────────────────────────────────
  {
    id: "bien-recibido",
    name: "Bien recibido",
    nameEn: "Received Good",
    description:
      "Experiencias provocadas por el bien que se ha recibido de una persona. La gratitud como vínculo.",
    color: "#DF8260",
    textColor: "#F5DCD0",
    clans: ["gratitud"],
  },
  // XX — BIEN DESEADO ───────────────────────────────────────────────────────
  {
    id: "bien-deseado",
    name: "Bien deseado",
    nameEn: "Desired Good",
    description:
      "Experiencia y deseo del bien de otro: amor, amistad, pasión, ternura, filantropía.",
    color: "#C25F7C",
    textColor: "#F0D2DC",
    clans: ["amor", "amistad", "amor-erotico", "carino", "filantropia"],
  },
  // XXI — EVALUACIÓN POSITIVA ───────────────────────────────────────────────
  {
    id: "evaluacion-positiva",
    name: "Evaluación positiva",
    nameEn: "Positive Self-Evaluation",
    description:
      "Experiencias derivadas de la evaluación positiva de uno mismo. Orgullo, dignidad, soberbia.",
    color: "#A06E32",
    textColor: "#EADCC0",
    clans: ["orgullo", "pundonor", "soberbia"],
  },
  // XXII — EVALUACIÓN NEGATIVA ──────────────────────────────────────────────
  {
    id: "evaluacion-negativa",
    name: "Evaluación negativa",
    nameEn: "Negative Self-Evaluation",
    description:
      "Experiencias derivadas de la evaluación negativa de uno mismo. Inferioridad, vergüenza, culpa.",
    color: "#8B5A85",
    textColor: "#E2D0DC",
    clans: ["inferioridad", "autodesprecio", "verguenza", "culpa"],
  },
];

export const TRIBE_MAP = new Map(TRIBES.map((t) => [t.id, t]));

/**
 * Tribes in their canonical Marina order (I–XXII).
 * Useful for radial layouts and editorial sequences.
 */
export const TRIBES_ORDERED = TRIBES;
