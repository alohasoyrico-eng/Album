"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dusk" | "dawn" | "system";
export type ResolvedTheme = "dusk" | "dawn";

interface ThemeContextValue {
  mode: ThemeMode;          // user preference (may be "system")
  resolved: ResolvedTheme;  // actual applied theme
  setMode: (m: ThemeMode) => void;
  toggle: () => void;       // cycles dusk ↔ dawn (skips system)
}

const STORAGE_KEY = "album-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dusk";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "dawn" : "dusk";
}

function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to "system" before hydration; resolved is computed on the client.
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dusk");

  // Hydrate the user's stored preference once.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dusk" || stored === "dawn" || stored === "system") {
        setModeState(stored);
      }
    } catch { /* noop */ }
  }, []);

  // Resolve and apply whenever mode changes (or system theme changes for "system").
  useEffect(() => {
    const apply = () => {
      const next: ResolvedTheme = mode === "system" ? getSystemTheme() : mode;
      setResolved(next);
      applyTheme(next);
    };
    apply();

    if (mode === "system" && typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const onChange = () => apply();
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch { /* noop */ }
  };

  const toggle = () => {
    // From any state, flip to the opposite of the currently-resolved theme.
    setMode(resolved === "dusk" ? "dawn" : "dusk");
  };

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (shouldn't happen
    // but keeps the type non-null).
    return { mode: "system", resolved: "dusk", setMode: () => {}, toggle: () => {} };
  }
  return ctx;
}
