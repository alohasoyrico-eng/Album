"use client";

/**
 * LensSwitcher — global lens picker.
 *
 * Sits in the nav. Pinning a lens here re-reads every Claim-aware
 * component across the entire app: emotion descriptions, color
 * meanings, resonance vectors, consensus lists. The lens persists in
 * localStorage so the visitor's perspective survives reloads.
 *
 * This is the entry-point that makes plurality user-facing.
 */

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReadContext } from "@/lib/ReadContextProvider";
import type { LensKey } from "@/types/claims";

const LENSES: Array<{ key: LensKey | null; label: string; tone: string }> = [
  { key: null,             label: "Marina (default)",          tone: "Lectura del catálogo curatorial" },
  { key: "eastern",        label: "Lectura clásica oriental",  tone: "Tradiciones de Asia oriental" },
  { key: "afrodiasporic",  label: "Lectura afrodiaspórica",    tone: "Tradiciones yoruba, lucumí, candomblé" },
  { key: "latin-american", label: "Boom latinoamericano",      tone: "García Márquez, Galeano, Bolaño" },
  { key: "indigenous",     label: "Lectura originaria",        tone: "Cosmovisiones de los pueblos originarios" },
  { key: "queer",          label: "Afecto queer",              tone: "Muñoz, Berlant, Ahmed" },
  { key: "feminist",       label: "Lectura feminista",         tone: "Federici, Lorde, Sara Ahmed" },
  { key: "personal",       label: "Voz personal",              tone: "Lo que has marcado tú mismo" },
];

export function LensSwitcher() {
  const ctx = useReadContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LENSES.find((l) => l.key === (ctx.lens ?? null)) ?? LENSES[0];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Cambiar lente de lectura"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all"
      >
        <span className="icon icon-sm text-ink-faint">visibility</span>
        <span
          className="text-ink-muted text-[0.7rem]"
          style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.06em" }}
        >
          {current.label}
        </span>
        <span className="icon icon-sm text-ink-faint">expand_more</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-72 rounded-2xl glass-strong z-50"
            style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            <div className="px-4 py-3 border-b border-white/6">
              <p
                className="text-[0.55rem] text-ink-faint"
                style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.2em" }}
              >
                LECTURA ACTIVA
              </p>
              <p
                className="text-sm text-ink mt-1 italic"
                style={{ fontFamily: "var(--font-literary)" }}
              >
                Cambia desde qué tradición lees el atlas.
              </p>
            </div>
            <div className="py-1">
              {LENSES.map((l) => {
                const active = l.key === (ctx.lens ?? null);
                return (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => {
                      ctx.setLens(l.key);
                      setOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors flex items-start gap-3"
                    style={{
                      backgroundColor: active ? "rgba(255,255,255,0.03)" : "transparent",
                    }}
                  >
                    <span
                      className={`icon icon-sm mt-0.5 ${active ? "text-amber" : "text-ink-faint"}`}
                    >
                      {active ? "radio_button_checked" : "radio_button_unchecked"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm text-ink"
                        style={{ fontFamily: "var(--font-editorial)" }}
                      >
                        {l.label}
                      </p>
                      <p
                        className="text-[0.6rem] text-ink-faint italic mt-0.5"
                        style={{ fontFamily: "var(--font-literary)" }}
                      >
                        {l.tone}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
