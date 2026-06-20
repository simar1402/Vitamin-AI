import { NextRequest, NextResponse } from "next/server";
import { runDailyDigest } from "@/lib/digest/send-digest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export interface AuthDebugFlags {
  cronSecretExists: boolean;
  querySecretParamPresent: boolean;
  querySecretMatches: boolean;
  authorizationHeaderMatches: boolean;
}

function normalizeSecret(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function parseBearerToken(authHeader: string | null): string {
  if (!authHeader) return "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? normalizeSecret(match[1]) : "";
}

/**
 * Validates cron access using process.env.CRON_SECRET.
 * Accepts ?secret=<CRON_SECRET> OR Authorization: Bearer <CRON_SECRET>.
 */
function checkAuth(req: NextRequest): { authorized: boolean; debug: AuthDebugFlags } {
  const secret = normalizeSecret(process.env.CRON_SECRET);
  const querySecret = normalizeSecret(req.nextUrl.searchParams.get("secret"));
  const bearerToken = parseBearerToken(req.headers.get("authorization"));

  const debug: AuthDebugFlags = {
    cronSecretExists: secret.length > 0,
    querySecretParamPresent: req.nextUrl.searchParams.has("secret"),
    querySecretMatches: secret.length > 0 && querySecret.length > 0 && querySecret === secret,
    authorizationHeaderMatches:
      secret.length > 0 && bearerToken.length > 0 && bearerToken === secret,
  };

  if (!secret) {
    console.warn("[api/send-daily-digest] CRON_SECRET not set — allowing request");
    return { authorized: true, debug };
  }

  const authorized = debug.querySecretMatches || debug.authorizationHeaderMatches;
  return { authorized, debug };
}

export async function GET(req: NextRequest) {
  const { authorized, debug } = checkAuth(req);

  console.info("[api/send-daily-digest] auth-debug", debug);

  if (!authorized) {
    console.warn("[api/send-daily-digest] Unauthorized request", debug);
    return NextResponse.json(
      {
        result: "ERROR",
        message: "Unauthorized",
        authDebug: debug,
      },
      { status: 401 },
    );
  }

  const testMode = req.nextUrl.searchParams.get("test") === "true";
  const cronTrigger = req.headers.get("x-vercel-cron") === "1";

  // ── DIAG: cron route entered ─────────────────────────────────────────────
  console.info("[DIAG:digest] cron_route_entered", {
    cronTrigger,
    testMode,
    ts: new Date().toISOString(),
  });

  try {
    console.info(
      `[api/send-daily-digest] Triggered (test=${testMode}, cron=${cronTrigger})`,
    );
    const summary = await runDailyDigest({ testMode });

    console.info("[api/send-daily-digest] run complete", {
      usersFound: summary.usersFound,
      emailsSent: summary.sent,
      emailsFailed: summary.failed,
    });

    // ── DIAG: cron route finished ─────────────────────────────────────────
    console.info("[DIAG:digest] cron_route_finished", {
      cronTrigger,
      testMode,
      usersFound: summary.usersFound,
      emailsSent: summary.sent,
      emailsFailed: summary.failed,
      ts: new Date().toISOString(),
    });

    const status = summary.sent > 0 ? 200 : summary.failed > 0 ? 207 : 200;

    return NextResponse.json(
      {
        result: summary.failed === 0 ? "SUCCESS" : "PARTIAL",
        message: testMode
          ? "Test daily digest completed"
          : "Daily digest completed",
        stats: {
          usersFound: summary.usersFound,
          emailsSent: summary.sent,
          emailsFailed: summary.failed,
        },
        summary,
      },
      { status },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[api/send-daily-digest]", message);
    console.error("[DIAG:digest] cron_route_exception", {
      cronTrigger,
      testMode,
      error: message,
      ts: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        result: "ERROR",
        message,
      },
      { status: 500 },
    );
  }
}
