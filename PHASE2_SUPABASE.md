# Fase 2: Migración de Seed Data a Supabase

## Visión General

**Objetivo:** Sincronizar los archivos seed TypeScript (emotions, clans, tribes, colors, typography) a tablas Supabase, convirtiéndolas en una "read replica" centralizada del data.

**Build time:** Sigue usando archivos `.ts` locales → 467 páginas HTML estático (sin dependencias de Supabase).

**Data governance:** Script separado sincroniza archivos → Supabase para futuras fases.

## Arquitectura

```
┌─────────────────────────────────────┐
│  Archivos seed (.ts)                │ ← source of truth (local)
│  emotions.ts, clans.ts, etc.        │
└──────────┬──────────────────────────┘
           │
           │ npm run sync:supabase
           ↓
┌─────────────────────────────────────┐
│  Supabase (read replica)            │ ← synced via script
│  emotions, clans, tribes, etc.      │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  Futura Fase 3:                     │
│  - Búsqueda fulltext                │
│  - Editorial en vivo                │
│  - Participación (ya existe)        │
└─────────────────────────────────────┘
```

## Setup

### 1. Ejecutar migration en Supabase

```bash
# Conectar a Supabase CLI
supabase link

# Ejecutar la migration (crear tablas)
supabase db push
```

Esto crea:
- `tribes`
- `clans`
- `emotions`
- `colors`
- `typography`

### 2. Sincronizar data inicial

```bash
npm run sync:supabase
```

Esto:
1. Lee los archivos `.ts` locales
2. Conecta a Supabase (usa env vars)
3. Hace upsert de todos los datos
4. Reporte de cuántos registros se sincronizaron

**Variables de entorno requeridas:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (fallback)
- `SUPABASE_SERVICE_KEY` (recomendado para CI, tiene permisos de write)

### 3. Verificar en Cloudflare Pages deployment

```bash
# Localmente en dev
npm run dev

# Build estático (sin cambios)
npm run build
```

El data en Supabase no afecta el build (aún usa `.ts` files).

## Flujo de CI/CD

Después de un push:

```yaml
# .github/workflows/sync-supabase.yml (crear si no existe)
- name: Sync seed data to Supabase
  run: npm run sync:supabase
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## Próximas fases

### Fase 3A: Búsqueda fulltext en Supabase

Una vez el data esté en Supabase, podemos:
1. Agregar `tsvector` y fulltext search a las tablas
2. Reemplazar `searchIndex.ts` por una query a Supabase
3. Lazy-load en el cliente cuando el usuario abre `SearchPalette`

### Fase 3B: Editorial en vivo

Con Supabase como fuente, podemos:
1. Crear un panel editorial que edite directamente Supabase
2. Webhooks de Supabase que disparen rebuilds en Cloudflare
3. Solo las páginas afectadas se regeneran (incremental static regeneration)

### Fase 1 (después): Edge runtime en Cloudflare

Una vez Fases 2-3 estén maduras:
1. Cambiar a `@cloudflare/next-on-pages`
2. Server Components en edge que consulten Supabase on-demand
3. Sin dependencia de archivos `.ts` locales

## Seguridad

- El script usa `SUPABASE_SERVICE_KEY` en CI (permiso total)
- En desarrollo local, usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (fallback, permisos RLS)
- Supabase RLS está configurado: `SELECT` para anon, `INSERT/UPDATE/DELETE` bloqueado
- Write access solo vía script CI o manualmente con service key

## Troubleshooting

**"upsert failed"**
→ Verifica que las tablas existan: `supabase db push`

**"SUPABASE_URL env var required"**
→ Agrega las env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

**"Anon key has insufficient permissions"**
→ Usa `SUPABASE_SERVICE_KEY` en lugar de anon key para CI/scripts

## Referencias

- Migration: `supabase/migrations/0002_seed_catalog.sql`
- Script: `scripts/sync-supabase.ts`
- Package script: `npm run sync:supabase`
