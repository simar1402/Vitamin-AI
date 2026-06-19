-- Vitamin AI — one-shot Supabase setup (schema + RLS)
-- Supabase Dashboard → SQL Editor → New query → paste all → Run

-- ── Profiles (1:1 with auth.users) ───────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  profession text,
  content_types text[] not null default '{}',
  interests text[] not null default '{}',
  onboarded boolean not null default false,
  welcome_email_sent boolean not null default false,
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

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, content_types, interests, onboarded)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    '{}',
    '{}',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.stories enable row level security;

drop policy if exists "stories_select_authenticated" on public.stories;
drop policy if exists "stories_insert_authenticated" on public.stories;
drop policy if exists "stories_update_authenticated" on public.stories;

create policy "stories_select_authenticated"
  on public.stories for select
  to authenticated
  using (true);

create policy "stories_insert_authenticated"
  on public.stories for insert
  to authenticated
  with check (true);

create policy "stories_update_authenticated"
  on public.stories for update
  to authenticated
  using (true)
  with check (true);

alter table public.saved_stories enable row level security;

drop policy if exists "saved_stories_all_own" on public.saved_stories;

create policy "saved_stories_all_own"
  on public.saved_stories for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
