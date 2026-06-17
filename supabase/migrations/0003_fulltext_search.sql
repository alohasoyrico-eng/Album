-- ════════════════════════════════════════════════════════════════════
-- Fulltext search — Phase 3A
-- ════════════════════════════════════════════════════════════════════
--
-- Add tsvector columns and indexes for fast fulltext search across
-- emotions, clans, tribes, colors, and typography.
--
-- Search function returns normalized results with rank for sorting.

-- ─── Emotions fulltext ─────────────────────────────────────────────
alter table public.emotions
  add column if not exists search_vector tsvector;

update public.emotions
  set search_vector = to_tsvector('spanish',
    coalesce(name, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(poetic_intro, '')
  )
  where search_vector is null;

create index if not exists emotions_search_idx
  on public.emotions using gin(search_vector);

-- ─── Clans fulltext ───────────────────────────────────────────────
alter table public.clans
  add column if not exists search_vector tsvector;

update public.clans
  set search_vector = to_tsvector('spanish',
    coalesce(name, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(feelings, ' '), '')
  )
  where search_vector is null;

create index if not exists clans_search_idx
  on public.clans using gin(search_vector);

-- ─── Tribes fulltext ──────────────────────────────────────────────
alter table public.tribes
  add column if not exists search_vector tsvector;

update public.tribes
  set search_vector = to_tsvector('spanish',
    coalesce(name, '') || ' ' ||
    coalesce(description, '')
  )
  where search_vector is null;

create index if not exists tribes_search_idx
  on public.tribes using gin(search_vector);

-- ─── Colors fulltext ──────────────────────────────────────────────
alter table public.colors
  add column if not exists search_vector tsvector;

update public.colors
  set search_vector = to_tsvector('spanish',
    coalesce(name_es, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(description, '')
  )
  where search_vector is null;

create index if not exists colors_search_idx
  on public.colors using gin(search_vector);

-- ─── Typography fulltext ─────────────────────────────────────────
alter table public.typography
  add column if not exists search_vector tsvector;

update public.typography
  set search_vector = to_tsvector('spanish',
    coalesce(name, '') || ' ' ||
    coalesce(family, '') || ' ' ||
    coalesce(description, '')
  )
  where search_vector is null;

create index if not exists typography_search_idx
  on public.typography using gin(search_vector);

-- ─── Unified search function ──────────────────────────────────────
-- Returns a union of all searchable entities with normalized structure
create or replace function public.search_all(query text, limit_count int default 20)
returns table (
  id text,
  kind text,
  title text,
  subtitle text,
  href text,
  accent text,
  rank float
) language sql stable as $$
with search_query as (
  select plainto_tsquery('spanish', query) as q
),
results as (
  -- Emotions
  select
    e.id,
    'emotion'::text as kind,
    e.name as title,
    e.poetic_intro as subtitle,
    '/emotion/' || e.id as href,
    (select color from public.tribes where id = e.tribe) as accent,
    ts_rank(e.search_vector, (select q from search_query)) as rank_val
  from public.emotions e, search_query
  where e.search_vector @@ (select q from search_query)

  union all

  -- Clans
  select
    c.id,
    'clan'::text,
    c.name,
    c.description,
    '/clan/' || c.id,
    (select color from public.tribes where id = c.tribe),
    ts_rank(c.search_vector, (select q from search_query))
  from public.clans c, search_query
  where c.search_vector @@ (select q from search_query)

  union all

  -- Tribes
  select
    t.id,
    'tribe'::text,
    t.name,
    t.description,
    '/tribe/' || t.id,
    t.color,
    ts_rank(t.search_vector, (select q from search_query))
  from public.tribes t, search_query
  where t.search_vector @@ (select q from search_query)

  union all

  -- Colors
  select
    c.id,
    'color'::text,
    c.name_es,
    c.description,
    '/color/' || c.id,
    c.hex,
    ts_rank(c.search_vector, (select q from search_query))
  from public.colors c, search_query
  where c.search_vector @@ (select q from search_query)

  union all

  -- Typography
  select
    t.id,
    'typography'::text,
    t.name,
    t.description,
    '/typography/' || t.id,
    '#999999'::text,
    ts_rank(t.search_vector, (select q from search_query))
  from public.typography t, search_query
  where t.search_vector @@ (select q from search_query)
)
select id, kind, title, subtitle, href, accent, rank_val as rank
from results
order by rank_val desc
limit limit_count;
$$ ;

-- RLS: everyone can search
grant execute on function public.search_all(text, int) to anon;
