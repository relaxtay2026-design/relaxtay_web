"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import {
  registerSchema,
  registerUser,
  requestPasswordReset,
  completePasswordReset,
  completeClaim,
} from "@/server/auth/account";

export type AuthFormState = { error: string | null; done?: boolean };

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
    if (e instanceof AuthError)
      return { error: "Invalid email or password." };
    throw e; // NEXT_REDIRECT on success
  }
}

export async function googleAction(): Promise<void> {
  await signIn("google", { redirectTo: "/account" });
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0].message };
  if (formData.get("password") !== formData.get("confirmPassword"))
    return { error: "Passwords don't match." };

  const result = await registerUser(parsed.data);
  if (!result.ok) return { error: result.error };

  // Auto sign-in after registration
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }
}

export async function forgotAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };
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
      redirectTo: "/account",
    });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }
}
