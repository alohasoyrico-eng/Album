import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navigation } from "@/components/ui/Navigation";
import { StoreHydration } from "@/components/ui/StoreHydration";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ReadContextProvider } from "@/lib/ReadContextProvider";
import {
  Inter,
  Cormorant_Garamond,
  EB_Garamond,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

// ─── Base fonts — always loaded, preloaded by next/font ────────────────────
// These cover the UI baseline (nav, body, captions). Per-page emergent
// fonts are loaded by app/<route>/[id]/page.tsx via <link rel="stylesheet">
// from Google Fonts CSS API. The catalogue can scale to thousands of
// fonts without affecting the user's load cost — only the 4 per page.
const baseBody = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});
const baseDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const baseLiterary = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-literary",
  display: "swap",
});
const baseEditorial = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});
const baseTechnical = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-technical",
  display: "swap",
});

/**
 * Anti-flash script: applies the saved or system theme to <html data-theme>
 * BEFORE React hydrates so the page paints in the correct palette from the
 * first frame. Without it, dawn users would see a brief dusk flash.
 */
const themeBootstrap = `(function(){try{var k='album-theme';var s=localStorage.getItem(k);var t=(s==='dawn'||s==='dusk')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'dawn':'dusk');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Álbum — A Living Emotional-Cultural Observatory",
  description: "An emotional-semantic atlas. A living cultural archive. A resonance engine. Explore how humans create meaning between emotions, color, typography, and culture.",
  keywords: ["emotional ontology", "cultural atlas", "semantic map", "resonance", "art", "music", "poetry"],
  openGraph: {
    title: "Álbum",
    description: "A living emotional-cultural observatory",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
    { media: "(prefers-color-scheme: light)", color: "#F2EBDC" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={[
        baseBody.variable,
        baseDisplay.variable,
        baseLiterary.variable,
        baseEditorial.variable,
        baseTechnical.variable,
      ].join(" ")}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Material Symbols Outlined — used app-wide for discipline icons.
            Variable font: one ~30KB request gives access to ~3000 icons
            via OpenType ligatures (e.g. <span>palette</span> renders the
            palette icon). Loaded with display=block so glyphs never flash
            as their ligature names. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
        />
      </head>
      <body className="bg-atmospheric min-h-screen antialiased">
        <ThemeProvider>
          <ReadContextProvider>
            <StoreHydration />
            <Navigation />
            <main className="relative">{children}</main>
          </ReadContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
