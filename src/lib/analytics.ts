import type { AnalyticsEvent, AnalyticsEventPayload } from "@/types";

// ─── Safe Storage Helpers ─────────────────────────────────────────────────────

function safeGet(storage: "local" | "session", key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    const store = storage === "local" ? window.localStorage : window.sessionStorage;
    if (!store || typeof store.getItem !== "function") return null;
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: "local" | "session", key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    const store = storage === "local" ? window.localStorage : window.sessionStorage;
    if (!store || typeof store.setItem !== "function") return;
    store.setItem(key, value);
  } catch {}
}

// ─── Session Management ──────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = safeGet("session", "album_session");
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    safeSet("session", "album_session", id);
  }
  return id;
}

// ─── Local Event Store ────────────────────────────────────────────────────────

const MAX_LOCAL_EVENTS = 500;
const STORAGE_KEY = "album_events";

function loadEvents(): AnalyticsEventPayload[] {
  try {
    return JSON.parse(safeGet("local", STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEventPayload[]) {
  safeSet("local", STORAGE_KEY, JSON.stringify(events.slice(-MAX_LOCAL_EVENTS)));
}

// ─── Core Tracker ────────────────────────────────────────────────────────────

export function trackEvent(
  event: AnalyticsEvent,
  properties: Record<string, string | number | boolean | null> = {}
) {
  const payload: AnalyticsEventPayload = {
    event,
    properties,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };

  const events = loadEvents();
  events.push(payload);
  saveEvents(events);

  // Dev console
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Álbum Analytics] ${event}`, properties);
  }

  // PostHog integration point (future)
  // if (typeof window !== "undefined" && (window as any).posthog) {
  //   (window as any).posthog.capture(event, properties);
  // }
}

// ─── Derived Metrics ─────────────────────────────────────────────────────────

export interface SessionMetrics {
  totalEvents: number;
  explorationDepth: number;
  nodesVisited: string[];
  resonancesValidated: number;
  resonancesContradicted: number;
  atmospheresGenerated: number;
  atmospheresSaved: number;
  participationCompleted: number;
  collectionsCreated: number;
  pathsFollowed: number;
  unexpectedConnections: number;
  resonanceConfidence: number;
  semanticAmbiguity: number;
  emotionalGravity: number;
}

export function computeSessionMetrics(): SessionMetrics {
  const events = loadEvents();
  const session = getSessionId();
  const sessionEvents = events.filter((e) => e.sessionId === session);

  const nodesVisited = sessionEvents
    .filter((e) => e.event === "node_clicked")
    .map((e) => String(e.properties.nodeId ?? ""))
    .filter(Boolean);

  const resonancesValidated = sessionEvents.filter((e) => e.event === "resonance_validated").length;
  const resonancesContradicted = sessionEvents.filter((e) => e.event === "resonance_contradicted").length;
  const total = resonancesValidated + resonancesContradicted;
  const resonanceConfidence = total > 0 ? resonancesValidated / total : 0;
  const semanticAmbiguity = total > 0 ? (2 * resonancesValidated * resonancesContradicted) / (total * total) : 0;

  return {
    totalEvents: sessionEvents.length,
    explorationDepth: new Set(nodesVisited).size,
    nodesVisited,
    resonancesValidated,
    resonancesContradicted,
    atmospheresGenerated: sessionEvents.filter((e) => e.event === "atmosphere_generated").length,
    atmospheresSaved: sessionEvents.filter((e) => e.event === "atmosphere_saved").length,
    participationCompleted: sessionEvents.filter((e) => e.event === "participation_completed").length,
    collectionsCreated: sessionEvents.filter((e) => e.event === "collection_created").length,
    pathsFollowed: sessionEvents.filter((e) => e.event === "emotional_path_followed").length,
    unexpectedConnections: sessionEvents.filter((e) => e.event === "unexpected_connection_discovered").length,
    resonanceConfidence,
    semanticAmbiguity,
    emotionalGravity: sessionEvents.length > 0 ? Math.min(sessionEvents.length / 20, 1) : 0,
  };
}

// ─── Global Participation Store (localStorage simulation) ────────────────────

const PARTICIPATION_KEY = "album_participation";

export interface ParticipationData {
  [promptId: string]: {
    votes: Record<string, number>;
    total: number;
  };
}

export function loadParticipation(): ParticipationData {
  try {
    return JSON.parse(safeGet("local", PARTICIPATION_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordVote(promptId: string, optionId: string) {
  const data = loadParticipation();
  if (!data[promptId]) {
    data[promptId] = { votes: {}, total: 0 };
  }
  data[promptId].votes[optionId] = (data[promptId].votes[optionId] ?? 0) + 1;
  data[promptId].total += 1;
  safeSet("local", PARTICIPATION_KEY, JSON.stringify(data));
  trackEvent("participation_completed", { promptId, optionId });
}

export function getVoteResults(promptId: string) {
  const data = loadParticipation();
  const prompt = data[promptId];
  if (!prompt) return { votes: {}, total: 0, dominantOption: null, confidence: 0 };

  const entries = Object.entries(prompt.votes);
  const dominant = entries.sort(([, a], [, b]) => b - a)[0];
  const confidence = dominant ? dominant[1] / prompt.total : 0;

  return {
    votes: prompt.votes,
    total: prompt.total,
    dominantOption: dominant?.[0] ?? null,
    confidence,
  };
}

// ─── Return Visit Detection ───────────────────────────────────────────────────

export function detectReturnVisit() {
  if (typeof window === "undefined") return;
  const key = "album_last_visit";
  const last = safeGet("local", key);
  const now = Date.now();
  if (last && now - parseInt(last) > 60_000) {
    trackEvent("return_visit", { minutesSinceLast: Math.round((now - parseInt(last)) / 60000) });
  }
  safeSet("local", key, String(now));
}
