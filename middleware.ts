import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-safe gate: checks only for the presence of the session cookie.
 * Full validation (token → AuthSession → expiry) happens per-route in lib/auth.ts,
 * because middleware can't run Prisma/bcrypt on the Edge runtime.
 */

const SESSION_COOKIE = "emai_session";
const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_APIS = ["/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = req.cookies.has(SESSION_COOKIE);

  const isApi = pathname.startsWith("/api");
  const isPublicApi = PUBLIC_APIS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublicApi) return NextResponse.next();

  if (isPublicPage) {
    // Already logged in → skip the auth pages
    if (hasCookie) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!hasCookie) {
    if (isApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static public assets
    "/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
