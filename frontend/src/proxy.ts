/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * Protects all dashboard routes by checking for a BetterAuth session cookie.
 * The (dashboard) route group serves pages at /, /portfolio, /risk, etc.
 * (parenthesised folders don't appear in the URL).
 *
 * Redirects unauthenticated users to /login.
 *
 * Depends on: next/server
 * Used by: Next.js App Router
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Auth pages that should redirect to / when already logged in */
const AUTH_PAGES = new Set(["/login", "/register"]);

/**
 * Routes served by the (dashboard) route group that require authentication.
 * Must be kept in sync with app/(dashboard)/ subfolders.
 */
const PROTECTED_ROUTES = new Set([
  "/",
  "/portfolio",
  "/risk",
  "/markowitz",
  "/stress",
  "/report",
]);

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Check for BetterAuth session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = !!sessionToken;

  // Protect dashboard routes
  if (PROTECTED_ROUTES.has(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_PAGES.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/portfolio",
    "/risk",
    "/markowitz",
    "/stress",
    "/report",
    "/login",
    "/register",
  ],
};
