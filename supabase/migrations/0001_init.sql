-- ════════════════════════════════════════════════════════════════════
-- Álbum participation schema — Phase 2
-- ════════════════════════════════════════════════════════════════════
--
-- Three tables, uniform shape across every entity kind:
--
--   claims        — every reading of any entity field is a row here.
--                   Marina canonical readings stay in code; user, curator,
--                   inference and lens-specific readings live in this table
--                   and are merged into the in-memory adapters at boot.
--
--   claim_votes   — one vote per (claim_id, voter_id). Aggregates roll up
--                   into a `votes` jsonb on the claim via a trigger.
--
--   sessions      — anonymous ULID identities. No auth in MVP. Generated
--                   client-side, persisted in localStorage.
--
-- Row-level security is enabled with permissive INSERT / SELECT to anon
-- so the demo works without sign-in. Hardening (rate limit, captcha,
-- moderation queue) happens later.

-- ─── Extensions ───────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Sessions ─────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id           text primary key,                       -- ULID generated client-side
  created_at   timestamptz not null default now(),
  user_agent   text,
  display_name text                                    -- optional self-given alias
);

alter table public.sessions enable row level security;

create policy "sessions are visible to anyone"
  on public.sessions for select
  using (true);

create policy "anyone can insert a session"
  on public.sessions for insert
  with check (true);

-- ─── Claims ───────────────────────────────────────────────────────────
create table if not exists public.claims (
  id            uuid primary key default gen_random_uuid(),
  entity_kind   text not null,                         -- 'emotion' | 'color' | 'clan' | 'tribe' | 'artwork' | …
  entity_id     text not null,
  field_path    text not null,                         -- 'description' | 'resonance' | 'poeticIntro' | …
  source_kind   text not null check (source_kind in ('user','curator','inference','import')),
  source_id     text,                                  -- session.id, curator slug, or method name
  lens          text,                                  -- 'eastern' | 'queer' | 'feminist' | …
  value         jsonb not null,                        -- the asserted value (string, vector, array)
  weight        numeric not null default 0.5 check (weight >= 0 and weight <= 1),
  evidence      text,
  vote_score    integer not null default 0,            -- net up - down, kept in sync by trigger
  vote_total    integer not null default 0,            -- total cast
  created_at    timestamptz not null default now()
);

create index claims_entity        on public.claims (entity_kind, entity_id);
create index claims_entity_field  on public.claims (entity_kind, entity_id, field_path);
create index claims_lens          on public.claims (lens) where lens is not null;

alter table public.claims enable row level security;

create policy "claims are public"
  on public.claims for select
  using (true);

create policy "anyone with a session can post a claim"
  on public.claims for insert
  with check (
    source_kind = 'user'                                -- MVP: only user claims via REST
    and source_id is not null
    and length(source_id) between 8 and 64
    and length(coalesce(evidence, '')) <= 2000
  );

-- ─── Claim votes ──────────────────────────────────────────────────────
create table if not exists public.claim_votes (
  id          uuid primary key default gen_random_uuid(),
  claim_id    uuid not null references public.claims(id) on delete cascade,
  voter_id    text not null,                           -- session.id
  direction   smallint not null check (direction in (-1, 1)),
  created_at  timestamptz not null default now(),
  unique (claim_id, voter_id)                          -- one vote per session per claim
);

create index claim_votes_by_claim on public.claim_votes (claim_id);

alter table public.claim_votes enable row level security;

create policy "votes are public"
  on public.claim_votes for select
  using (true);

create policy "anyone can vote"
  on public.claim_votes for insert
  with check (length(voter_id) between 8 and 64);

create policy "voters can change their mind"
  on public.claim_votes for update
  using (true)
  with check (length(voter_id) between 8 and 64);

create policy "voters can retract"
  on public.claim_votes for delete
  using (true);

-- ─── Aggregate trigger: keep vote_score / vote_total on claims ────────
create or replace function public._claim_vote_aggregate()
returns trigger language plpgsql as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.claim_id, old.claim_id);
  update public.claims
     set vote_score = coalesce((
           select sum(direction) from public.claim_votes where claim_id = target_id), 0),
         vote_total = coalesce((
           select count(*)::int from public.claim_votes where claim_id = target_id), 0)
   where id = target_id;
  return null;
end;
$$;

drop trigger if exists claim_votes_aggregate on public.claim_votes;
create trigger claim_votes_aggregate
  after insert or update or delete on public.claim_votes
  for each row execute function public._claim_vote_aggregate();

-- ─── Realtime: publish changes for live updates ───────────────────────
alter publication supabase_realtime add table public.claims;
alter publication supabase_realtime add table public.claim_votes;
