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
 * Send the one-time welcome email after onboarding completes.
 * Idempotent: only sends when welcome_email_sent is false.
 */
export async function maybeSendWelcomeEmail(params: {
  userId: string;
  email: string;
  fullName?: string | null;
}): Promise<WelcomeEmailResult> {
  const { userId, email, fullName } = params;

  if (!email) {
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
    .select("welcome_email_sent, onboarded, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[welcome-email] Failed to load profile:", profileError.message);
    return { sent: false, skipped: true, reason: "profile_load_failed", error: profileError.message };
  }

  if (!profile?.onboarded) {
    return { sent: false, skipped: true, reason: "not_onboarded" };
  }

  if (profile.welcome_email_sent) {
    console.info(`[welcome-email] Already sent for user ${userId.slice(0, 8)}`);
    return { sent: false, skipped: true, reason: "already_sent" };
  }

  const firstName = getFirstName(fullName ?? profile.full_name, email);

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [email],
      subject: WELCOME_EMAIL_SUBJECT,
      html: buildWelcomeEmailHtml(firstName),
      text: buildWelcomeEmailText(firstName),
    });

    if (error) {
      console.error(`[welcome-email] Resend error for ${email}:`, error.message);
      return { sent: false, skipped: false, error: error.message };
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        welcome_email_sent: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .eq("welcome_email_sent", false);

    if (updateError) {
      console.error("[welcome-email] Failed to mark welcome_email_sent:", updateError.message);
      return {
        sent: true,
        skipped: false,
        messageId: data?.id,
        error: `sent_but_flag_update_failed: ${updateError.message}`,
      };
    }

    console.info(`[welcome-email] Sent to ${email} (id=${data?.id ?? "unknown"})`);
    return { sent: true, skipped: false, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected send error";
    console.error(`[welcome-email] Failed for ${email}:`, message);
    return { sent: false, skipped: false, error: message };
  }
}
