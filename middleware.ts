import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that are always public (no auth required)
const PUBLIC_PATHS = ["/", "/auth/callback"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith("/auth/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Refresh the session — this keeps the JWT alive automatically
  const { data } = await supabase.auth.getUser();
  const isAuthenticated = !!data.user;

  // Redirect unauthenticated users away from protected pages → homepage
  if (!isAuthenticated && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Do NOT auto-redirect authenticated users on "/" — let the homepage
  // render its own logged-in state so sign-out lands cleanly here.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets, API routes, and Next.js internals.
     * API routes handle their own auth — skipping them here avoids double Supabase calls.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
};
