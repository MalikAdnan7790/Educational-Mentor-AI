import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe gate: checks only for the presence of the session cookie.
 * Full validation (token → AuthSession → expiry) happens per-route in lib/auth.ts,
 * because middleware can't run Prisma/bcrypt on the Edge runtime.
 */

const SESSION_COOKIE = "emai_session";
const PUBLIC_PAGES = ["/", "/login", "/register"];
const PUBLIC_APIS = ["/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = req.cookies.has(SESSION_COOKIE);

  const isApi = pathname.startsWith("/api");
  const isPublicApi = PUBLIC_APIS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublicApi) return addSecurityHeaders(NextResponse.next());

  if (isPublicPage) {
    if (pathname === "/" && hasCookie) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  if (!hasCookie) {
    if (isApi) {
      return addSecurityHeaders(NextResponse.json({ error: "unauthorized" }, { status: 401 }));
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals and static public assets
    "/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
