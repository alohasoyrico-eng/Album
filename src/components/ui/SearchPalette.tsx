"use client";

/**
 * Search palette — Cmd/Ctrl+K opens, Esc closes, ↑/↓ navigate, Enter selects.
 *
 * Indexes every entity in Álbum (emotions, clans, tribes, colours, fonts
 * and the ~1100 cultural items). Lightweight substring + word-prefix
 * ranking; fast enough for keystroke matching without a fuzzy library.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { searchAll, recentSuggestions, type SearchRecord, type SearchKind } from "@/lib/searchIndex";
import { ICON } from "@/lib/icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<SearchRecord[]>(
    () => (query.trim().length === 0 ? recentSuggestions() : searchAll(query, 50)),
    [query],
  );

  // Reset cursor when results change
  useEffect(() => { setCursor(0); }, [results]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      // Defer focus until the animation has mounted the input
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const select = useCallback(
    (rec: SearchRecord) => {
      onClose();
      if (rec.href && rec.href !== "#") router.push(rec.href);
    },
    [router, onClose],
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(results.length - 1, c + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const rec = results[cursor];
        if (rec) select(rec);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, cursor, select, onClose]);

  // Scroll active row into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(5,5,8,0.6)", backdropFilter: "blur(8px)" }}
            aria-hidden
          />

          {/* Palette */}
          <motion.div
            initial={{ y: -8, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-xl rounded-2xl glass-strong"
            style={{ boxShadow: "0 30px 100px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
              <span className="icon icon-md text-ink-faint">search</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar emociones, clanes, colores, obras…"
                className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-faint"
                style={{ fontFamily: "var(--font-editorial)", fontSize: "1rem" }}
                aria-label="Buscar"
              />
              <span
                className="text-[0.6rem] text-ink-faint px-1.5 py-0.5 rounded border border-white/8"
                style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
              >
                ESC
              </span>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
              {results.length === 0 && (
                <p
                  className="px-5 py-6 text-sm text-ink-faint italic"
                  style={{ fontFamily: "var(--font-literary)" }}
                >
                  Nada por aquí. Prueba con una emoción, un color, un autor…
                </p>
              )}
              {results.map((rec, i) => {
                const active = i === cursor;
                return (
                  <button
                    key={`${rec.kind}-${rec.id}`}
                    type="button"
                    data-row={i}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => select(rec)}
                    className="w-full text-left px-5 py-2.5 flex items-center gap-3 transition-colors"
                    style={{
                      background: active ? "rgba(255,255,255,0.04)" : "transparent",
                    }}
                  >
                    <span
                      aria-hidden
                      className="icon icon-md w-8 h-8 flex items-center justify-center rounded-full shrink-0"
                      style={{
                        background: rec.accent ? `${rec.accent}24` : "rgba(255,255,255,0.04)",
                        color: rec.accent ?? "var(--album-ink-muted)",
                      }}
                    >
                      {ICON[rec.kind]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm text-ink truncate"
                        style={{ fontFamily: "var(--font-editorial)" }}
                      >
                        {rec.title}
                      </p>
                      <p
                        className="text-[0.65rem] text-ink-faint truncate"
                        style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.06em" }}
                      >
                        {rec.subtitle}
                      </p>
                    </div>
                    {active && (
                      <span
                        className="text-[0.6rem] text-ink-faint px-1.5 py-0.5 rounded border border-white/8 shrink-0"
                        style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.1em" }}
                      >
                        ↵
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer hints */}
            <div
              className="px-5 py-2.5 border-t border-white/6 flex items-center gap-4 text-[0.6rem] text-ink-faint"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.08em" }}
            >
              <span><kbd className="text-ink-muted">↑↓</kbd> NAVEGAR</span>
              <span><kbd className="text-ink-muted">↵</kbd> ABRIR</span>
              <span><kbd className="text-ink-muted">ESC</kbd> CERRAR</span>
              <span className="ml-auto text-ink-faint/70">{results.length} RESULTADOS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
