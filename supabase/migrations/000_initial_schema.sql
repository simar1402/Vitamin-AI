-- Vitamin AI — base tables for user profiles and bookmarks
-- Run before 001_user_prefs_rls.sql (or use setup.sql for a one-shot install)

-- ── Profiles (1:1 with auth.users) ───────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  profession text,
  content_types text[] not null default '{}',
  interests text[] not null default '{}',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_onboarded_idx on public.profiles (onboarded);

-- ── Stories (bookmark metadata, shared across users) ─────────────────────────

create table if not exists public.stories (
  id text primary key,
  headline text not null,
  summary text not null default '',
  image_url text,
  source_url text not null,
  source_name text,
  published_at timestamptz not null default now(),
  content_type text not null default 'News',
  category text not null default '',
  tags text[] not null default '{}',
  why_it_matters text,
  created_at timestamptz not null default now()
);

create index if not exists stories_source_url_idx on public.stories (source_url);

-- ── Saved stories (per-user bookmarks) ───────────────────────────────────────

create table if not exists public.saved_stories (
  user_id uuid not null references auth.users (id) on delete cascade,
  story_id text not null references public.stories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, story_id)
);

create index if not exists saved_stories_user_id_idx on public.saved_stories (user_id);

-- Backfill profile rows for users who signed up before this migration
insert into public.profiles (id, full_name, content_types, interests, onboarded)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  '{}',
  '{}',
  false
from auth.users u
on conflict (id) do nothing;
