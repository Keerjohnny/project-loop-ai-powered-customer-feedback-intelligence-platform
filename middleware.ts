import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("loop_session");
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/feedback") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/theme-trends") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/settings");

  const isAuthRoute =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup");

  // 1. Root route "/" redirects based on auth
  if (pathname === "/") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // 2. Redirect to signin if accessing protected route without session
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // 3. Redirect to dashboard if logged in and trying to access auth pages
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/feedback/:path*",
    "/analytics/:path*",
    "/theme-trends/:path*",
    "/reports/:path*",
    "/chat/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/signin",
    "/signup",
    "/signout",
  ],
};
