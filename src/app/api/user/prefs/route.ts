import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logWelcomeEmail, logWelcomeEmailProd } from "@/lib/welcome-email/log";
import { loadWelcomeEmailProfileState } from "@/lib/welcome-email/profile-state";
import { sendWelcomeEmailOnce } from "@/lib/welcome-email/send-welcome-email";

const PrefsSchema = z.object({
  profession: z.string().min(1).max(80),
  contentTypes: z.array(z.string()).min(1).max(10),
  onboarded: z.boolean(),
  fullName: z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("profession, content_types, onboarded, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/user/prefs GET]", error.message);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      profession: data.profession ?? "",
      contentTypes: data.content_types ?? [],
      onboarded: data.onboarded ?? false,
      fullName: data.full_name ?? null,
    },
  });
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { profession, contentTypes, onboarded, fullName } = parsed.data;
  const resolvedName =
    fullName ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    null;

  const existingState = await loadWelcomeEmailProfileState(supabase, user.id);
  const existingProfile = existingState.ok ? existingState.profile : null;

  if (!existingState.ok) {
    console.error("[prefs/route.ts:PUT] Failed to load existing profile:", existingState.error);
  }

  const welcomeEmailSentBefore = existingProfile?.welcome_email_sent ?? false;

  const shouldSendWelcomeEmail =
    onboarded &&
    !welcomeEmailSentBefore &&
    Boolean(profession) &&
    Boolean(user.email);

  logWelcomeEmail("gate", {
    userEmail: user.email ?? null,
    shouldSendWelcomeEmail,
    welcomeEmailSent: welcomeEmailSentBefore,
    welcomeEmailSentBefore,
    onboarded,
    hasProfession: Boolean(profession),
    hasEmail: Boolean(user.email),
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    resendFrom: process.env.RESEND_FROM ?? "VitaminAI <onboarding@resend.dev>",
  });

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      profession,
      content_types: contentTypes,
      onboarded,
      full_name: resolvedName,
      interests: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[api/user/prefs PUT]", error.message);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  let welcomeEmailResult = null;

  if (shouldSendWelcomeEmail && user.email) {
    logWelcomeEmailProd("send_function_called", {
      userEmail: user.email,
      shouldSendWelcomeEmail: true,
      welcomeEmailSent: welcomeEmailSentBefore,
    });

    welcomeEmailResult = await sendWelcomeEmailOnce({
      supabase,
      userId: user.id,
      email: user.email,
      fullName: resolvedName,
      profession,
      shouldSendWelcomeEmail,
    });

    logWelcomeEmail("route_finished", {
      userEmail: user.email,
      shouldSendWelcomeEmail,
      emailSent: welcomeEmailResult.sent,
      welcomeEmailSent: welcomeEmailResult.welcomeEmailSentAfter ?? welcomeEmailSentBefore,
      welcomeEmailSentBefore: welcomeEmailResult.welcomeEmailSentBefore ?? welcomeEmailSentBefore,
      welcomeEmailSentAfter: welcomeEmailResult.welcomeEmailSentAfter ?? welcomeEmailSentBefore,
      resendResponse: welcomeEmailResult.messageId ? { id: welcomeEmailResult.messageId } : null,
      resendError: welcomeEmailResult.error ?? null,
      skipped: welcomeEmailResult.skipped,
      reason: welcomeEmailResult.reason ?? null,
    });
  } else if (onboarded && user.email) {
    logWelcomeEmail("route_skipped", {
      userEmail: user.email,
      shouldSendWelcomeEmail: false,
      emailSent: false,
      welcomeEmailSent: welcomeEmailSentBefore,
      welcomeEmailSentBefore,
      welcomeEmailSentAfter: welcomeEmailSentBefore,
      resendResponse: null,
      resendError: null,
      reason: welcomeEmailSentBefore ? "already_sent" : "ineligible",
    });
  }

  return NextResponse.json({
    ok: true,
    welcomeEmail: welcomeEmailResult,
  });
}
