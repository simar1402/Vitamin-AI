import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAuthCallbackUrl, getRequestSiteUrl } from "@/lib/site-url";

// Routes that are always public (no auth required)
const PUBLIC_PATHS = ["/", "/auth/callback"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/auth/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Supabase may redirect to Site URL with ?code= on / instead of /auth/callback
  const oauthCode = searchParams.get("code");
  if (oauthCode && pathname !== "/auth/callback") {
    const siteUrl = getRequestSiteUrl(request);
    const callback = new URL(getAuthCallbackUrl(siteUrl));
    searchParams.forEach((value, key) => {
      callback.searchParams.set(key, value);
    });
    console.info("[middleware] OAuth code on non-callback path — redirecting", {
      fromPath: pathname,
      toPath: callback.pathname,
      siteUrl,
    });
    return NextResponse.redirect(callback);
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const isAuthenticated = !!data.user;

  if (!isAuthenticated && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
