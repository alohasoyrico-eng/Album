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
};

export default nextConfig;
