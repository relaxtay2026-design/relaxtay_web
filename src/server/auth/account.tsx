import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { AUTH_LIMITS, withinLimit } from "@/lib/rate-limit";
import { hashPassword, PASSWORD_MIN } from "./passwords";
import { createToken, consumeToken, peekToken } from "./tokens";
import {
  AccountInvitationEmail,
  PasswordResetEmail,
} from "@/components/email/account-emails";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(PASSWORD_MIN).max(200),
});

export type AuthResult = { ok: true } | { ok: false; error: string };

/**
 * Email/password registration (PRD §24). An existing email is NEVER
 * silently taken over — unclaimed profiles (created by bookings) must go
 * through an email-verified path: the claim link or a password reset.
 */
export async function registerUser(
  input: z.infer<typeof registerSchema>
): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const existing = await db.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (existing) {
    if (existing.accountStatus === "unclaimed") {
      // Re-send the claim invitation instead of allowing takeover
      await sendClaimInvitation(email, existing.name);
      return {
        ok: false,
        error:
          "A guest profile with this email already exists from a booking. We've re-sent your claim link — check your inbox.",
      };
    }
    return {
      ok: false,
      error: "An account with this email already exists. Try signing in.",
    };
  }

  await db.user.create({
    data: {
      name: input.name,
      email,
      accountStatus: "active",
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: email,
          passwordHash: await hashPassword(input.password),
        },
      },
    },
  });
  return { ok: true };
}

/** Send (or re-send) the account-claim invitation (PRD §25). */
export async function sendClaimInvitation(email: string, guestName: string) {
  // Cap how often one inbox can be sent this (register re-sends it on demand)
  if (!(await withinLimit("claim-email", email, AUTH_LIMITS.emailPerAddress)))
    return;
  const raw = await createToken(email, "claim");
  await sendEmail({
    to: email,
    subject: "Your booking is ready to manage online",
    react: (
      <AccountInvitationEmail
        guestName={guestName}
        claimUrl={`${site()}/claim/${raw}`}
      />
    ),
  });
}

/** Claim page load: validate token without consuming. */
export async function claimTokenEmail(raw: string) {
  return peekToken(raw, "claim");
}

/** Complete the claim: set password, activate, consume token. */
export async function completeClaim(
  raw: string,
  password: string
): Promise<AuthResult> {
  if (password.length < PASSWORD_MIN)
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN} characters.`,
    };
  const email = await consumeToken(raw, "claim");
  if (!email)
    return {
      ok: false,
      error: "This link has expired or was already used. Request a new one below.",
    };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "Account not found." };

  await db.$transaction([
    db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "credentials",
          providerAccountId: email,
        },
      },
      create: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: email,
        passwordHash: await hashPassword(password),
      },
      update: { passwordHash: await hashPassword(password) },
    }),
    db.user.update({
      where: { id: user.id },
      data: { accountStatus: "active" },
    }),
  ]);
  return { ok: true };
}

/**
 * Forgot password: always report success (no account enumeration).
 * For unclaimed profiles this doubles as an email-verified claim path.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || user.accountStatus === "disabled") return;
  // Silently skip beyond the cap — the caller always reports success, so
  // this neither floods the inbox nor reveals whether the account exists.
  if (!(await withinLimit("reset-email", user.email, AUTH_LIMITS.emailPerAddress)))
    return;
  const raw = await createToken(user.email, "reset");
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    react: <PasswordResetEmail resetUrl={`${site()}/reset-password/${raw}`} />,
  });
}

/** Complete a reset: new password + activate (email now verified). */
export async function completePasswordReset(
  raw: string,
  password: string
): Promise<AuthResult> {
  if (password.length < PASSWORD_MIN)
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN} characters.`,
    };
  const email = await consumeToken(raw, "reset");
  if (!email)
    return {
      ok: false,
      error: "This link has expired or was already used. Request a new one.",
    };
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { ok: false, error: "Account not found." };

  await db.$transaction([
    db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "credentials",
          providerAccountId: email,
        },
      },
      create: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: email,
        passwordHash: await hashPassword(password),
      },
      update: { passwordHash: await hashPassword(password) },
    }),
    db.user.update({
      where: { id: user.id },
      data: { accountStatus: "active" },
    }),
  ]);
  return { ok: true };
}
