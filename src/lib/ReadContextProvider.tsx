"use client";

/**
 * ReadContextProvider — the global "from which perspective are we
 * reading?" state of Álbum.
 *
 * One of the audit's hardest findings was that Álbum had no notion of
 * perspective: every entity had exactly one canonical reading. This
 * provider holds the active lens + user identity + sampling temperature
 * that every reader passes into the consensus algebra.
 *
 * What changes when the lens flips:
 *   - resolveEmotion(id, ctx).description  → eastern reading wins
 *   - typography / color assignment        → re-weighted by lens
 *   - emergent links                       → re-ranked
 *   - inferred / curator claims            → filtered or boosted
 *
 * Persistence: the active lens is stored in localStorage so the visitor's
 * pinned perspective survives navigation and reload.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LensKey, ReadContext } from "@/types/claims";

const STORAGE_KEY = "album:read-context";

interface ReadContextValue extends ReadContext {
  setLens: (lens: LensKey | null) => void;
  setTemperature: (t: number) => void;
  setUserId: (id: string | null) => void;
  /** Trace of recent entity ids the user has interacted with. */
  pushRecent: (entityId: string) => void;
}

const ReadContextCtx = createContext<ReadContextValue | null>(null);

interface PersistedState {
  lens: LensKey | null;
  temperature: number;
  userId: string | null;
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") {
    return { lens: null, temperature: 0, userId: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lens: null, temperature: 0, userId: null };
    const parsed = JSON.parse(raw);
    return {
      lens: parsed.lens ?? null,
      temperature: typeof parsed.temperature === "number" ? parsed.temperature : 0,
      userId: parsed.userId ?? null,
    };
  } catch {
    return { lens: null, temperature: 0, userId: null };
  }
}

function persist(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage disabled / quota — silent */
  }
}

const RECENT_LIMIT = 12;

export function ReadContextProvider({ children }: { children: React.ReactNode }) {
  // Initial state is empty — hydration fills in from localStorage. This
  // avoids SSR / client divergence warnings.
  const [lens, setLensState] = useState<LensKey | null>(null);
  const [temperature, setTemperatureState] = useState<number>(0);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [recentPath, setRecentPath] = useState<string[]>([]);

  useEffect(() => {
    const p = loadPersisted();
    setLensState(p.lens);
    setTemperatureState(p.temperature);
    setUserIdState(p.userId);
  }, []);

  const setLens = useCallback((next: LensKey | null) => {
    setLensState(next);
    persist({ lens: next, temperature, userId });
  }, [temperature, userId]);

  const setTemperature = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(2, t));
    setTemperatureState(clamped);
    persist({ lens, temperature: clamped, userId });
  }, [lens, userId]);

  const setUserId = useCallback((id: string | null) => {
    setUserIdState(id);
    persist({ lens, temperature, userId: id });
  }, [lens, temperature]);

  const pushRecent = useCallback((entityId: string) => {
    setRecentPath((prev) => {
      const filtered = prev.filter((id) => id !== entityId);
      return [entityId, ...filtered].slice(0, RECENT_LIMIT);
    });
  }, []);

  const value = useMemo<ReadContextValue>(
    () => ({
      lens: lens ?? undefined,
      temperature,
      userId: userId ?? undefined,
      recentPath,
      includeInferred: true,
      setLens,
      setTemperature,
      setUserId,
      pushRecent,
    }),
    [lens, temperature, userId, recentPath, setLens, setTemperature, setUserId, pushRecent],
  );

  return <ReadContextCtx.Provider value={value}>{children}</ReadContextCtx.Provider>;
}

/**
 * Hook — every read site should grab the current ReadContext from here
 * rather than constructing one ad hoc. The plain `useReadContext()`
 * returns the full mutable interface; `useReadOnlyContext()` returns
 * only the bare `ReadContext` shape (useful for one-shot consensus
 * resolutions in render).
 */
export function useReadContext(): ReadContextValue {
  const ctx = useContext(ReadContextCtx);
  if (!ctx) {
    // Fallback for components that render outside the provider (e.g.
    // server components, isolated stories). Returns a zero-state.
    return {
      lens: undefined,
      temperature: 0,
      userId: undefined,
      recentPath: [],
      includeInferred: true,
      setLens: () => {},
      setTemperature: () => {},
      setUserId: () => {},
      pushRecent: () => {},
    };
  }
  return ctx;
}

export function useReadOnlyContext(): ReadContext {
  const c = useReadContext();
  return {
    lens: c.lens,
    temperature: c.temperature,
    userId: c.userId,
    recentPath: c.recentPath,
    includeInferred: c.includeInferred,
  };
}
