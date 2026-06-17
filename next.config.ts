import type { NextConfig } from "next";

/**
 * Next configuration for Cloudflare Pages + edge runtime.
 *
 * Why Cloudflare Pages
 * ────────────────────
 * Vercel's Hobby plan is single-region (sfo1). Latin-American visitors
 * pay 400-700 ms TTFB on every navigation because the request has to
 * cross to San Francisco and back. Cloudflare Pages serves from a
 * 320+ PoP global edge that includes São Paulo, Mexico City, Bogotá,
 * Santiago, Buenos Aires, and Lima — sub-50 ms TTFB anywhere in LATAM.
 *
 * What changed from static export
 * ───────────────────────────────
 *   1. NO `output: "export"` — runs dynamic Server Components in edge.
 *      Each route renders on-demand, no pre-generation.
 *   2. `runtime = "edge"` on dynamic routes — Server Components query
 *      Supabase for data on each request. Changes in Supabase = instant.
 *   3. Images stay `unoptimized` — Cloudflare Worker optimization
 *      is a future enhancement. Browser fetches directly.
 *   4. Cache-Control via Cloudflare config, not `headers()`.
 */

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["d3"],
  },
};

export default nextConfig;
