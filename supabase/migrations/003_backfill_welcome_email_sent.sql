-- Mark existing onboarded users as already sent so they do not receive a retroactive welcome email.
update public.profiles
set welcome_email_sent = true,
    updated_at = now()
where onboarded = true
  and welcome_email_sent = false;
