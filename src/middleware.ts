import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If user is authenticated and tries to visit login page or root route, redirect to dashboard
  if (token) {
    if (pathname === "/login" || pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // If user is NOT authenticated, and tries to visit protected dashboard routes, redirect to login
  const protectedRoutes = ["/dashboard", "/projects", "/scan", "/inventory", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/projects/:path*",
    "/scan/:path*",
    "/inventory/:path*",
    "/settings/:path*",
  ],
};
