import { getSupabaseAdmin } from "@/integrations/supabase/server";
import { PROFESSIONS } from "@/lib/providers/profession-config";
import { getFirstName } from "@/lib/user-display-name";
import { getResendClient, getResendFromAddress } from "@/lib/resend";
import {
  buildDigestHtml,
  buildDigestText,
  DIGEST_SUBJECT,
} from "./email-template";
import { selectDigestStories } from "./story-selection";
import type {
  DailyDigestRunResult,
  DigestContent,
  DigestRecipient,
  DigestSendResult,
} from "./types";

export const TEST_DIGEST_EMAIL = "mesimarpreet@gmail.com";

function professionLabel(professionId: string): string {
  return PROFESSIONS.find((p) => p.id === professionId)?.label ?? professionId;
}

async function loadDigestRecipients(): Promise<DigestRecipient[]> {
  const supabase = getSupabaseAdmin();

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, profession")
    .not("profession", "is", null);

  if (profileError) {
    throw new Error(`Failed to load profiles: ${profileError.message}`);
  }

  console.info(`[digest] profiles loaded from Supabase: ${profiles?.length ?? 0}`);

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError) {
    throw new Error(`Failed to load auth users: ${authError.message}`);
  }

  const emailById = new Map(
    (authData.users ?? [])
      .filter((user) => user.email)
      .map((user) => [user.id, user.email as string]),
  );

  const recipients: DigestRecipient[] = [];

  for (const profile of profiles ?? []) {
    if (!profile.profession) continue;

    const email = emailById.get(profile.id);
    if (!email) {
      console.warn(`[digest] Skipping profile ${profile.id} — no email on file`);
      continue;
    }

    recipients.push({
      userId: profile.id,
      email,
      firstName: getFirstName(profile.full_name, email),
      professionId: profile.profession,
      professionLabel: professionLabel(profile.profession),
    });
  }

  console.info(`[digest] users found: ${recipients.length}`);
  return recipients;
}

async function sendDigestEmail(
  recipient: DigestRecipient,
  content: DigestContent,
): Promise<DigestSendResult> {
  const resend = getResendClient();
  const params = {
    firstName: recipient.firstName,
    professionLabel: recipient.professionLabel,
    content,
  };

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [recipient.email],
      subject: DIGEST_SUBJECT,
      html: buildDigestHtml(params),
      text: buildDigestText(params),
    });

    if (error) {
      console.error(`[digest] Resend error for ${recipient.email}:`, error.message);
      return { email: recipient.email, success: false, error: error.message };
    }

    console.info(`[digest] Sent to ${recipient.email} (id=${data?.id ?? "unknown"})`);
    return { email: recipient.email, success: true, messageId: data?.id ?? undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected send error";
    console.error(`[digest] Failed to send to ${recipient.email}:`, message);
    return { email: recipient.email, success: false, error: message };
  }
}

export async function runDailyDigest(options: {
  testMode?: boolean;
}): Promise<DailyDigestRunResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const results: DigestSendResult[] = [];

  console.info(`[digest] Starting daily digest run (testMode=${options.testMode === true})`);

  let recipients: DigestRecipient[];

  if (options.testMode) {
    const all = await loadDigestRecipients();
    const sample = all[0] ?? {
      userId: "test",
      email: TEST_DIGEST_EMAIL,
      firstName: "Simar",
      professionId: "product-designer",
      professionLabel: professionLabel("product-designer"),
    };

    recipients = [
      {
        ...sample,
        email: TEST_DIGEST_EMAIL,
        firstName: sample.firstName || "Simar",
      },
    ];
  } else {
    recipients = await loadDigestRecipients();
  }

  if (recipients.length === 0) {
    errors.push("No eligible recipients found");
    console.info("[digest] users found: 0");
    console.info("[digest] emails sent: 0");
    console.info("[digest] emails failed: 0");
    return {
      mode: options.testMode ? "test" : "production",
      startedAt,
      finishedAt: new Date().toISOString(),
      usersFound: 0,
      recipients: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      results,
      errors,
    };
  }

  const contentCache = new Map<string, DigestContent>();

  for (const recipient of recipients) {
    try {
      let content = contentCache.get(recipient.professionId);
      if (!content) {
        content = await selectDigestStories(recipient.professionId);
        contentCache.set(recipient.professionId, content);
      }

      if (!content.article && !content.video) {
        console.warn(
          `[digest] Skipping ${recipient.email} — no article or video for ${recipient.professionId}`,
        );
        results.push({
          email: recipient.email,
          success: false,
          error: "No digest content available",
        });
        continue;
      }

      const result = await sendDigestEmail(recipient, content);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected digest error";
      console.error(`[digest] Error processing ${recipient.email}:`, message);
      errors.push(`${recipient.email}: ${message}`);
      results.push({ email: recipient.email, success: false, error: message });
    }
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const skipped = recipients.length - results.length;

  console.info(`[digest] users found: ${recipients.length}`);
  console.info(`[digest] emails sent: ${sent}`);
  console.info(`[digest] emails failed: ${failed}`);

  return {
    mode: options.testMode ? "test" : "production",
    startedAt,
    finishedAt: new Date().toISOString(),
    usersFound: recipients.length,
    recipients: recipients.length,
    sent,
    failed,
    skipped,
    results,
    errors,
  };
}
