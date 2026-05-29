import type { ResonanceRelationship } from "@/types";

export const RESONANCE_RELATIONSHIPS: ResonanceRelationship[] = [
  // Emotion ↔ Emotion
  { id: "mel-tri", source: "melancolía", sourceType: "emotion", target: "tristeza", targetType: "emotion", strength: 0.85, ambiguity: 0.15, collectiveAgreement: 0.88, culturalVariability: 0.2, resonanceType: "emotional", validations: 312, contradictions: 44 },
  { id: "mel-nos", source: "melancolía", sourceType: "emotion", target: "nostalgia", targetType: "emotion", strength: 0.78, ambiguity: 0.22, collectiveAgreement: 0.82, culturalVariability: 0.28, resonanceType: "emotional", validations: 287, contradictions: 58 },
  { id: "ang-mie", source: "angustia", sourceType: "emotion", target: "miedo", targetType: "emotion", strength: 0.72, ambiguity: 0.28, collectiveAgreement: 0.75, culturalVariability: 0.22, resonanceType: "emotional", validations: 198, contradictions: 65 },
  { id: "ale-gra", source: "alegría", sourceType: "emotion", target: "gratitud", targetType: "emotion", strength: 0.7, ambiguity: 0.2, collectiveAgreement: 0.82, culturalVariability: 0.18, resonanceType: "emotional", validations: 244, contradictions: 52 },
  { id: "amo-ter", source: "amor", sourceType: "emotion", target: "ternura", targetType: "emotion", strength: 0.88, ambiguity: 0.12, collectiveAgreement: 0.92, culturalVariability: 0.15, resonanceType: "emotional", validations: 390, contradictions: 32 },
  { id: "ext-euf", source: "éxtasis", sourceType: "emotion", target: "euforia", targetType: "emotion", strength: 0.72, ambiguity: 0.32, collectiveAgreement: 0.7, culturalVariability: 0.38, resonanceType: "emotional", validations: 165, contradictions: 72 },
  { id: "esp-ant", source: "esperanza", sourceType: "emotion", target: "anticipación", targetType: "emotion", strength: 0.75, ambiguity: 0.25, collectiveAgreement: 0.78, culturalVariability: 0.22, resonanceType: "emotional", validations: 189, contradictions: 55 },
  { id: "sub-ext", source: "sublimidad", sourceType: "emotion", target: "éxtasis", targetType: "emotion", strength: 0.65, ambiguity: 0.38, collectiveAgreement: 0.68, culturalVariability: 0.42, resonanceType: "symbolic", validations: 142, contradictions: 68 },
  { id: "ira-ang", source: "ira", sourceType: "emotion", target: "angustia", targetType: "emotion", strength: 0.62, ambiguity: 0.42, collectiveAgreement: 0.65, culturalVariability: 0.38, resonanceType: "emotional", validations: 178, contradictions: 95 },
  { id: "sol-mel", source: "soledad", sourceType: "emotion", target: "melancolía", targetType: "emotion", strength: 0.82, ambiguity: 0.18, collectiveAgreement: 0.85, culturalVariability: 0.22, resonanceType: "emotional", validations: 298, contradictions: 52 },
  { id: "ver-cul", source: "vergüenza", sourceType: "emotion", target: "culpa", targetType: "emotion", strength: 0.78, ambiguity: 0.22, collectiveAgreement: 0.8, culturalVariability: 0.35, resonanceType: "emotional", validations: 212, contradictions: 52 },

  // Emotion ↔ Color
  { id: "mel-azul", source: "melancolía", sourceType: "emotion", target: "azul", targetType: "color", strength: 0.88, ambiguity: 0.12, collectiveAgreement: 0.91, culturalVariability: 0.25, resonanceType: "sensory", validations: 445, contradictions: 42 },
  { id: "ale-ama", source: "alegría", sourceType: "emotion", target: "amarillo", targetType: "color", strength: 0.82, ambiguity: 0.18, collectiveAgreement: 0.86, culturalVariability: 0.28, resonanceType: "sensory", validations: 389, contradictions: 64 },
  { id: "ira-roj", source: "ira", sourceType: "emotion", target: "rojo", targetType: "color", strength: 0.88, ambiguity: 0.12, collectiveAgreement: 0.9, culturalVariability: 0.22, resonanceType: "sensory", validations: 512, contradictions: 52 },
  { id: "mie-neg", source: "miedo", sourceType: "emotion", target: "negro", targetType: "color", strength: 0.82, ambiguity: 0.18, collectiveAgreement: 0.85, culturalVariability: 0.32, resonanceType: "sensory", validations: 398, contradictions: 72 },
  { id: "esp-ver", source: "esperanza", sourceType: "emotion", target: "verde", targetType: "color", strength: 0.78, ambiguity: 0.22, collectiveAgreement: 0.82, culturalVariability: 0.28, resonanceType: "cultural", validations: 342, contradictions: 78 },
  { id: "amo-ros", source: "amor", sourceType: "emotion", target: "rojo", targetType: "color", strength: 0.85, ambiguity: 0.15, collectiveAgreement: 0.88, culturalVariability: 0.3, resonanceType: "cultural", validations: 478, contradictions: 62 },
  { id: "ser-bla", source: "serenidad", sourceType: "emotion", target: "azul", targetType: "color", strength: 0.8, ambiguity: 0.2, collectiveAgreement: 0.83, culturalVariability: 0.22, resonanceType: "sensory", validations: 356, contradictions: 72 },
  { id: "anx-ama", source: "ansiedad", sourceType: "emotion", target: "amarillo", targetType: "color", strength: 0.72, ambiguity: 0.35, collectiveAgreement: 0.74, culturalVariability: 0.45, resonanceType: "sensory", validations: 198, contradictions: 68 },
  { id: "ext-bla", source: "éxtasis", sourceType: "emotion", target: "blanco", targetType: "color", strength: 0.65, ambiguity: 0.42, collectiveAgreement: 0.68, culturalVariability: 0.52, resonanceType: "symbolic", validations: 145, contradictions: 88 },

  // Emotion ↔ Typography
  { id: "mel-gar", source: "melancolía", sourceType: "emotion", target: "garamond", targetType: "typography", strength: 0.82, ambiguity: 0.18, collectiveAgreement: 0.85, culturalVariability: 0.22, resonanceType: "formal", validations: 298, contradictions: 52 },
  { id: "ang-hel", source: "angustia", sourceType: "emotion", target: "helvetica", targetType: "typography", strength: 0.65, ambiguity: 0.38, collectiveAgreement: 0.68, culturalVariability: 0.45, resonanceType: "formal", validations: 178, contradictions: 82 },
  { id: "ext-pla", source: "éxtasis", sourceType: "emotion", target: "playfair", targetType: "typography", strength: 0.72, ambiguity: 0.32, collectiveAgreement: 0.74, culturalVariability: 0.38, resonanceType: "formal", validations: 198, contradictions: 72 },
  { id: "ira-bod", source: "ira", sourceType: "emotion", target: "bodoni", targetType: "typography", strength: 0.75, ambiguity: 0.28, collectiveAgreement: 0.78, culturalVariability: 0.32, resonanceType: "formal", validations: 212, contradictions: 62 },
  { id: "sol-cou", source: "soledad", sourceType: "emotion", target: "courier", targetType: "typography", strength: 0.68, ambiguity: 0.35, collectiveAgreement: 0.72, culturalVariability: 0.38, resonanceType: "narrative", validations: 165, contradictions: 72 },

  // Emotion ↔ Artwork
  { id: "mel-fried", source: "melancolía", sourceType: "emotion", target: "friedrich-wanderer", targetType: "artwork", strength: 0.92, ambiguity: 0.08, collectiveAgreement: 0.94, culturalVariability: 0.18, resonanceType: "emotional", validations: 512, contradictions: 32 },
  { id: "mie-goya", source: "miedo", sourceType: "emotion", target: "goya-saturn", targetType: "artwork", strength: 0.9, ambiguity: 0.1, collectiveAgreement: 0.92, culturalVariability: 0.22, resonanceType: "emotional", validations: 498, contradictions: 42 },
  { id: "ang-munch", source: "angustia", sourceType: "emotion", target: "munch-scream", targetType: "artwork", strength: 0.95, ambiguity: 0.05, collectiveAgreement: 0.96, culturalVariability: 0.12, resonanceType: "emotional", validations: 624, contradictions: 26 },
  { id: "amo-klim", source: "amor", sourceType: "emotion", target: "klimt-kiss", targetType: "artwork", strength: 0.88, ambiguity: 0.12, collectiveAgreement: 0.9, culturalVariability: 0.28, resonanceType: "emotional", validations: 478, contradictions: 52 },
  { id: "sub-frie", source: "sublimidad", sourceType: "emotion", target: "friedrich-wanderer", targetType: "artwork", strength: 0.85, ambiguity: 0.15, collectiveAgreement: 0.88, culturalVariability: 0.22, resonanceType: "emotional", validations: 412, contradictions: 56 },

  // Emotion ↔ Music
  { id: "mel-bach", source: "melancolía", sourceType: "emotion", target: "bach-cello", targetType: "music", strength: 0.85, ambiguity: 0.15, collectiveAgreement: 0.88, culturalVariability: 0.25, resonanceType: "sensory", validations: 398, contradictions: 55 },
  { id: "mel-cho", source: "melancolía", sourceType: "emotion", target: "chopin-nocturne", targetType: "music", strength: 0.88, ambiguity: 0.12, collectiveAgreement: 0.91, culturalVariability: 0.2, resonanceType: "sensory", validations: 445, contradictions: 42 },
  { id: "ser-sat", source: "serenidad", sourceType: "emotion", target: "satie-gymnopédie", targetType: "music", strength: 0.9, ambiguity: 0.1, collectiveAgreement: 0.92, culturalVariability: 0.18, resonanceType: "sensory", validations: 498, contradictions: 42 },
  { id: "ext-colt", source: "éxtasis", sourceType: "emotion", target: "coltrane-love-supreme", targetType: "music", strength: 0.82, ambiguity: 0.22, collectiveAgreement: 0.84, culturalVariability: 0.38, resonanceType: "emotional", validations: 312, contradictions: 58 },
];

export function getRelationshipsForNode(nodeId: string): ResonanceRelationship[] {
  return RESONANCE_RELATIONSHIPS.filter(
    (r) => r.source === nodeId || r.target === nodeId
  );
}

export function getRelationshipStrength(sourceId: string, targetId: string): number {
  const rel = RESONANCE_RELATIONSHIPS.find(
    (r) => (r.source === sourceId && r.target === targetId) ||
            (r.source === targetId && r.target === sourceId)
  );
  return rel?.strength ?? 0;
}
