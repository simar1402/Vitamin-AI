import { NextRequest, NextResponse } from "next/server";
import { runDailyDigest } from "@/lib/digest/send-digest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Temporary auth debug — logs TRUE/FALSE only, never secret values. */
function logAuthDebug(req: NextRequest): void {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  console.info("[api/send-daily-digest] auth-debug", {
    cronSecretExists: Boolean(secret),
    querySecretParamPresent: req.nextUrl.searchParams.has("secret"),
    querySecretMatches: Boolean(secret && querySecret && querySecret === secret),
    authorizationHeaderMatches: Boolean(
      secret && authHeader === `Bearer ${secret}`,
    ),
  });
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[api/send-daily-digest] CRON_SECRET not set — allowing request");
    return true;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const querySecret = req.nextUrl.searchParams.get("secret");
  return querySecret === secret;
}

export async function GET(req: NextRequest) {
  logAuthDebug(req);

  if (!isAuthorized(req)) {
    console.warn("[api/send-daily-digest] Unauthorized request");
    return NextResponse.json(
      { result: "ERROR", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const testMode = req.nextUrl.searchParams.get("test") === "true";

  try {
    console.info(`[api/send-daily-digest] Triggered (test=${testMode})`);
    const summary = await runDailyDigest({ testMode });

    const status = summary.sent > 0 ? 200 : summary.failed > 0 ? 207 : 200;

    return NextResponse.json(
      {
        result: summary.failed === 0 ? "SUCCESS" : "PARTIAL",
        message: testMode
          ? "Test daily digest completed"
          : "Daily digest completed",
        summary,
      },
      { status },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[api/send-daily-digest]", message);

    return NextResponse.json(
      {
        result: "ERROR",
        message,
      },
      { status: 500 },
    );
  }
}
