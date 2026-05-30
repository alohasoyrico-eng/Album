# Deploy a Cloudflare Pages

Por qué Cloudflare en vez de Vercel:

- **Vercel Hobby**: single-region (sfo1). Visitantes en LATAM pagan
  400-700 ms de TTFB en cada navegación.
- **Cloudflare Pages**: red de 320+ PoPs incluyendo **São Paulo, CDMX,
  Bogotá, Santiago, Buenos Aires, Lima**. TTFB esperado < 50 ms en
  cualquier capital latinoamericana. Gratis sin límite de tráfico.

## Setup (~10 min, una sola vez)

1. **Cuenta de Cloudflare** (gratis): https://dash.cloudflare.com/sign-up
2. **Conectar repo GitHub**:
   - Dashboard → Workers & Pages → Create → Pages → Connect to Git
   - Selecciona `alohasoyrico-eng/Album`
   - Production branch: `main`
3. **Build settings**:
   - Framework preset: `Next.js (Static HTML Export)`
   - Build command: `npm run build`
   - Build output directory: `out`
   - Root directory: `apps/album` (o donde viva el proyecto)
4. **Environment variables** (en Cloudflare Pages → Settings → Env):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://wlkusqgufycktpviyebi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_IEbKUuqeCB4qubPrYnGwRg_9jq0ugb5
   NODE_VERSION=20
   ```
5. **Deploy** — Cloudflare construye y publica en `<project>.pages.dev`

Cada push a `main` redespliega automáticamente.

## Custom domain

Cuando quieras `album.tudominio.com`:

1. Cloudflare Pages → Custom domains → Add
2. Cloudflare te da un CNAME → lo apuntas desde donde tengas el DNS
3. Cloudflare emite el cert TLS automáticamente

Si tu dominio ya está en Cloudflare DNS, el flujo es un click.

## Qué cambió en el código para soportar esto

- **`next.config.ts`**:
  - `output: "export"` — produce `out/` con HTML estático puro
  - `images.unoptimized: true` — sin Vercel runtime no hay `/_next/image`
  - `trailingSlash: true` — cada ruta su propio `index.html` (evita 404)
  - `headers()` movido a `public/_headers` (formato Cloudflare Pages)
- **`public/_headers`** — Cache-Control rules:
  - HTML: 5 min navegador + 1 día edge + 7 días stale-while-revalidate
  - Assets `_next/static/*`: immutable 1 año
- **API routes** (`src/app/api/*`) movidas a `_attic/` — no se usaban
  desde la UI, solo eran helpers de dev de los scripts de ingest

## Consideración sobre imágenes

Sin el proxy `/_next/image` perdemos:
- Vercel-side bypass del Referer block de ARTIC (~25 imágenes)
- Auto WebP/AVIF
- Responsive `srcSet`

Met / Wikipedia / TMDB sirven directamente al navegador. ARTIC vuelve
a dar 403 desde el browser. El fallback iconográfico cubre.

Si después quieres recuperar la optimización: Cloudflare ofrece
**Image Resizing** ($5/mes) o se puede escribir un **Worker** que
proxie los hosts hostiles. Ninguno es urgente.

## Plan de migración paso a paso

1. ✅ Commit + push de los cambios (esto)
2. ⬜ Crear cuenta Cloudflare + conectar repo (5 min)
3. ⬜ Primer deploy en `<algo>.pages.dev`
4. ⬜ Verificar TTFB desde tu ubicación con `curl -w "%{time_starttransfer}"`
5. ⬜ (opcional) Migrar el dominio personalizado
6. ⬜ (opcional) Apagar el deploy de Vercel

El proyecto sigue siendo compatible con Vercel si quieres mantener
ambos por un tiempo — solo regresa a `output: undefined` y vuelven las
API routes desde `_attic/`.
