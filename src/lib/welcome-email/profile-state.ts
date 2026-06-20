import type { SupabaseClient } from "@supabase/supabase-js";

export interface WelcomeEmailProfileState {
  onboarded: boolean;
  welcome_email_sent: boolean;
  profession: string | null;
  created_at: string | null;
  full_name: string | null;
}

function isMissingWelcomeEmailSentColumn(message: string): boolean {
  return message.includes("welcome_email_sent");
}

/**
 * Load profile fields needed for welcome-email idempotency.
 * Falls back when welcome_email_sent column has not been migrated yet.
 */
export async function loadWelcomeEmailProfileState(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  | { ok: true; profile: WelcomeEmailProfileState | null; columnMissing: boolean }
  | { ok: false; error: string }
> {
  const full = await supabase
    .from("profiles")
    .select("onboarded, welcome_email_sent, profession, created_at, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (!full.error) {
    return {
      ok: true,
      profile: full.data as WelcomeEmailProfileState | null,
      columnMissing: false,
    };
  }

  if (!isMissingWelcomeEmailSentColumn(full.error.message)) {
    return { ok: false, error: full.error.message };
  }

  const partial = await supabase
    .from("profiles")
    .select("onboarded, profession, created_at, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (partial.error) {
    return { ok: false, error: partial.error.message };
  }

  if (!partial.data) {
    return { ok: true, profile: null, columnMissing: true };
  }

  return {
    ok: true,
    profile: {
      ...partial.data,
      welcome_email_sent: false,
    },
    columnMissing: true,
  };
}

export async function markWelcomeEmailSent(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  | {
      ok: true;
      welcomeEmailSentBefore: boolean;
      welcomeEmailSentAfter: boolean;
    }
  | { ok: false; error: string; columnMissing: boolean }
> {
  const beforeState = await loadWelcomeEmailProfileState(supabase, userId);
  const welcomeEmailSentBefore = beforeState.ok
    ? (beforeState.profile?.welcome_email_sent ?? false)
    : false;

  const { error, count } = await supabase
    .from("profiles")
    .update(
      {
        welcome_email_sent: true,
        updated_at: new Date().toISOString(),
      },
      { count: "exact" },
    )
    .eq("id", userId)
    .eq("welcome_email_sent", false);

  if (error) {
    return {
      ok: false,
      error: error.message,
      columnMissing: isMissingWelcomeEmailSentColumn(error.message),
    };
  }

  if (count === 0) {
    console.warn("[welcome-email] welcome_email_sent not updated — row may already be marked sent");
  }

  const afterState = await loadWelcomeEmailProfileState(supabase, userId);
  const welcomeEmailSentAfter = afterState.ok
    ? (afterState.profile?.welcome_email_sent ?? welcomeEmailSentBefore)
    : welcomeEmailSentBefore;

  return {
    ok: true,
    welcomeEmailSentBefore,
    welcomeEmailSentAfter,
  };
}
