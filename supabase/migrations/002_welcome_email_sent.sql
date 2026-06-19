-- Add one-time welcome email tracking to profiles
alter table public.profiles
  add column if not exists welcome_email_sent boolean not null default false;

create index if not exists profiles_welcome_email_sent_idx
  on public.profiles (welcome_email_sent)
  where welcome_email_sent = false;
