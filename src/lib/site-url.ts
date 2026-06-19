/** Production canonical origin — used only as a last-resort fallback. */
export const PRODUCTION_SITE_URL = "https://vitaminai.club";

/**
 * Explicit site URL from env (set in Vercel production).
 * Must match Supabase Auth → URL Configuration → Site URL.
 */
export function getConfiguredSiteUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;
  return value.replace(/\/$/, "");
}

/** Client-side origin for OAuth redirectTo. */
export function getClientSiteUrl(): string {
  const configured = getConfiguredSiteUrl();
  if (configured) return configured;

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return PRODUCTION_SITE_URL;
}

/**
 * Server-side origin (proxy-aware).
 * Prefers NEXT_PUBLIC_SITE_URL, then Vercel/host headers, then request URL.
 */
export function getRequestSiteUrl(request: Request): string {
  const configured = getConfiguredSiteUrl();
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const hostname = forwardedHost.split(",")[0]?.trim();
    const proto =
      forwardedProto?.split(",")[0]?.trim() ??
      (hostname?.includes("localhost") ? "http" : "https");
    return `${proto}://${hostname}`;
  }

  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return new URL(request.url).origin;
}

export function getAuthCallbackUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/auth/callback`;
}
