-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- Requires public.profiles, public.stories, public.saved_stories — run
-- 000_initial_schema.sql first, or use ../setup.sql for a one-shot install.

-- ── Profiles ──────────────────────────────────────────────────────────────────

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

-- Auto-create an empty profile row when a user signs up
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

-- ── Stories (bookmark metadata) ───────────────────────────────────────────────

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

-- ── Saved stories (bookmarks) ─────────────────────────────────────────────────

alter table public.saved_stories enable row level security;

drop policy if exists "saved_stories_all_own" on public.saved_stories;

create policy "saved_stories_all_own"
  on public.saved_stories for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
