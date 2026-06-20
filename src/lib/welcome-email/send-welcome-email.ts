import type { SupabaseClient } from "@supabase/supabase-js";
import { getResendClient, getResendFromAddress } from "@/lib/resend";
import { getFirstName } from "@/lib/user-display-name";
import { logWelcomeEmail } from "./log";
import { loadWelcomeEmailProfileState, markWelcomeEmailSent } from "./profile-state";
import {
  buildWelcomeEmailHtml,
  buildWelcomeEmailText,
  WELCOME_EMAIL_SUBJECT,
} from "./template";

export interface WelcomeEmailResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
  messageId?: string;
  error?: string;
  welcomeEmailSentBefore?: boolean;
  welcomeEmailSentAfter?: boolean;
}

/**
 * Send the one-time welcome email. Caller must verify eligibility.
 * Uses the authenticated session client — no service-role key required.
 */
export async function sendWelcomeEmailOnce(params: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  fullName?: string | null;
  profession: string;
  shouldSendWelcomeEmail: boolean;
}): Promise<WelcomeEmailResult> {
  const { supabase, userId, email, fullName, profession, shouldSendWelcomeEmail } = params;

  logWelcomeEmail("send_attempt", {
    userEmail: email,
    userIdHint: userId.slice(0, 8),
    shouldSendWelcomeEmail,
    profession,
  });

  if (!email) {
    logWelcomeEmail("skipped", { userEmail: null, emailSent: false, reason: "no_email" });
    return { sent: false, skipped: true, reason: "no_email" };
  }

  const profileState = await loadWelcomeEmailProfileState(supabase, userId);

  if (!profileState.ok) {
    logWelcomeEmail("profile_load_failed", {
      userEmail: email,
      emailSent: false,
      error: profileState.error,
    });
    return { sent: false, skipped: true, reason: "profile_load_failed", error: profileState.error };
  }

  const { profile, columnMissing } = profileState;

  if (!profile) {
    logWelcomeEmail("skipped", {
      userEmail: email,
      emailSent: false,
      reason: "profile_not_found",
    });
    return { sent: false, skipped: true, reason: "profile_not_found" };
  }

  const welcomeEmailSentBefore = profile.welcome_email_sent;

  logWelcomeEmail("profile_before_send", {
    userEmail: email,
    shouldSendWelcomeEmail,
    welcomeEmailSentBefore,
    onboarded: profile.onboarded,
    columnMissing,
  });

  if (!profile.onboarded) {
    logWelcomeEmail("skipped", {
      userEmail: email,
      emailSent: false,
      welcomeEmailSentBefore,
      reason: "not_onboarded",
    });
    return { sent: false, skipped: true, reason: "not_onboarded", welcomeEmailSentBefore };
  }

  if (profile.welcome_email_sent) {
    logWelcomeEmail("skipped", {
      userEmail: email,
      emailSent: false,
      welcomeEmailSentBefore,
      reason: "already_sent",
    });
    return { sent: false, skipped: true, reason: "already_sent", welcomeEmailSentBefore };
  }

  const firstName = getFirstName(fullName ?? profile.full_name, email);

  try {
    const resend = getResendClient();
    const from = getResendFromAddress();

    logWelcomeEmail("resend_call_start", {
      userEmail: email,
      from,
      subject: WELCOME_EMAIL_SUBJECT,
    });

    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: WELCOME_EMAIL_SUBJECT,
      html: buildWelcomeEmailHtml(firstName),
      text: buildWelcomeEmailText(firstName),
    });

    logWelcomeEmail("resend_result", {
      userEmail: email,
      shouldSendWelcomeEmail,
      welcomeEmailSentBefore,
      resendResponse: data ?? null,
      resendError: error?.message ?? null,
    });

    if (error) {
      logWelcomeEmail("resend_error", {
        userEmail: email,
        emailSent: false,
        welcomeEmailSentBefore,
        error: error.message,
      });
      return {
        sent: false,
        skipped: false,
        error: error.message,
        welcomeEmailSentBefore,
      };
    }

    const flagResult = await markWelcomeEmailSent(supabase, userId);

    if (!flagResult.ok) {
      logWelcomeEmail("flag_update_failed", {
        userEmail: email,
        emailSent: true,
        welcomeEmailSentBefore,
        messageId: data?.id ?? null,
        error: flagResult.error,
        columnMissing: flagResult.columnMissing,
      });
      return {
        sent: true,
        skipped: false,
        messageId: data?.id,
        welcomeEmailSentBefore,
        error: flagResult.columnMissing
          ? "sent_but_welcome_email_sent_column_missing"
          : `sent_but_flag_update_failed: ${flagResult.error}`,
      };
    }

    logWelcomeEmail("success", {
      userEmail: email,
      emailSent: true,
      shouldSendWelcomeEmail,
      welcomeEmailSentBefore: flagResult.welcomeEmailSentBefore,
      welcomeEmailSentAfter: flagResult.welcomeEmailSentAfter,
      messageId: data?.id ?? null,
    });

    return {
      sent: true,
      skipped: false,
      messageId: data?.id,
      welcomeEmailSentBefore: flagResult.welcomeEmailSentBefore,
      welcomeEmailSentAfter: flagResult.welcomeEmailSentAfter,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected send error";
    logWelcomeEmail("exception", {
      userEmail: email,
      emailSent: false,
      welcomeEmailSentBefore,
      error: message,
    });
    return {
      sent: false,
      skipped: false,
      error: message,
      welcomeEmailSentBefore,
    };
  }
}
