import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/order"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname === "/") return NextResponse.next();

  // Check for auth cookie (set by client — we do token check client-side too)
  const token = request.cookies.get("sus_token")?.value;
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/schools") ||
      pathname.startsWith("/catalog") || pathname.startsWith("/orders") ||
      pathname.startsWith("/production") || pathname.startsWith("/payments") ||
      pathname.startsWith("/reports") || pathname.startsWith("/settings"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
