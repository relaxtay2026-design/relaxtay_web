import { cache } from "react";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { passwordStamp, verifyPassword } from "@/server/auth/passwords";
import { AUTH_LIMITS, ipFromHeaders, withinLimit } from "@/lib/rate-limit";

/** Thrown from authorize() when sign-in attempts are being throttled. */
export class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

/**
 * Auth.js v5 (PRD §6.2): Google + credentials against the same User,
 * JWT sessions carrying role/accountStatus, re-checked against the database
 * on every read (see the jwt callback). Google is included only when
 * configured, so the app runs before OAuth is set up.
 */
const providers = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials, request) {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      // Throttle here, not in the login action: this also covers direct
      // posts to /api/auth/callback/credentials.
      const ip = ipFromHeaders(request.headers);
      const allowed =
        (await withinLimit("login-ip", ip, AUTH_LIMITS.loginPerIp)) &&
        (await withinLimit("login-email", email, AUTH_LIMITS.loginPerEmail));
      if (!allowed) throw new TooManyAttempts();

      const user = await db.user.findUnique({
        where: { email },
        include: { accounts: { where: { provider: "credentials" } } },
      });
      const hash = user?.accounts[0]?.passwordHash;
      if (!user || !hash) return null;
      // Only an account whose email has been confirmed can use a password
      if (user.accountStatus !== "active") return null;
      if (!(await verifyPassword(password, hash))) return null;
      return { id: user.id, name: user.name, email: user.email };
    },
  }),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          // Same verified email across providers → same customer (PRD §24)
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user }) {
      // Google sign-in on an unclaimed customer = email-verified claim
      if (user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { accountStatus: true },
        });
        if (dbUser?.accountStatus === "disabled") return false;
        if (dbUser?.accountStatus === "unclaimed") {
          await db.user.update({
            where: { email: user.email.toLowerCase() },
            data: { accountStatus: "active" },
          });
        }
      }
      return true;
    },
    /**
     * Runs on every session read, so this is where a session is ended early.
     * Returning null clears the cookie: the account was deleted or disabled,
     * or its password changed since this session started (a reset signs
     * every device out, including whoever prompted the reset).
     */
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      if (!token.userId) return token;

      const dbUser = await db.user.findUnique({
        where: { id: token.userId },
        select: {
          role: true,
          accountStatus: true,
          name: true,
          accounts: {
            where: { provider: "credentials" },
            select: { passwordHash: true },
          },
        },
      });
      if (!dbUser || dbUser.accountStatus === "disabled") return null;

      const stamp = passwordStamp(dbUser.accounts[0]?.passwordHash);
      // A fresh sign-in takes the current stamp; after that it must match.
      // Sessions from before stamps existed carry none and end here too,
      // deliberately: letting them through would leave them immune to a
      // later reset.
      if (user?.id) token.pwd = stamp;
      else if (token.pwd !== stamp) return null;

      token.role = dbUser.role;
      token.accountStatus = dbUser.accountStatus;
      token.name = dbUser.name ?? token.name;
      return token;
    },
    async session({ session, token }) {
      session.user.id = (token.userId as string) ?? "";
      session.user.role = (token.role as "guest" | "manager") ?? "guest";
      return session;
    },
  },
});

export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

/**
 * One session lookup per request, however many gates run. Layouts, pages
 * and the admin data layer all call the gates below; React's cache()
 * collapses those into a single auth() (and a single DB read) per render.
 */
const getSession = cache(() => auth());

/** Server-side gate for /account/** — redirects to login (PRD §6.2). */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/**
 * Server-side gate for /admin/** (Phase 6).
 *
 * Call this in EVERY admin page and admin data function, not only in the
 * admin layout: layouts are skipped on client-side navigation, so a check
 * that lives only there does not protect the pages beneath it.
 */
export async function requireManager() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "manager") redirect("/account");
  return session;
}
