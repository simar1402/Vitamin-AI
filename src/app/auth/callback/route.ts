import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl, getRequestSiteUrl } from "@/lib/site-url";

export async function GET(request: Request) {
  const siteUrl = getRequestSiteUrl(request);
  const callbackUrl = getAuthCallbackUrl(siteUrl);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.info("[auth/callback] OAuth callback received", {
    siteUrl,
    callbackUrl,
    hasCode: Boolean(code),
    hasError: Boolean(errorParam),
    next: requestedNext ?? "/feed",
  });

  if (errorParam) {
    console.error("[auth/callback] OAuth provider error", {
      error: errorParam,
      errorDescription,
    });
    return NextResponse.redirect(`${siteUrl}/?error=auth`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const createdMs = new Date(user.created_at).getTime();
        const isNewUser = Date.now() - createdMs < 120_000;
        console.info("[auth/callback] User authenticated", {
          userHint: user.id.slice(0, 8),
          emailPresent: Boolean(user.email),
          isNewUser,
          createdAt: user.created_at,
        });
        if (isNewUser) {
          console.info("[auth/callback] New user detected — profile row created by Supabase trigger", {
            userHint: user.id.slice(0, 8),
          });
        }
      }

      const next = requestedNext ?? "/feed";
      const destination = `${siteUrl}${next.startsWith("/") ? next : `/${next}`}`;
      console.info("[auth/callback] Session established, redirecting", {
        destination,
      });
      return NextResponse.redirect(destination);
    }

    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
    });
  }

  return NextResponse.redirect(`${siteUrl}/?error=auth`);
}
