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
