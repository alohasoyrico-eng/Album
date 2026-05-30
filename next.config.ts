import type { NextConfig } from "next";

/**
 * Next configuration tuned for a fully static export deployed on
 * Cloudflare Pages.
 *
 * Why Cloudflare Pages
 * ────────────────────
 * Vercel's Hobby plan is single-region (sfo1). Latin-American visitors
 * pay 400-700 ms TTFB on every navigation because the request has to
 * cross to San Francisco and back. Cloudflare Pages serves from a
 * 320+ PoP global edge that includes São Paulo, Mexico City, Bogotá,
 * Santiago, Buenos Aires, and Lima — sub-50 ms TTFB anywhere in LATAM.
 *
 * What changed
 * ────────────
 *   1. `output: "export"` — produces a fully static `out/` directory.
 *      Every emotion / clan / tribe / color page is pre-rendered as
 *      plain HTML at build time.
 *   2. `images.unoptimized: true` — without a Vercel runtime, there's
 *      no `/_next/image` proxy. Images are served as-is from their
 *      source URLs. The CulturalImage fallback handles 4xx hosts;
 *      Wikipedia / Met / TMDB Met-style URLs work in the browser
 *      directly. (A Cloudflare Worker proxy is an optional future
 *      step if we want to bring back Vercel-style optimisation.)
 *   3. The previous `headers()` function is gone — static export
 *      doesn't run a Next runtime. Cache-Control is set per-path via
 *      `public/_headers`, which Cloudflare Pages reads on every
 *      response.
 *
 * API routes under `src/app/api/*` were never called from the UI
 * (verified by grep). They remain in the tree as dev-time helpers
 * but are excluded from the export by being unreachable from any
 * static route. If you later need server endpoints, the natural
 * next step is a Cloudflare Worker or `@cloudflare/next-on-pages`.
 */

const nextConfig: NextConfig = {
  output: "export",
  // Static export needs Next to skip the optimisation pipeline.
  // The remotePatterns list is irrelevant without a runtime; the
  // browser fetches images directly.
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // framer-motion is gone (replaced with CSS); only d3 still
    // benefits from per-symbol tree-shaking hints.
    optimizePackageImports: ["d3"],
  },
  // Cloudflare Pages serves trailingSlash:true cleaner (each route
  // becomes its own `index.html`), avoiding 404s on direct link.
  trailingSlash: true,
};

export default nextConfig;
