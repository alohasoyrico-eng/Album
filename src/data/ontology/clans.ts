import type { Clan, TribeId } from "@/types";

/**
 * The full clan catalog from Marina's ontology.
 *
 * Each clan is a coherent family of sentimientos (free-text Spanish feeling
 * words) belonging to a single tribe. Antónimos are explicit oppositions
 * cited by Marina — they're stored as plain strings because they're not
 * all themselves represented as clans in the catalog.
 *
 * `canonicalEmotion` (optional) is the curated emotion id (from EMOTIONS)
 * that best represents this clan as a fully-developed editorial entry,
 * with full resonance axes, color/typography/music resonance, etc.
 *
 * ~58 clans across the 22 tribes.
 */
export const CLANS: Clan[] = [
  // ─── I. IMPULSO ─────────────────────────────────────────────────────────
  {
    id: "ansia",
    name: "Ansia",
    tribe: "impulso",
    description:
      "Tensión interna de quien necesita algo con un peso que ya no puede sostenerse en silencio.",
    feelings: ["anhelo", "ansia", "ansiedad", "avidez", "codicia", "mono", "voracidad"],
    antonyms: ["saciedad", "desgana"],
    canonicalEmotion: "anhelo",
  },
  {
    id: "afan",
    name: "Afán",
    tribe: "impulso",
    description: "Determinación sostenida que pone el cuerpo entero al servicio de un propósito.",
    feelings: ["afán", "empeño"],
    antonyms: ["desidia"],
  },
  {
    id: "capricho",
    name: "Capricho",
    tribe: "impulso",
    description: "Deseo súbito que ignora la medida; aparece sin causa y desaparece sin culpa.",
    feelings: ["capricho", "antojo", "manía"],
    antonyms: ["moderación", "constancia"],
  },
  {
    id: "coaccion",
    name: "Coacción",
    tribe: "impulso",
    description: "Impulso que viene de afuera y se asienta como obligación dentro del sujeto.",
    feelings: [
      "coacción",
      "exigencia",
      "obligación",
      "responsabilidad",
      "sentimiento de deber",
      "sentimiento de estar en deuda",
    ],
    antonyms: ["anomia", "laxitud", "libertad", "irresponsabilidad"],
  },
  {
    id: "deseo",
    name: "Deseo",
    tribe: "impulso",
    description: "Apertura del sujeto hacia un bien todavía no poseído; motor de la voluntad.",
    feelings: ["apetito", "deseo", "gana", "querer"],
    antonyms: ["desgana", "inapetencia", "anorexia", "apatía", "abulia", "saciedad", "repulsión"],
  },

  // ─── II. AVERSIÓN FÍSICA ────────────────────────────────────────────────
  {
    id: "asco",
    name: "Asco",
    tribe: "aversion-fisica",
    description: "Rechazo somático ante lo que el organismo declara incompatible consigo mismo.",
    feelings: [
      "asco",
      "náusea",
      "aprensión",
      "escrúpulo",
      "grima",
      "horror",
      "repelús",
      "repugnancia",
      "repulsión",
    ],
    antonyms: ["atracción", "gusto"],
  },

  // ─── III. VITALIDAD ─────────────────────────────────────────────────────
  {
    id: "animo",
    name: "Ánimo",
    tribe: "vitalidad",
    description: "Energía templada que prepara la acción sin necesidad de embriaguez.",
    feelings: ["ánimo", "aliento", "brío", "ganas"],
    antonyms: ["desánimo", "desaliento", "desgana"],
  },
  {
    id: "euforia",
    name: "Euforia",
    tribe: "vitalidad",
    description: "Vitalidad desbordada, cercana al exceso; el sujeto se siente capaz de todo.",
    feelings: ["ebriedad", "elación", "euforia", "manía"],
    antonyms: ["depresión"],
    canonicalEmotion: "euforia",
  },

  // ─── IV. FALTA DE VITALIDAD ─────────────────────────────────────────────
  {
    id: "desanimo",
    name: "Desánimo",
    tribe: "falta-vitalidad",
    description: "Energía que se retira sin razón clara; el cuerpo permanece, la voluntad no.",
    feelings: [
      "abatimiento",
      "decaimiento",
      "desaliento",
      "desánimo",
      "descorazonamiento",
      "desmoralización",
      "languidez",
    ],
    antonyms: ["ánimo", "aliento"],
  },
  {
    id: "debilidad",
    name: "Debilidad",
    tribe: "falta-vitalidad",
    description: "Pérdida material de potencia. El sujeto no puede aunque quiera.",
    feelings: ["cansancio", "debilidad", "desfallecimiento", "fatiga", "impotencia", "languidez", "postración"],
    antonyms: ["poder", "vitalidad"],
  },
  {
    id: "desgana",
    name: "Desgana",
    tribe: "falta-vitalidad",
    description: "El deseo se ha apagado y nada vuelve a encenderlo. Vida sin apetito.",
    feelings: ["abulia", "apatía", "anorexia", "desgana", "inapetencia"],
    antonyms: ["ganas", "apetito", "deseo"],
  },

  // ─── V. CAMBIO NEGATIVO ─────────────────────────────────────────────────
  {
    id: "intranquilidad",
    name: "Intranquilidad",
    tribe: "cambio-negativo",
    description: "Alteración sin nombre claro; el sistema vibra pero no sabe contra qué.",
    feelings: [
      "agitación",
      "desasosiego",
      "desazón",
      "inquietud",
      "intranquilidad",
      "nerviosismo",
      "preocupación",
      "reconcomio",
      "turbación",
      "zozobra",
    ],
    antonyms: ["tranquilidad"],
  },
  {
    id: "ansiedad",
    name: "Ansiedad",
    tribe: "cambio-negativo",
    description: "Tensión sostenida ante una amenaza difusa que no termina de llegar.",
    feelings: ["agobio", "agonía", "angustia", "ansiedad"],
    antonyms: ["tranquilidad", "paz"],
    canonicalEmotion: "ansiedad",
  },
  {
    id: "impaciencia",
    name: "Impaciencia",
    tribe: "cambio-negativo",
    description: "Espera mal soportada. El tiempo se vuelve obstáculo.",
    feelings: ["comezón", "hormigueo", "impaciencia"],
    antonyms: ["tranquilidad", "paciencia"],
  },

  // ─── VI. INSEGURIDAD ────────────────────────────────────────────────────
  {
    id: "inseguridad-clan",
    name: "Inseguridad",
    tribe: "inseguridad",
    description: "Falta de criterio para decidir. La voluntad no encuentra apoyo.",
    feelings: ["duda", "incertidumbre", "indecisión"],
    antonyms: ["seguridad", "certeza", "certidumbre", "decisión", "resolución"],
  },
  {
    id: "confusion",
    name: "Confusión",
    tribe: "inseguridad",
    description: "El mundo deja de organizarse en figuras claras; las categorías se mezclan.",
    feelings: ["confusión", "desconcierto", "perplejidad"],
    antonyms: ["claridad"],
  },

  // ─── VII. ALIVIO ────────────────────────────────────────────────────────
  {
    id: "alivio-clan",
    name: "Alivio",
    tribe: "alivio",
    description: "Disminución de un peso que estuvo presente; la respiración vuelve.",
    feelings: ["alivio", "consuelo", "descanso"],
    antonyms: ["desconsuelo", "fatiga"],
  },
  {
    id: "tranquilidad",
    name: "Tranquilidad",
    tribe: "alivio",
    description: "Estado prolongado de no perturbación; el agua quieta donde la mente se asienta.",
    feelings: ["calma", "despreocupación", "paz", "placidez", "quietud", "serenidad", "sosiego", "tranquilidad"],
    antonyms: ["intranquilidad", "desasosiego"],
    canonicalEmotion: "serenidad",
  },
  {
    id: "seguridad",
    name: "Seguridad",
    tribe: "alivio",
    description: "Confianza en la firmeza de lo conocido. El sujeto se mueve sin vigilar.",
    feelings: ["certeza", "certidumbre", "decisión", "seguridad"],
    antonyms: ["duda", "incertidumbre", "indecisión", "confusión", "inseguridad"],
  },

  // ─── VIII. AUSENCIA ─────────────────────────────────────────────────────
  {
    id: "aburrimiento",
    name: "Aburrimiento",
    tribe: "ausencia",
    description: "Mundo sin sabor; el tiempo se vuelve materia que no se puede atravesar.",
    feelings: ["aburrimiento", "acidia", "empalago", "esplín", "fastidio", "hartura", "hastío", "tedio"],
    antonyms: ["diversión", "interés", "satisfacción", "animación"],
  },

  // ─── IX. OBSTÁCULO ──────────────────────────────────────────────────────
  {
    id: "enfado",
    name: "Enfado",
    tribe: "obstaculo",
    description: "Choque irritado contra lo que estorba; intensidad breve.",
    feelings: ["berrinche", "cabreo", "enfado", "enojo", "rabieta"],
    antonyms: ["calma", "paciencia"],
  },
  {
    id: "ira",
    name: "Ira",
    tribe: "obstaculo",
    description: "Cólera sostenida ante una injusticia o frustración percibida.",
    feelings: ["cólera", "despecho", "exasperación", "indignación", "ira"],
    antonyms: ["calma", "paciencia", "alegría"],
    canonicalEmotion: "ira",
  },
  {
    id: "furia",
    name: "Furia",
    tribe: "obstaculo",
    description: "Estado paroxístico; la ira pierde toda mesura y se vuelve fuerza ciega.",
    feelings: ["coraje", "furia", "furor", "rabia", "saña", "vesania"],
    antonyms: ["calma", "paciencia", "mesura"],
  },
  {
    id: "rencor",
    name: "Rencor",
    tribe: "obstaculo",
    description: "Ira que no se descarga y que persiste como sedimento bajo otras emociones.",
    feelings: ["encono", "rencor", "resentimiento", "resquemor"],
    antonyms: ["calma", "paciencia", "misericordia", "amor"],
  },

  // ─── X. AVERSIÓN DURADERA ───────────────────────────────────────────────
  {
    id: "desamor",
    name: "Desamor",
    tribe: "aversion-duradera",
    description: "Cuando el vínculo afectivo se ha retirado por completo; ya nada calienta.",
    feelings: ["desafecto", "desamor", "desapego", "desvío", "frialdad", "indiferencia"],
    antonyms: ["afecto", "amor", "pasión", "interés"],
  },
  {
    id: "desprecio",
    name: "Desprecio",
    tribe: "aversion-duradera",
    description: "Juicio negativo sobre el valor del otro; rebajamiento visible o callado.",
    feelings: ["desdén", "desprecio", "displicencia"],
    antonyms: ["aprecio", "estima"],
    canonicalEmotion: "desprecio",
  },
  {
    id: "odio",
    name: "Odio",
    tribe: "aversion-duradera",
    description: "Aversión organizada que estructura la relación con el otro a lo largo del tiempo.",
    feelings: [
      "aborrecimiento",
      "animadversión",
      "animosidad",
      "antipatía",
      "despecho",
      "detestación",
      "encono",
      "enemistad",
      "execración",
      "fobia",
      "malquerencia",
      "manía",
      "odio",
      "ojeriza",
      "rencor",
      "resentimiento",
    ],
    antonyms: ["amor", "simpatía", "amistad"],
  },

  // ─── XI. BIEN AJENO ─────────────────────────────────────────────────────
  {
    id: "envidia",
    name: "Envidia",
    tribe: "bien-ajeno",
    description: "Malestar por el bien del otro; espejo en que el deseo propio se hace visible.",
    feelings: ["envidia", "pelusa"],
    antonyms: ["amor", "congratulación", "generosidad"],
    canonicalEmotion: "envidia",
  },
  {
    id: "celos",
    name: "Celos",
    tribe: "bien-ajeno",
    description: "Temor a perder lo propio frente a un tercero. Rivalidad teñida de amenaza.",
    feelings: ["celos", "rivalidad"],
    antonyms: ["confianza"],
  },

  // ─── XII. PELIGRO ───────────────────────────────────────────────────────
  {
    id: "miedo",
    name: "Miedo",
    tribe: "peligro",
    description: "Anticipación afectiva del daño; el sistema se prepara para huir o no ser.",
    feelings: ["aprensión", "canguelo", "hipocondría", "miedo", "pánico", "pavor", "temor", "terror"],
    antonyms: ["esperanza", "confianza", "impavidez"],
    canonicalEmotion: "miedo",
  },
  {
    id: "susto",
    name: "Susto",
    tribe: "peligro",
    description: "Sobresalto agudo ante un estímulo inesperado; corta duración, fuerte huella.",
    feelings: ["alarma", "sobrecogimiento", "sobresalto", "susto"],
    antonyms: ["tranquilidad", "seguridad", "familiaridad"],
  },
  {
    id: "horror",
    name: "Horror",
    tribe: "peligro",
    description: "Miedo paralizante ante algo cuya magnitud excede la capacidad de respuesta.",
    feelings: ["espanto", "horror"],
    antonyms: ["calma", "admiración"],
  },
  {
    id: "fobia",
    name: "Fobia",
    tribe: "peligro",
    description: "Miedo cristalizado ante un objeto o situación específica; aprendido y persistente.",
    feelings: ["agorafobia", "claustrofobia", "filofobia", "fobia", "fotofobia", "hidrofobia"],
    antonyms: ["agorafilia", "claustrofilia", "fotofilia", "hidrofilia"],
  },

  // ─── XIII. DESMENTIDO ───────────────────────────────────────────────────
  {
    id: "decepcion",
    name: "Decepción",
    tribe: "desmentido",
    description: "Quiebra de una expectativa; el mundo no coincidió con la imagen que de él tenías.",
    feelings: ["chasco", "decepción", "desencanto", "desengaño", "desilusión", "frustración"],
    antonyms: ["confirmación", "satisfacción"],
  },
  {
    id: "fracaso",
    name: "Fracaso",
    tribe: "desmentido",
    description: "Conciencia de que un proyecto largamente sostenido no llegará a ser.",
    feelings: ["fracaso"],
    antonyms: ["éxito"],
  },

  // ─── XIV. FUTURO POSITIVO ───────────────────────────────────────────────
  {
    id: "expectacion",
    name: "Expectación",
    tribe: "futuro-positivo",
    description: "Atención abierta a lo que vendrá; el ánimo se inclina hacia el horizonte.",
    feelings: ["expectación"],
    antonyms: ["miedo", "desinterés"],
    canonicalEmotion: "anticipación",
  },
  {
    id: "esperanza",
    name: "Esperanza",
    tribe: "futuro-positivo",
    description: "Confianza en que algo deseado sigue siendo posible aunque no esté garantizado.",
    feelings: ["esperanza", "ilusión"],
    antonyms: ["desesperanza", "desilusión", "pesimismo"],
    canonicalEmotion: "esperanza",
  },
  {
    id: "confianza",
    name: "Confianza",
    tribe: "futuro-positivo",
    description: "Reposo del juicio en otra persona o en uno mismo; ya no hace falta vigilar.",
    feelings: ["confianza", "fe"],
    antonyms: ["desconfianza"],
  },

  // ─── XV. FUTURO NEGATIVO ────────────────────────────────────────────────
  {
    id: "desesperanza",
    name: "Desesperanza",
    tribe: "futuro-negativo",
    description: "Pérdida de la dimensión del futuro como espacio de posibilidad.",
    feelings: ["desesperanza", "desesperación"],
    antonyms: ["esperanza", "ilusión"],
    canonicalEmotion: "desesperación",
  },
  {
    id: "desconfianza",
    name: "Desconfianza",
    tribe: "futuro-negativo",
    description: "Vigilancia sostenida; sospecha de que el bien anunciado puede ocultar daño.",
    feelings: ["desconfianza", "escama", "recelo", "sospecha"],
    antonyms: ["confianza"],
  },

  // ─── XVI. PÉRDIDA ───────────────────────────────────────────────────────
  {
    id: "tristeza",
    name: "Tristeza",
    tribe: "perdida",
    description: "Sentimiento amplio de pérdida; el color del mundo desciende un tono.",
    feelings: [
      "aflicción",
      "amargura",
      "congoja",
      "consternación",
      "desdicha",
      "desconsuelo",
      "dolor",
      "infelicidad",
      "murria",
      "pena",
      "pesar",
      "pesadumbre",
      "tribulación",
    ],
    antonyms: ["alegría"],
    canonicalEmotion: "tristeza",
  },
  {
    id: "melancolia",
    name: "Melancolía",
    tribe: "perdida",
    description: "Tristeza sin objeto, atravesada por una belleza secreta; el alma de la pérdida.",
    feelings: ["melancolía", "esplín"],
    antonyms: ["alegría", "diversión"],
    canonicalEmotion: "melancolía",
  },
  {
    id: "desamparo",
    name: "Desamparo",
    tribe: "perdida",
    description: "Conciencia de no tener a quién acudir; el sujeto a la intemperie.",
    feelings: ["abandono", "desamparo", "desolación", "soledad"],
    antonyms: ["amparo", "ayuda", "seguridad"],
    canonicalEmotion: "soledad",
  },
  {
    id: "compasion",
    name: "Compasión",
    tribe: "perdida",
    description: "Sentir el dolor del otro como propio sin perderse en él.",
    feelings: ["compasión", "conmiseración", "lástima", "piedad"],
    antonyms: ["insensibilidad", "dureza", "inhumanidad", "despiedad", "crueldad", "malignidad", "sadismo"],
  },
  {
    id: "nostalgia",
    name: "Nostalgia",
    tribe: "perdida",
    description: "Dolor por el regreso imposible; el pasado convertido en patria perdida.",
    feelings: ["añoranza", "morriña", "nostalgia", "saudade"],
    antonyms: ["alegría"],
    canonicalEmotion: "nostalgia",
  },
  {
    id: "resignacion",
    name: "Resignación",
    tribe: "perdida",
    description: "Aceptación sin rebeldía de lo que ya no puede ser cambiado.",
    feelings: ["resignación"],
    antonyms: ["rebeldía"],
  },

  // ─── XVII. NO HABITUAL ──────────────────────────────────────────────────
  {
    id: "sorpresa",
    name: "Sorpresa",
    tribe: "no-habitual",
    description: "Quiebre breve del orden esperado; la atención se reorganiza de golpe.",
    feelings: ["asombro", "extrañeza", "sorpresa"],
    antonyms: ["aburrimiento", "habituación", "familiaridad"],
    canonicalEmotion: "curiosidad",
  },
  {
    id: "pasmo",
    name: "Pasmo",
    tribe: "no-habitual",
    description: "Suspensión cognitiva ante lo que excede la capacidad de comprenderlo de inmediato.",
    feelings: ["estupefacción", "estupor", "pasmo", "perplejidad"],
    antonyms: ["indiferencia"],
  },
  {
    id: "admiracion",
    name: "Admiración",
    tribe: "no-habitual",
    description: "Reconocimiento de un valor o belleza que excede la medida ordinaria.",
    feelings: ["admiración", "arrobo", "embeleso", "espanto", "fascinación"],
    antonyms: ["desprecio", "desinterés"],
    canonicalEmotion: "admiración",
  },
  {
    id: "respeto",
    name: "Respeto",
    tribe: "no-habitual",
    description: "Reconocimiento del valor del otro que regula la distancia y la propia conducta.",
    feelings: ["adoración", "devoción", "respeto", "reverencia", "veneración"],
    antonyms: ["desprecio", "desinterés"],
  },
  {
    id: "sentimiento-estetico",
    name: "Sentimiento estético",
    tribe: "no-habitual",
    description: "La forma de algo nos detiene: armonía o ruptura que produce contemplación.",
    feelings: ["belleza", "sentimiento estético", "sublimidad"],
    antonyms: ["fealdad", "indiferencia estética"],
    canonicalEmotion: "sublimidad",
  },
  {
    id: "sentimiento-comico",
    name: "Sentimiento cómico",
    tribe: "no-habitual",
    description: "La incongruencia que se libera como risa; el orden quebrado sin daño.",
    feelings: ["risa", "humor", "sentimiento cómico"],
    antonyms: ["seriedad", "solemnidad"],
  },
  {
    id: "sentimiento-religioso",
    name: "Sentimiento religioso",
    tribe: "no-habitual",
    description: "Apertura a una dimensión que excede el yo; reverencia ante el misterio.",
    feelings: ["sentimiento religioso", "espiritualidad", "trascendencia"],
    antonyms: ["mundanidad", "literalidad"],
  },

  // ─── XVIII. REALIZACIÓN ─────────────────────────────────────────────────
  {
    id: "satisfaccion",
    name: "Satisfacción",
    tribe: "realizacion",
    description: "Cumplimiento sereno de un deseo; el sujeto reposa en lo obtenido.",
    feelings: ["complacencia", "contento", "regodeo", "satisfacción"],
    antonyms: ["insatisfacción", "deseo", "ansia", "descontento", "decepción"],
  },
  {
    id: "alegria",
    name: "Alegría",
    tribe: "realizacion",
    description: "Estado expansivo en que la vida se afirma a sí misma con luz propia.",
    feelings: ["alegría", "animación", "congratulación", "gozo", "diversión"],
    antonyms: ["tristeza", "descontento", "aburrimiento", "angustia"],
    canonicalEmotion: "alegría",
  },
  {
    id: "jubilo",
    name: "Júbilo",
    tribe: "realizacion",
    description: "Alegría intensa, festiva, casi sonora; un cuerpo entero celebra.",
    feelings: ["alborozo", "algazara", "júbilo", "regocijo"],
    antonyms: ["tristeza"],
  },
  {
    id: "felicidad",
    name: "Felicidad",
    tribe: "realizacion",
    description: "Sentimiento de plenitud sostenida; el sujeto coincide consigo mismo.",
    feelings: ["beatitud", "dicha", "éxtasis", "felicidad", "plenitud"],
    antonyms: ["infelicidad", "desdicha"],
    canonicalEmotion: "éxtasis",
  },

  // ─── XIX. BIEN RECIBIDO ─────────────────────────────────────────────────
  {
    id: "gratitud",
    name: "Gratitud",
    tribe: "bien-recibido",
    description: "Reconocimiento del bien recibido como obsequio del otro; el vínculo se afirma.",
    feelings: ["agradecimiento", "gratitud", "reconocimiento"],
    antonyms: ["ingratitud"],
    canonicalEmotion: "gratitud",
  },

  // ─── XX. BIEN DESEADO ───────────────────────────────────────────────────
  {
    id: "amor",
    name: "Amor",
    tribe: "bien-deseado",
    description: "Vínculo afectivo en que el bien del otro pasa a ser bien propio.",
    feelings: [
      "amor",
      "afecto",
      "apego",
      "aprecio",
      "bienquerencia",
      "estima",
      "fervor",
      "predilección",
      "querencia",
      "querer",
      "simpatía",
    ],
    antonyms: ["odio", "despego", "antipatía", "desprecio", "malquerencia", "desamor"],
    canonicalEmotion: "amor",
  },
  {
    id: "amistad",
    name: "Amistad",
    tribe: "bien-deseado",
    description: "Forma específica del amor entre iguales sostenida en el tiempo.",
    feelings: ["amistad"],
    antonyms: ["enemistad", "hostilidad"],
  },
  {
    id: "amor-erotico",
    name: "Amor erótico",
    tribe: "bien-deseado",
    description: "Encuentro afectivo en que la presencia del otro electriza el cuerpo y el deseo.",
    feelings: ["enamoramiento", "pasión"],
    antonyms: ["frialdad", "desamor", "desinterés"],
    canonicalEmotion: "pasión",
  },
  {
    id: "carino",
    name: "Cariño",
    tribe: "bien-deseado",
    description: "Afecto cálido y cotidiano; el amor en su forma más sostenible.",
    feelings: ["cariño", "ternura"],
    antonyms: ["frialdad", "indiferencia", "desamor"],
    canonicalEmotion: "ternura",
  },
  {
    id: "filantropia",
    name: "Filantropía",
    tribe: "bien-deseado",
    description: "Amor extendido a quienes no se conoce; afirmación del valor común de lo humano.",
    feelings: ["caridad", "filantropía", "solidaridad"],
    antonyms: ["misantropía", "inhumanidad"],
  },

  // ─── XXI. EVALUACIÓN POSITIVA ───────────────────────────────────────────
  {
    id: "orgullo",
    name: "Orgullo",
    tribe: "evaluacion-positiva",
    description: "Reconocimiento del propio valor; el sujeto se sostiene erguido.",
    feelings: ["altivez", "autoestima", "orgullo"],
    antonyms: ["vergüenza", "deshonra"],
  },
  {
    id: "pundonor",
    name: "Pundonor",
    tribe: "evaluacion-positiva",
    description: "Sensibilidad ante la propia dignidad; cuidado de cómo aparece uno ante los demás.",
    feelings: ["dignidad", "pundonor", "vergüenza"],
    antonyms: ["indignidad", "desvergüenza"],
  },
  {
    id: "soberbia",
    name: "Soberbia",
    tribe: "evaluacion-positiva",
    description: "Exceso de auto-afirmación que niega el lugar del otro.",
    feelings: ["egolatría", "inmodestia", "soberbia", "vanidad"],
    antonyms: ["humildad", "modestia"],
  },

  // ─── XXII. EVALUACIÓN NEGATIVA ──────────────────────────────────────────
  {
    id: "inferioridad",
    name: "Inferioridad",
    tribe: "evaluacion-negativa",
    description: "Conciencia dolorosa de no estar a la altura; el sujeto se mide y se rebaja.",
    feelings: ["humildad", "inferioridad"],
    antonyms: ["superioridad", "orgullo", "soberbia"],
  },
  {
    id: "autodesprecio",
    name: "Autodesprecio",
    tribe: "evaluacion-negativa",
    description: "El juicio negativo se vuelve contra uno mismo; el sujeto se rechaza.",
    feelings: ["autodesprecio"],
    antonyms: ["autoestima", "orgullo"],
  },
  {
    id: "verguenza",
    name: "Vergüenza",
    tribe: "evaluacion-negativa",
    description: "Conciencia aguda de ser visto en una falta; el deseo de desaparecer.",
    feelings: [
      "apuro",
      "azaramiento",
      "bochorno",
      "corte",
      "embarazo",
      "pudor",
      "sonrojo",
      "turbación",
      "vergüenza",
      "vergüenza ajena",
    ],
    antonyms: ["desvergüenza", "seguridad", "audacia"],
    canonicalEmotion: "vergüenza",
  },
  {
    id: "culpa",
    name: "Culpa",
    tribe: "evaluacion-negativa",
    description: "Conciencia moral de haber causado un mal; deseo de reparación.",
    feelings: ["arrepentimiento", "contrición", "culpa", "escrúpulos", "pesar", "remordimiento"],
    antonyms: ["inocencia", "irresponsabilidad"],
    canonicalEmotion: "culpa",
  },
];

export const CLAN_MAP = new Map(CLANS.map((c) => [c.id, c]));

/**
 * Group clans by tribe for radial layouts and tribe-detail views.
 */
export const CLANS_BY_TRIBE: Record<TribeId, Clan[]> = CLANS.reduce(
  (acc, c) => {
    if (!acc[c.tribe]) acc[c.tribe] = [];
    acc[c.tribe].push(c);
    return acc;
  },
  {} as Record<TribeId, Clan[]>,
);
