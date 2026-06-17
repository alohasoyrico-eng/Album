-- ════════════════════════════════════════════════════════════════════
-- Álbum seed catalog schema — Phase 2
-- ════════════════════════════════════════════════════════════════════
--
-- Read replica of seed data files (emotions, clans, tribes, colors,
-- typography). Synced from TypeScript sources via CI script.
--
-- These tables are not queried at build time (build uses .ts files).
-- They serve as a normalized data store for future phases:
--   - Supabase dashboard / admin tools
--   - Fulltext search API
--   - Live editorial updates (without rebuild)
--   - Analytics and reporting
--
-- RLS is permissive (read-only for anon). Write access via CI script
-- with service role.

-- ─── Tribes ───────────────────────────────────────────────────────────
create table if not exists public.tribes (
  id           text primary key,
  name         text not null,
  name_en      text,
  description  text,
  color        text,
  text_color   text,
  metadata     jsonb default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.tribes enable row level security;
create policy "tribes are public" on public.tribes for select using (true);

create index tribes_name on public.tribes (name);

-- ─── Clans ────────────────────────────────────────────────────────────
create table if not exists public.clans (
  id                 text primary key,
  name               text not null,
  tribe              text not null references public.tribes(id),
  description        text,
  feelings           text[] default array[]::text[],
  antonyms           text[] default array[]::text[],
  canonical_emotion  text,
  metadata           jsonb default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.clans enable row level security;
create policy "clans are public" on public.clans for select using (true);

create index clans_tribe on public.clans (tribe);
create index clans_name on public.clans (name);

-- ─── Emotions ─────────────────────────────────────────────────────────
create table if not exists public.emotions (
  id                     text primary key,
  name                   text not null,
  name_en                text,
  tribe                  text not null references public.tribes(id),
  clan                   text references public.clans(id),
  description            text,
  etymology              text,
  poetic_intro           text,
  antonyms               text[] default array[]::text[],
  neighbors              text[] default array[]::text[],

  -- Resonance axes (0–100 scale)
  resonance              jsonb,

  -- Cross-disciplinary resonance (array of IDs)
  color_resonance        text[] default array[]::text[],
  typography_resonance   text[] default array[]::text[],
  artwork_resonance      text[] default array[]::text[],
  music_resonance        text[] default array[]::text[],
  film_resonance         text[] default array[]::text[],
  poetry_resonance       text[] default array[]::text[],
  sculpture_resonance    text[] default array[]::text[],
  dance_resonance        text[] default array[]::text[],
  architecture_resonance text[] default array[]::text[],
  photography_resonance  text[] default array[]::text[],
  literature_resonance   text[] default array[]::text[],
  ritual_resonance       text[] default array[]::text[],
  theater_resonance      text[] default array[]::text[],

  atmosphere_tags        text[] default array[]::text[],
  metadata               jsonb default '{}',

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.emotions enable row level security;
create policy "emotions are public" on public.emotions for select using (true);

create index emotions_tribe on public.emotions (tribe);
create index emotions_clan on public.emotions (clan);
create index emotions_name on public.emotions (name);

-- ─── Colors ───────────────────────────────────────────────────────────
create table if not exists public.colors (
  id           text primary key,
  name_es      text not null,
  name_en      text,
  hex          text not null,
  description  text,
  metadata     jsonb default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.colors enable row level security;
create policy "colors are public" on public.colors for select using (true);

create index colors_hex on public.colors (hex);
create index colors_name_es on public.colors (name_es);

-- ─── Typography ───────────────────────────────────────────────────────
create table if not exists public.typography (
  id            text primary key,
  name          text not null,
  family        text not null,
  weights       text[] default array[]::text[],
  styles        text[] default array[]::text[],
  axis          text,
  google_family text,
  description   text,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.typography enable row level security;
create policy "typography is public" on public.typography for select using (true);

create index typography_family on public.typography (family);
create index typography_name on public.typography (name);
