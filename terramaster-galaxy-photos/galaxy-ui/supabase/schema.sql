-- ============================================================================
--  Galaxy Photos — Supabase schema for the shared wedding gallery
--  (Amira & Jacob's Wedding)
--
--  Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--  It is idempotent (safe to re-run). Two tables back the shared social layer:
--    • likes — hearts on a photo, per viewer name
--    • tags  — shared People / Family / Location / Labels on a photo
--  Plus a `roster` of pre-filled attendee names & locations so the tag
--  suggestions are populated even before anyone has tagged a photo.
--
--  RLS is permissive (anyone with the anon key may read/insert/delete) because
--  this is a friendly family gallery, not a secrets store. If you later add
--  sign-in, tighten these policies to `auth.uid()`-scoped rules.
-- ============================================================================

-- ---- Hearts ----------------------------------------------------------------
create table if not exists public.likes (
  id         bigint generated always as identity primary key,
  asset_id   text not null,
  viewer     text not null,
  created_at timestamptz default now(),
  unique (asset_id, viewer)
);
create index if not exists likes_asset_idx on public.likes (asset_id);
alter table public.likes enable row level security;

drop policy if exists "likes read"   on public.likes;
drop policy if exists "likes add"    on public.likes;
drop policy if exists "likes remove" on public.likes;
create policy "likes read"   on public.likes for select using (true);
create policy "likes add"    on public.likes for insert with check (true);
create policy "likes remove" on public.likes for delete using (true);

-- ---- Shared tags (People / Family / Location / Labels) ---------------------
create table if not exists public.tags (
  id         bigint generated always as identity primary key,
  asset_id   text not null,
  kind       text not null check (kind in ('person','family','place','label')),
  value      text not null,
  created_at timestamptz default now(),
  unique (asset_id, kind, value)
);
create index if not exists tags_asset_idx on public.tags (asset_id);
create index if not exists tags_kind_value_idx on public.tags (kind, value);
alter table public.tags enable row level security;

drop policy if exists "tags read"   on public.tags;
drop policy if exists "tags add"    on public.tags;
drop policy if exists "tags remove" on public.tags;
create policy "tags read"   on public.tags for select using (true);
create policy "tags add"    on public.tags for insert with check (true);
create policy "tags remove" on public.tags for delete using (true);

-- ---- Roster: pre-filled names & locations (suggestions) --------------------
-- Guests can still add their own name from the app; it lands in `tags` when
-- they tag a photo. This roster just pre-seeds the suggestion lists.
create table if not exists public.roster (
  id    bigint generated always as identity primary key,
  kind  text not null check (kind in ('person','place')),
  value text not null,
  unique (kind, value)
);
alter table public.roster enable row level security;
drop policy if exists "roster read" on public.roster;
drop policy if exists "roster add"  on public.roster;
create policy "roster read" on public.roster for select using (true);
create policy "roster add"  on public.roster for insert with check (true);

insert into public.roster (kind, value) values
  ('person','Amira'),
  ('person','Jacob'),
  ('person','Thema'),
  ('place','Saint John, Canada'),
  ('place','Halifax, Canada'),
  ('place','New York'),
  ('place','Carnival Venezia Cruise')
on conflict (kind, value) do nothing;
