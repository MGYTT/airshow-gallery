import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Przepuść stronę logowania i API auth bez sprawdzania
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  // Chroń wszystkie trasy /admin/*
  if (pathname.startsWith("/admin")) {
    const session = req.cookies.get("admin_session");

    if (session?.value !== "true") {
      const loginUrl = new URL("/admin/login", req.url);
      // Zapamiętaj dokąd chciał trafić użytkownik
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};