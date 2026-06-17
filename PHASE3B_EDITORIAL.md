# Fase 3B: Editorial en Vivo

## Visión General

Habilitar que editores cambien el contenido directamente en Supabase sin tocar código.

**Arquitectura actual (Fase 3A):**
```
Supabase (data source)
    ↓ npm run sync:supabase
    ↓ (copia datos)
    ↓
Archivos .ts locales (build time)
    ↓ npm run build
    ↓ (genera 467 páginas HTML estáticas)
    ↓
Cloudflare Pages (static export)
```

**Problema:** Los cambios en Supabase no se ven hasta que se haga un rebuild manual.

---

## Solución: Panel Editorial Supabase

**Sin dependencias extras.** Los datos ya están en Supabase con RLS permisivo.

### 1. Habilitar Row Level Security correcto

Actualmente, `typography`, `colors`, `emotions`, etc. permiten SELECT a anon (read-only).

Para un panel editorial, necesitas usuarios autenticados que puedan UPDATE. Dos opciones:

**Opción A (Simple):** Usar el Service Role en una UI privada
- Crear un `/admin/editor` ruta privada (requiere token)
- La UI conecta a Supabase con `SUPABASE_SERVICE_KEY`
- Solo tú accedes (protegido por contraseña o contraseña de app)

**Opción B (Escalable):** Usar Auth de Supabase
- Los editores se crean en Supabase Auth
- RLS: `CREATE POLICY "editors can update" ON emotions FOR UPDATE USING (auth.role() = 'authenticated')`
- Acceso granular por usuario

### 2. Panel Editorial Mínimo

```bash
# Opción A: usar Supabase UI integrado
# - Ve a https://app.supabase.com
# - Selecciona tu proyecto
# - SQL Editor o Table Editor
# - Edita las filas directamente
```

**Es eso.** No hay que construir nada.

**Ejemplo:**
1. Abre https://app.supabase.com → tu proyecto → Table Editor
2. Selecciona la tabla `emotions`
3. Haz clic en una fila → edita `description`
4. Click "Save"

El cambio está ahora en Supabase. **Pero no se ve en el sitio publicado hasta que hagas rebuild.**

### 3. Trigger Rebuilds: Opción Manual

```bash
# Cuando quieras publicar cambios:
npm run sync:supabase  # sincroniza Supabase → archivos .ts (si decides)
npm run build          # regenera 467 páginas
npm run build && npx supabase db push  # o push a Cloudflare Pages manualmente
```

**Tiempo:** ~3 min para rebuild completo.

### 4. Trigger Rebuilds: Opción Webhook (Futuro)

Para verdadera editorial en vivo (cambios visibles al instante):

```yaml
# .github/workflows/rebuild-on-data-change.yml (crear si no existe)
name: Rebuild on Supabase Change
on:
  repository_dispatch:
    types: [supabase_change]

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run sync:supabase
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
      - run: npm run build
      - run: npx wrangler pages deploy out
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Luego desde Supabase → Database Webhooks:
```
Event: INSERT, UPDATE, DELETE
Tables: emotions, clans, tribes, colors, typography
Webhook URL: https://api.github.com/repos/YOUR_REPO/dispatches
Auth: Bearer <GitHub token>
Payload: { "event_type": "supabase_change" }
```

**Tiempo:** ~5 min rebuild + deploy en paralelo con cambios = ~10 min desde edit → live.

---

## Status Quo

**Hoy:** Los datos están en Supabase. Editores pueden cambiarlos en el dashboard. Los cambios van live con rebuild manual.

**Mañana (Fase 1):** Con edge runtime, los cambios serían instantáneos sin rebuild.

---

## Próximas acciones

### Opción A: Continuar con static export + manual rebuilds
- ✅ Edita en Supabase
- ✅ Ejecuta `npm run build` cuando quieras publicar
- ✅ Simple, predecible, sin infraestructura extra

### Opción B: Configurar webhooks + CI/CD
- ✅ Auto-rebuild en cambios
- ⚠️ Costo: GitHub Actions (gratis hasta cierto punto)
- ⚠️ Lag: ~5-10 min hasta live

### Opción C: Migrar a Fase 1 (edge runtime)
- ✅ Cambios en vivo sin rebuild
- ⚠️ Complejo: requiere `@cloudflare/next-on-pages` + Server Components
- ⚠️ Más caro: Cloudflare edge runtime (pero sub-$1/mes para este volumen)

---

## Recomendación

Hoy: **Opción A** (manual rebuilds). Es lo que ya funciona.

Cuando haya editorial constante: **Opción B** (webhooks) o **Opción C** (edge runtime).

¿Cuál quieres hacer ahora?
