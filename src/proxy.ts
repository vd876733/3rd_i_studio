import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const isAuth = !!req.nextauth.token;
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");

    if (isLoginPage && isAuth) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/login")) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/inventory/:path*", "/projects/:path*", "/scan/:path*", "/login"],
};
