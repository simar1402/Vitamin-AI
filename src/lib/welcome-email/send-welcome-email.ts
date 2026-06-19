import { getSupabaseAdmin } from "@/integrations/supabase/server";
import { getResendClient, getResendFromAddress } from "@/lib/resend";
import { getFirstName } from "@/lib/user-display-name";
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
}

/**
 * Send the one-time welcome email. Caller must verify first-time onboarding completion.
 * Idempotent guard: only sends when welcome_email_sent is false.
 */
export async function sendWelcomeEmailOnce(params: {
  userId: string;
  email: string;
  fullName?: string | null;
  profession: string;
}): Promise<WelcomeEmailResult> {
  const { userId, email, fullName, profession } = params;

  console.info("[welcome-email] Welcome email send attempt", {
    userIdHint: userId.slice(0, 8),
    emailPresent: Boolean(email),
    profession,
  });

  if (!email) {
    console.warn("[welcome-email] Skipped — no email on user record");
    return { sent: false, skipped: true, reason: "no_email" };
  }

  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "admin_client_unavailable";
    console.error("[welcome-email] Supabase admin unavailable:", message);
    return { sent: false, skipped: true, reason: "admin_unavailable", error: message };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("welcome_email_sent, onboarded, full_name, profession")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[welcome-email] Failed to load profile:", profileError.message);
    return { sent: false, skipped: true, reason: "profile_load_failed", error: profileError.message };
  }

  if (!profile) {
    console.warn("[welcome-email] Skipped — profile row not found after save");
    return { sent: false, skipped: true, reason: "profile_not_found" };
  }

  console.info("[welcome-email] Profile state before send", {
    userIdHint: userId.slice(0, 8),
    onboarded: profile.onboarded,
    welcomeEmailSent: profile.welcome_email_sent,
    profession: profile.profession,
  });

  if (!profile.onboarded) {
    console.info("[welcome-email] Skipped — user not onboarded yet");
    return { sent: false, skipped: true, reason: "not_onboarded" };
  }

  if (profile.welcome_email_sent) {
    console.info("[welcome-email] Skipped — welcome email already sent");
    return { sent: false, skipped: true, reason: "already_sent" };
  }

  const firstName = getFirstName(fullName ?? profile.full_name, email);
  console.info(`[welcome-email] Sending welcome email to ${email}`);

  try {
    const resend = getResendClient();
    console.info("[welcome-email] Resend API call starting", {
      userIdHint: userId.slice(0, 8),
      to: email,
    });

    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [email],
      subject: WELCOME_EMAIL_SUBJECT,
      html: buildWelcomeEmailHtml(firstName),
      text: buildWelcomeEmailText(firstName),
    });

    if (error) {
      console.error(`[welcome-email] Resend API error for ${email}:`, error.message);
      return { sent: false, skipped: false, error: error.message };
    }

    console.info(`[welcome-email] Welcome email sent successfully to ${email}`, {
      messageId: data?.id ?? null,
    });

    const { error: updateError, count } = await admin
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

    if (updateError) {
      console.error("[welcome-email] welcome_email_sent update failed:", updateError.message);
      return {
        sent: true,
        skipped: false,
        messageId: data?.id,
        error: `sent_but_flag_update_failed: ${updateError.message}`,
      };
    }

    if (count === 0) {
      console.warn("[welcome-email] welcome_email_sent not updated — row may already be marked sent");
    } else {
      console.info("[welcome-email] welcome_email_sent updated to TRUE", {
        userIdHint: userId.slice(0, 8),
      });
    }

    return { sent: true, skipped: false, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected send error";
    console.error(`[welcome-email] Send failed for ${email}:`, message);
    return { sent: false, skipped: false, error: message };
  }
}
