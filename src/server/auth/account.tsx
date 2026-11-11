import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { AUTH_LIMITS, withinLimit } from "@/lib/rate-limit";
import { hashPassword, PASSWORD_MIN } from "./passwords";
import { createToken, consumeToken, peekToken } from "./tokens";
import {
  AccountExistsEmail,
  AccountInvitationEmail,
  PasswordResetEmail,
} from "@/components/email/account-emails";
import { brand } from "@/lib/brand";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
});

export type AuthResult = { ok: true } | { ok: false; error: string };

/**
 * Sign-up (PRD §24). An email address is never trusted until its owner has
 * opened a link we sent there, so sign-up does NOT take a password:
 *
 *  - new email      → an unclaimed profile + an emailed link; the password
 *                     is chosen on the page behind that link
 *  - unclaimed      → (profile made by a booking or an earlier sign-up)
 *                     the link is sent again
 *  - active account → a short "you already have an account" email
 *
 * Whoever is typing learns nothing about which case applied — the caller
 * shows the same "check your inbox" message for all three. This is what
 * stops someone registering another person's address and waiting for them
 * to book or sign in with Google.
 */
export async function registerUser(
  input: z.infer<typeof registerSchema>
): Promise<void> {
  const email = input.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });

  if (existing?.accountStatus === "disabled") return;
  if (existing?.accountStatus === "active") {
    await sendAccountExists(email, existing.name);
    return;
  }
  if (!existing) {
    await db.user.create({
      data: { name: input.name, email, accountStatus: "unclaimed" },
    });
  }
  await sendClaimInvitation(email, existing?.name ?? input.name, "signup");
}

/**
 * Send (or re-send) the link that lets the inbox owner set a password and
 * activate the account (PRD §25). `reason` only changes the wording.
 */
export async function sendClaimInvitation(
  email: string,
  guestName: string,
  reason: "booking" | "signup" = "booking"
) {
  // Cap how often one inbox can be sent this (sign-up re-sends it on demand)
  if (!(await withinLimit("claim-email", email, AUTH_LIMITS.emailPerAddress)))
    return;
  const raw = await createToken(email, "claim");
  await sendEmail({
    to: email,
    subject:
      reason === "signup"
        ? `Finish creating your ${brand.name} account`
        : "Your booking is ready to manage online",
    react: (
      <AccountInvitationEmail
        guestName={guestName}
        claimUrl={`${site()}/claim/${raw}`}
        reason={reason}
      />
    ),
  });
}

/** Someone tried to sign up with an address that already has an account. */
async function sendAccountExists(email: string, name: string) {
  if (!(await withinLimit("claim-email", email, AUTH_LIMITS.emailPerAddress)))
    return;
  await sendEmail({
    to: email,
    subject: `You already have a ${brand.name} account`,
    react: (
      <AccountExistsEmail
        name={name}
        loginUrl={`${site()}/login`}
        resetUrl={`${site()}/forgot-password`}
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
  // A link sent before the account was disabled must not switch it back on
  if (user.accountStatus === "disabled")
    return { ok: false, error: "This account is not available." };

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
  // A link sent before the account was disabled must not switch it back on
  if (user.accountStatus === "disabled")
    return { ok: false, error: "This account is not available." };

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
