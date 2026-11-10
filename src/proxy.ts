import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * First line of defence for the private areas (/admin, /account).
 *
 * This is an optimistic check only: it verifies that the request carries a
 * valid, signed session cookie and redirects to /login otherwise. It makes
 * no database call. Role and account checks are authoritative in
 * requireManager() / requireUser() (src/lib/auth.ts), which every private
 * page and the admin data layer call.
 */
export async function proxy(req: NextRequest) {
  if (await hasSession(req)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

async function hasSession(req: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return false; // fail closed
  try {
    // Auth.js names the cookie "__Secure-authjs.session-token" on HTTPS and
    // "authjs.session-token" on plain HTTP (local dev). Accept either.
    const token =
      (await getToken({ req, secret, secureCookie: true })) ??
      (await getToken({ req, secret, secureCookie: false }));
    return Boolean(token?.userId);
  } catch {
    return false;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
