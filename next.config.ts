import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint at build time — we keep it for local dev (npm run lint).
  // Type-checking still runs and is enforced; only lint warnings are
  // bypassed so the prototype can ship without a stop-the-world cleanup.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.metmuseum.org" },
      { protocol: "https", hostname: "**.artic.edu" },
      { protocol: "https", hostname: "**.rijksmuseum.nl" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "**.last.fm" },
      { protocol: "https", hostname: "**.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "d3"],
  },

  /**
   * Aggressive caching for the static editorial routes.
   *
   * Background — measured TTFB on the public site is ~220 ms because:
   *   1. Vercel sets `cache-control: public, max-age=0, must-revalidate`
   *      by default, so the browser revalidates every page load.
   *   2. The deployment is single-region (Hobby plan, sfo1), so anyone
   *      outside North America pays full transcontinental latency on
   *      every navigation.
   *
   * This policy applies to every /emotion/*, /clan/*, /tribe/*,
   * /color/* page (all SSG / static HTML):
   *   - `max-age=300`   — browser caches the HTML for 5 minutes, so
   *                       back-button + same-emotion revisits cost 0 ms.
   *   - `s-maxage=86400` — Vercel's edge cache holds it for a day.
   *   - `stale-while-revalidate=604800` — for up to 7 days after expiry
   *     the edge can serve the stale HTML *instantly* while it
   *     refreshes in the background. Visitors never wait for a rebuild.
   *
   * Safety: HTML is fully static at build time. Live participation data
   * is hydrated client-side via Supabase realtime, so cached HTML never
   * goes stale in a way the user perceives.
   */
  async headers() {
    const cacheStaticEditorial = {
      key: "Cache-Control",
      value: "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
    };
    return [
      { source: "/emotion/:slug", headers: [cacheStaticEditorial] },
      { source: "/clan/:id", headers: [cacheStaticEditorial] },
      { source: "/tribe/:slug", headers: [cacheStaticEditorial] },
      { source: "/color/:id", headers: [cacheStaticEditorial] },
    ];
  },
};

export default nextConfig;
