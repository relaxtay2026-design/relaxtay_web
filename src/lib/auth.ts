import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/server/auth/passwords";

/**
 * Auth.js v5 (PRD §6.2): Google + credentials against the same User,
 * JWT sessions carrying role/accountStatus. Google is included only when
 * configured, so the app runs before OAuth is set up.
 */
const providers = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;

      const user = await db.user.findUnique({
        where: { email },
        include: { accounts: { where: { provider: "credentials" } } },
      });
      const hash = user?.accounts[0]?.passwordHash;
      if (!user || !hash) return null;
      if (user.accountStatus === "disabled") return null;
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
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      if (token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          select: { role: true, accountStatus: true, name: true },
        });
        token.role = dbUser?.role ?? "guest";
        token.accountStatus = dbUser?.accountStatus ?? "unclaimed";
        token.name = dbUser?.name ?? token.name;
      }
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

/** Server-side gate for /account/** — redirects to login (PRD §6.2). */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/** Server-side gate for /admin/** (Phase 6). */
export async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "manager") redirect("/account");
  return session;
}
