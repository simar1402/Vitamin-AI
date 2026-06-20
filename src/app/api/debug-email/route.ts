import { NextRequest, NextResponse } from "next/server";
import { runDailyDigest, TEST_DIGEST_EMAIL } from "@/lib/digest/send-digest";
import { getResendClient, getResendFromAddress } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { loadWelcomeEmailProfileState } from "@/lib/welcome-email/profile-state";
import { sendWelcomeEmailOnce } from "@/lib/welcome-email/send-welcome-email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LOG = "[api/debug-email]";

type StepStatus = "success" | "failure";

function normalizeSecret(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/**
 * Production-safe gate: requires CRON_SECRET or DEBUG_EMAIL_SECRET query param when set.
 * Mirrors /api/send-daily-digest auth pattern.
 */
function checkSecretAuth(req: NextRequest): { authorized: boolean; secretConfigured: boolean } {
  const secret =
    normalizeSecret(process.env.DEBUG_EMAIL_SECRET) ||
    normalizeSecret(process.env.CRON_SECRET);

  if (!secret) {
    console.warn(`${LOG} No DEBUG_EMAIL_SECRET or CRON_SECRET set — allowing request`);
    return { authorized: true, secretConfigured: false };
  }

  const querySecret = normalizeSecret(req.nextUrl.searchParams.get("secret"));
  return {
    authorized: querySecret.length > 0 && querySecret === secret,
    secretConfigured: true,
  };
}

function toStepStatus(ok: boolean): StepStatus {
  return ok ? "success" : "failure";
}

export async function GET(req: NextRequest) {
  const startedAt = new Date().toISOString();

  const { authorized, secretConfigured } = checkSecretAuth(req);
  if (!authorized) {
    console.warn(`${LOG} Unauthorized — invalid or missing secret`, { secretConfigured });
    return NextResponse.json(
      {
        error: "Unauthorized",
        hint: secretConfigured
          ? "Add ?secret=<CRON_SECRET> or ?secret=<DEBUG_EMAIL_SECRET>"
          : null,
      },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    console.warn(`${LOG} Unauthorized — no authenticated session`);
    return NextResponse.json(
      { error: "Unauthorized — sign in at vitaminai.club first, then open this URL again" },
      { status: 401 },
    );
  }

  const recipientEmail = user.email;
  const userIdHint = user.id.slice(0, 8);

  console.info(`${LOG} diagnostics start`, {
    recipientEmail,
    userIdHint,
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    resendFrom: getResendFromAddress(),
    startedAt,
  });

  // ── Step 1: Resend test (same client + from as production) ─────────────────
  let resendTestStatus: StepStatus = "failure";
  let resendTestError: string | null = null;
  let resendTestMessageId: string | null = null;

  console.info(`${LOG} step=resend_test start`, { recipientEmail });

  try {
    const resend = getResendClient();
    const from = getResendFromAddress();
    const subject = "VitaminAI Debug — Resend test";
    const textBody = `VitaminAI debug-email endpoint\n\nRecipient: ${recipientEmail}\nTime: ${startedAt}\n\nIf you received this, Resend is connected.`;

    const { data, error } = await resend.emails.send({
      from,
      to: [recipientEmail],
      subject,
      text: textBody,
      html: textBody.replace(/\n/g, "<br />"),
    });

    if (error) {
      resendTestError = error.message;
      console.error(`${LOG} step=resend_test failure`, { recipientEmail, error: error.message });
    } else {
      resendTestStatus = "success";
      resendTestMessageId = data?.id ?? null;
      console.info(`${LOG} step=resend_test success`, {
        recipientEmail,
        messageId: resendTestMessageId,
      });
    }
  } catch (err) {
    resendTestError = err instanceof Error ? err.message : "Unexpected resend test error";
    console.error(`${LOG} step=resend_test exception`, { recipientEmail, error: resendTestError });
  }

  // ── Step 2: Welcome email (exact sendWelcomeEmailOnce used by onboarding) ──
  let welcomeStatus: StepStatus = "failure";
  let welcomeError: string | null = null;
  let welcomeMessageId: string | null = null;
  let welcomeSkipped = false;
  let welcomeSkipReason: string | null = null;
  let welcomeEmailSentBefore: boolean | null = null;
  let welcomeEmailSentAfter: boolean | null = null;

  console.info(`${LOG} step=welcome_email start`, { recipientEmail });

  const profileState = await loadWelcomeEmailProfileState(supabase, user.id);
  const profile = profileState.ok ? profileState.profile : null;
  const profession = profile?.profession ?? "";
  const fullName =
    profile?.full_name ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  welcomeEmailSentBefore = profile?.welcome_email_sent ?? null;

  const shouldSendWelcomeEmail =
    Boolean(profile?.onboarded) &&
    !Boolean(profile?.welcome_email_sent) &&
    Boolean(profession) &&
    Boolean(user.email);

  console.info(`${LOG} step=welcome_email gate`, {
    recipientEmail,
    shouldSendWelcomeEmail,
    welcomeEmailSent: welcomeEmailSentBefore,
    onboarded: profile?.onboarded ?? false,
    hasProfession: Boolean(profession),
  });

  try {
    const welcomeResult = await sendWelcomeEmailOnce({
      supabase,
      userId: user.id,
      email: user.email,
      fullName,
      profession,
      shouldSendWelcomeEmail,
    });

    welcomeSkipped = welcomeResult.skipped;
    welcomeSkipReason = welcomeResult.reason ?? null;
    welcomeMessageId = welcomeResult.messageId ?? null;
    welcomeError = welcomeResult.error ?? null;
    welcomeEmailSentAfter =
      welcomeResult.welcomeEmailSentAfter ?? welcomeEmailSentBefore;

    welcomeStatus = welcomeResult.sent ? "success" : "failure";

    console.info(`${LOG} step=welcome_email finished`, {
      recipientEmail,
      status: welcomeStatus,
      sent: welcomeResult.sent,
      skipped: welcomeResult.skipped,
      reason: welcomeResult.reason ?? null,
      error: welcomeResult.error ?? null,
      messageId: welcomeResult.messageId ?? null,
      welcomeEmailSentBefore: welcomeResult.welcomeEmailSentBefore ?? welcomeEmailSentBefore,
      welcomeEmailSentAfter: welcomeResult.welcomeEmailSentAfter ?? welcomeEmailSentBefore,
    });
  } catch (err) {
    welcomeError = err instanceof Error ? err.message : "Unexpected welcome email error";
    console.error(`${LOG} step=welcome_email exception`, { recipientEmail, error: welcomeError });
  }

  // ── Step 3: Daily digest (same runDailyDigest as /api/send-daily-digest) ───
  // Cron uses testMode=false. Diagnostics use testMode=true so opening this URL
  // does not email every user — same function, safe test invocation.
  const digestTestMode = req.nextUrl.searchParams.get("digest") !== "production";
  let dailyDigestStatus: StepStatus = "failure";
  let dailyDigestError: string | null = null;
  let dailyDigestRecipient = digestTestMode ? TEST_DIGEST_EMAIL : recipientEmail;
  let dailyDigestSummary: Awaited<ReturnType<typeof runDailyDigest>> | null = null;

  console.info(`${LOG} step=daily_digest start`, {
    testMode: digestTestMode,
    cronUsesTestMode: false,
    expectedRecipient: dailyDigestRecipient,
  });

  try {
    dailyDigestSummary = await runDailyDigest({ testMode: digestTestMode });

    const digestResult = dailyDigestSummary.results[0];
    dailyDigestRecipient = digestResult?.email ?? dailyDigestRecipient;
    dailyDigestError =
      digestResult?.error ??
      (dailyDigestSummary.errors.length > 0 ? dailyDigestSummary.errors.join("; ") : null);

    dailyDigestStatus = dailyDigestSummary.sent > 0 ? "success" : "failure";

    console.info(`${LOG} step=daily_digest finished`, {
      status: dailyDigestStatus,
      testMode: digestTestMode,
      usersFound: dailyDigestSummary.usersFound,
      emailsSent: dailyDigestSummary.sent,
      emailsFailed: dailyDigestSummary.failed,
      recipient: dailyDigestRecipient,
      error: dailyDigestError,
    });
  } catch (err) {
    dailyDigestError = err instanceof Error ? err.message : "Unexpected daily digest error";
    console.error(`${LOG} step=daily_digest exception`, { error: dailyDigestError });
  }

  const finishedAt = new Date().toISOString();

  console.info(`${LOG} diagnostics complete`, {
    recipientEmail,
    resendTestStatus,
    welcomeStatus,
    dailyDigestStatus,
    finishedAt,
  });

  return NextResponse.json({
    result:
      resendTestStatus === "success" &&
      welcomeStatus === "success" &&
      dailyDigestStatus === "success"
        ? "SUCCESS"
        : "PARTIAL",
    recipient_email: recipientEmail,
    resend_test: resendTestStatus,
    welcome_email: welcomeStatus,
    daily_digest: dailyDigestStatus,
    errors: {
      resend_test: resendTestError,
      welcome_email: welcomeError ?? (welcomeSkipped ? welcomeSkipReason : null),
      daily_digest: dailyDigestError,
    },
    details: {
      resend_test: {
        message_id: resendTestMessageId,
        from: getResendFromAddress(),
      },
      welcome_email: {
        should_send_welcome_email: shouldSendWelcomeEmail,
        welcome_email_sent_before: welcomeEmailSentBefore,
        welcome_email_sent_after: welcomeEmailSentAfter,
        skipped: welcomeSkipped,
        skip_reason: welcomeSkipReason,
        message_id: welcomeMessageId,
      },
      daily_digest: {
        test_mode: digestTestMode,
        cron_uses_test_mode: false,
        digest_recipient: dailyDigestRecipient,
        users_found: dailyDigestSummary?.usersFound ?? 0,
        emails_sent: dailyDigestSummary?.sent ?? 0,
        emails_failed: dailyDigestSummary?.failed ?? 0,
        note: digestTestMode
          ? "Safe test mode (same runDailyDigest as ?test=true on /api/send-daily-digest). Cron uses testMode=false."
          : "Production digest mode — all eligible users were processed.",
      },
    },
    started_at: startedAt,
    finished_at: finishedAt,
  });
}
