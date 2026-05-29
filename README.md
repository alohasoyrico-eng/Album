# Álbum

A living emotional-cultural observatory. An emotional-semantic atlas, a cultural archive, and a probabilistic resonance network — built on top of José Antonio Marina's ontology (22 tribes / 58 clans / 72 emotions), Eva Heller's colour-resonance research, and a cross-disciplinary cultural catalogue.

## Stack

- **Next.js 15.3 (App Router, Turbopack)** · React 19 · TypeScript
- **Tailwind CSS** for utilities · custom design tokens for the chromatic / typographic systems
- **D3** for the semantic map force simulation
- **Framer Motion** for the breathing / drift / reveal animations
- **next/font/google** for the base typeface stack · per-page Google Fonts CSS API for the 91-font emergent palette

## What's here

```
src/
├── app/                     Next.js App Router pages
├── components/
│   ├── editorial/           Emotion, Clan, Tribe, Color detail views
│   ├── map/                 SemanticMap (D3 + layered SVG)
│   └── ui/                  Nav, SearchPalette, LensSwitcher, ThemeToggle
├── data/
│   ├── ontology/            22 tribes · 58 clans · 72 emotions + claim adapters
│   ├── colors/              224 colour catalogue (13 canonical + 211 derived)
│   ├── typography/          91 typographic resonances
│   ├── motion/              43 motion patterns (pace / inertia / trajectory / decay)
│   └── seed/                ~1,300 cultural items across 11 disciplines
├── lib/
│   ├── chromatics.ts        Oklab colour recipes + catalogue-snap
│   ├── consensus.ts         Claim<T> algebra (resolve / mostWeighted / disagreement)
│   ├── emotionPalette.ts    Unique emotion ↔ catalogue colour assignment
│   ├── emotionFonts.ts      Unique emotion ↔ 4-role typeset
│   ├── emotionMotion.ts     Unique emotion ↔ motion pattern
│   ├── ReadContextProvider  Global lens + reading context
│   └── contrast.ts          WCAG ink picker for dynamic surfaces
└── types/
    ├── index.ts             Marina + cultural ontology types
    └── claims.ts            Claim<T> + ReadContext primitives
```

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture in one sentence

Every entity is a **collection of claims** rather than a canonical fact: the active lens picks which claims surface, the consensus engine decides the live reading, and the visual systems (colour, typography, motion, texture) propagate that reading across the entire interface.
