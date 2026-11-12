"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AUTH_LIMITS, clientIp, withinLimit } from "@/lib/rate-limit";
import {
  registerSchema,
  registerUser,
  requestPasswordReset,
  completePasswordReset,
  completeClaim,
} from "@/server/auth/account";

export type AuthFormState = { error: string | null; done?: boolean };

const TOO_MANY =
  "Too many attempts. Please wait a few minutes and try again.";

/** Auth.js surfaces the code of the error thrown in authorize(). */
function isRateLimited(e: unknown): boolean {
  return (e as { code?: unknown } | null)?.code === "rate_limited";
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/account",
    });
    return { error: null };
  } catch (e) {
    if (isRateLimited(e)) return { error: TOO_MANY };
    if (e instanceof AuthError)
      return { error: "Invalid email or password." };
    throw e; // NEXT_REDIRECT on success
  }
}

export async function googleAction(): Promise<void> {
  await signIn("google", { redirectTo: "/account" });
}

/**
 * Sign-up: no password here. We email a link and the password is chosen
 * behind it, so an account only ever belongs to whoever holds the inbox.
 * The response is the same whether or not the address is already known.
 */
export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0].message };

  if (!(await withinLimit("register-ip", await clientIp(), AUTH_LIMITS.registerPerIp)))
    return { error: TOO_MANY };

  await registerUser(parsed.data);
  return { error: null, done: true };
}

export async function forgotAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
  if (!(await withinLimit("reset-ip", await clientIp(), AUTH_LIMITS.emailPerIp)))
    return { error: TOO_MANY };
  await requestPasswordReset(email);
  return { error: null, done: true };
}

export async function resetAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirmPassword") ?? ""))
    return { error: "Passwords don't match." };
  const result = await completePasswordReset(
    String(formData.get("token") ?? ""),
    password
  );
  if (!result.ok) return { error: result.error };
  redirect("/login?reset=1");
}

export async function claimAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  if (password !== String(formData.get("confirmPassword") ?? ""))
    return { error: "Passwords don't match." };
  const token = String(formData.get("token") ?? "");
  const result = await completeClaim(token, password);
  if (!result.ok) return { error: result.error };

  // Sign straight in with the new credentials
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", {
      email,
      password,
      // ?welcome shows the "your account is ready" note once
      redirectTo: "/account?welcome=1",
    });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }
}
