import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/db/supabase/proxy";

// API routes answer 401 themselves instead of redirecting.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/invite",
  "/rsvp",
  "/find-event",
  "/about",
  "/api",
];
// "/" shows the landing page when signed out; only the exact path, not everything under it.
const PUBLIC_EXACT = ["/"];
const AUTH_PAGES = ["/login", "/signup"];

const matches = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname } = request.nextUrl;

  let target: string | null = null;
  if (
    !userId &&
    !PUBLIC_EXACT.includes(pathname) &&
    !matches(pathname, PUBLIC_PATHS)
  )
    target = "/login";
  if (userId && matches(pathname, AUTH_PAGES)) {
    const invite = request.nextUrl.searchParams.get("invite");
    target = invite ? `/invite/${encodeURIComponent(invite)}` : "/";
  }
  if (!target) return response;

  // Carry over the refreshed session cookies and no-cache headers, or the user gets signed out.
  const redirect = NextResponse.redirect(new URL(target, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Everything except static files, images and the inbound email webhook.
    "/((?!_next/static|_next/image|favicon.ico|api/inbound-email|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
