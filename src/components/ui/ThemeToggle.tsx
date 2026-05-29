"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";

/**
 * Single-button theme toggle. Click flips between Crepúsculo (dusk) and Alba
 * (dawn). The icon morphs softly between a crescent moon (dusk) and a sun (dawn).
 *
 * Long-press / right-click could later open a menu with the "system" option;
 * for now the simplest interaction is a single tap.
 */
export function ThemeToggle() {
  const { resolved, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={resolved === "dusk" ? "Cambiar a Alba (modo claro)" : "Cambiar a Crepúsculo (modo oscuro)"}
      title={resolved === "dusk" ? "Alba · cambiar al modo claro" : "Crepúsculo · cambiar al modo oscuro"}
      className="group relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[color:var(--album-border)]"
      style={{ color: "var(--album-ink-muted)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {resolved === "dusk" ? (
          // ─── Moon (Crepúsculo) ──────────────────────────────────────
          <motion.svg
            key="moon"
            initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:text-[color:var(--album-ink)] transition-colors duration-300"
            aria-hidden
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </motion.svg>
        ) : (
          // ─── Sun (Alba) ─────────────────────────────────────────────
          <motion.svg
            key="sun"
            initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:text-[color:var(--album-ink)] transition-colors duration-300"
            aria-hidden
          >
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}
