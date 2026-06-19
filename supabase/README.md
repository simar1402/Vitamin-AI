# Supabase setup for user preferences

User profession, content preferences, and bookmarks are stored in Supabase,
keyed to your **auth user ID** (the same account as your email). The app
reads/writes them through `/api/user/prefs` and `/api/user/bookmarks`.

## One-time: create tables + RLS

**Required.** Without this, login works but preferences are never saved to the
cloud — you will see onboarding again after every logout.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New query**
3. Paste the full contents of **`setup.sql`** (in this folder) and click **Run**
4. Confirm success (no errors in the output panel)

`setup.sql` creates:

- `public.profiles` — profession, content types, onboarded flag
- `public.stories` — bookmark story metadata
- `public.saved_stories` — per-user bookmarks
- Row Level Security policies so each user only accesses their own data
- A trigger to auto-create a profile row on sign-up
- A backfill for existing users (including your account)

### Split migrations (optional)

If you prefer incremental migrations:

1. Run `migrations/000_initial_schema.sql`
2. Run `migrations/001_user_prefs_rls.sql`

## Verify

After running the SQL:

1. Log in → complete onboarding once
2. Log out → log in again
3. You should land on the feed (not onboarding), with your profession restored

If onboarding still appears, check the browser Network tab for
`/api/user/prefs` — GET should return `200` with your profile, not `500`.
