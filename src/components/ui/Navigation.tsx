"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { ThemeToggle } from "./ThemeToggle";
import { LensSwitcher } from "./LensSwitcher";
// SearchPalette pulls in the unified search index — every emotion, color,
// typography, artwork, etc. (~1.3 k entries). That index is useless until
// the user actually opens the palette, so we lazy-load it. The trigger
// stays in the nav; the heavy chunk arrives on Cmd+K / button-click. This
// alone removes ~250-300 KB from every page's First Load JS, since the
// Navigation is rendered in the root layout and otherwise leaked into
// every route's shared chunks.
const SearchPalette = dynamic(
  () => import("./SearchPalette").then((m) => m.SearchPalette),
  { ssr: false },
);
const NAV_ITEMS = [
  { href: "/", label: "Mapa", description: "Constelación semántica" },
  { href: "/colors", label: "Color", description: "Atlas cromático Heller" },
  { href: "/atmosphere", label: "Atmósfera", description: "Constructor de atmósferas" },
  { href: "/collection", label: "Colección", description: "Archivo personal" },
];
export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Cmd/Ctrl+K opens the search palette from anywhere in the app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-normal">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-7 h-7 rounded-full border border-amber/40 flex items-center justify-center group-hover:border-amber/70 transition-colors duration-500">
                <div className="w-1.5 h-1.5 rounded-full bg-amber/60 group-hover:bg-amber transition-colors duration-300" />
              </div>
              <div className="absolute inset-0 rounded-full bg-amber/5 group-hover:bg-amber/10 blur-md transition-all duration-500" />
            </div>
            <span
              className="text-display text-xl text-ink/80 group-hover:text-ink transition-colors duration-300"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300, letterSpacing: "-0.03em" }}
>
              Álbum
            </span>
          </Link>
          {/* Search trigger — Cmd+K shortcut, click to open.
              Hidden on the home page: the hero already shows a larger,
              more prominent search field so two triggers within 200px of
              each other would just be redundant noise. */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar en Álbum"
            className={`${pathname === "/" ? "hidden" : "hidden md:flex"} items-center gap-2 ml-4 px-3 py-1.5 rounded-full border border-white/8 hover:border-white/16 hover:bg-white/[0.03] transition-all`}
            style={{ minWidth: "220px" }}
>
            <span className="icon icon-md text-ink-faint">search</span>
            <span
              className="flex-1 text-left text-ink-faint"
              style={{ fontFamily: "var(--font-editorial)", fontSize: "0.78rem" }}
>
              Buscar emociones, obras…
            </span>
            <span
              className="text-[0.55rem] text-ink-faint px-1.5 py-0.5 rounded border border-white/10"
              style={{ fontFamily: "var(--font-technical)", letterSpacing: "0.12em" }}
>
              ⌘K
            </span>
          </button>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm transition-all duration-300",
                  "font-light tracking-wide",
                  pathname === item.href
                    ? "text-amber bg-amber/8 border border-amber/20"
                    : "text-ink-muted hover:text-ink border border-transparent hover:border-white/8"
                )}
                style={{ fontFamily: "var(--font-technical)", fontSize: "0.8rem" }}
>
                {item.label}
              </Link>
            ))}
            <div className="ml-2 pl-2 border-l border-[color:var(--album-border)] flex items-center gap-2">
              <LensSwitcher />
              <ThemeToggle />
            </div>
          </div>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 group"
            aria-label="Menu"
>
            <span className={clsx("w-5 h-px bg-ink-muted transition-all duration-300 group-hover:bg-ink", isOpen && "rotate-45 translate-y-1")} />
            <span className={clsx("w-5 h-px bg-ink-muted transition-all duration-300 group-hover:bg-ink", isOpen && "opacity-0")} />
            <span className={clsx("w-5 h-px bg-ink-muted transition-all duration-300 group-hover:bg-ink", isOpen && "-rotate-45 -translate-y-1")} />
          </button>
        </div>
        {/* Subtle separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </nav>
      {/* Mobile menu */}
      <>
        {isOpen && (
          <div
            className="fixed top-16 left-0 right-0 z-40 glass-strong border-b border-white/6 md:hidden"
>
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                    pathname === item.href
                      ? "text-amber bg-amber/8"
                      : "text-ink-muted hover:text-ink hover:bg-white/4"
                  )}
>
                  <span style={{ fontFamily: "var(--font-technical)", fontSize: "0.875rem" }}>{item.label}</span>
                  <span className="text-xs text-ink-faint">{item.description}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </>
      {/* Global search palette — Cmd/Ctrl+K or click the search trigger.
          Mount only after the user actually wants to search: keeps the
          ~250-300 KB search-index chunk out of every page's First Load. */}
      {searchOpen && (
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
