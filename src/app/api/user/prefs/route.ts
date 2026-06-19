import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { agentLog, userIdHint } from "@/lib/debug-agent-log";
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
    agentLog("prefs/route.ts:GET", "unauthorized", { authError: authError?.message ?? null }, "H2");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("profession, content_types, onboarded, full_name, welcome_email_sent")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/user/prefs GET]", error.message);
    agentLog(
      "prefs/route.ts:GET",
      "select failed",
      { userHint: userIdHint(user.id), code: error.code, message: error.message },
      "H1",
    );
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  agentLog(
    "prefs/route.ts:GET",
    "profile loaded",
    {
      userHint: userIdHint(user.id),
      hasRow: !!data,
      onboarded: data?.onboarded ?? false,
      hasProfession: !!data?.profession,
      contentTypesLen: data?.content_types?.length ?? 0,
    },
    "H3",
  );

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
    agentLog("prefs/route.ts:PUT", "unauthorized", { authError: authError?.message ?? null }, "H2");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.info("[prefs/route.ts:PUT] Profile save request", {
    userHint: userIdHint(user.id),
    emailPresent: Boolean(user.email),
    authCreatedAt: user.created_at ?? null,
  });

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

  // Load existing profile BEFORE upsert to detect first-time onboarding completion
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("onboarded, welcome_email_sent, profession, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("[prefs/route.ts:PUT] Failed to load existing profile:", existingError.message);
  } else if (!existingProfile) {
    console.info("[prefs/route.ts:PUT] Profile created — first save for user", {
      userHint: userIdHint(user.id),
    });
  } else {
    console.info("[prefs/route.ts:PUT] Existing profile loaded", {
      userHint: userIdHint(user.id),
      wasOnboarded: existingProfile.onboarded,
      welcomeEmailSent: existingProfile.welcome_email_sent ?? false,
      previousProfession: existingProfile.profession,
    });
  }

  console.info("[prefs/route.ts:PUT] Profession selected", {
    userHint: userIdHint(user.id),
    profession,
    onboarded,
  });

  const wasOnboarded = existingProfile?.onboarded ?? false;
  const welcomeAlreadySent = existingProfile?.welcome_email_sent ?? false;
  const isFirstOnboardingCompletion =
    onboarded &&
    !wasOnboarded &&
    !welcomeAlreadySent &&
    Boolean(profession) &&
    Boolean(user.email);

  if (isFirstOnboardingCompletion) {
    console.info("[prefs/route.ts:PUT] New user detected — first onboarding completion", {
      userHint: userIdHint(user.id),
      email: user.email,
      profession,
    });
  }

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
    agentLog(
      "prefs/route.ts:PUT",
      "upsert failed",
      { userHint: userIdHint(user.id), code: error.code, message: error.message },
      "H1",
    );
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  console.info("[prefs/route.ts:PUT] Profile saved successfully", {
    userHint: userIdHint(user.id),
    profession,
    onboarded,
  });

  agentLog(
    "prefs/route.ts:PUT",
    "upsert ok",
    {
      userHint: userIdHint(user.id),
      profession,
      contentTypesLen: contentTypes.length,
      onboarded,
    },
    "H1",
  );

  let welcomeEmailResult = null;

  // Await send — fire-and-forget is killed when the Vercel function returns
  if (isFirstOnboardingCompletion && user.email) {
    welcomeEmailResult = await sendWelcomeEmailOnce({
      userId: user.id,
      email: user.email,
      fullName: resolvedName,
      profession,
    });

    console.info("[prefs/route.ts:PUT] Welcome email flow finished", {
      userHint: userIdHint(user.id),
      sent: welcomeEmailResult.sent,
      skipped: welcomeEmailResult.skipped,
      reason: welcomeEmailResult.reason ?? null,
      error: welcomeEmailResult.error ?? null,
      messageId: welcomeEmailResult.messageId ?? null,
    });
  } else if (onboarded && user.email) {
    console.info("[prefs/route.ts:PUT] Welcome email skipped — not first onboarding", {
      userHint: userIdHint(user.id),
      wasOnboarded,
      welcomeAlreadySent,
    });
  }

  return NextResponse.json({
    ok: true,
    welcomeEmail: welcomeEmailResult,
  });
}
