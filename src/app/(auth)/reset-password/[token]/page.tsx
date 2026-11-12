import type { Metadata } from "next";
import Link from "next/link";
import { peekToken } from "@/server/auth/tokens";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/label";
import { AuthForm } from "../../auth-form";
import { resetAction } from "../../actions";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  params,
}: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  const email = await peekToken(token, "reset");

  if (!email) {
    return (
      <main className="text-center">
        <h1 className="type-headline-lg">This link has expired</h1>
        <p className="type-body-md text-muted mt-3">
          Reset links are valid for one hour and can be used once.
        </p>
        <Link
          href="/forgot-password"
          className="type-label mt-8 inline-block underline underline-offset-4"
        >
          Request a new link
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1 className="type-headline-lg text-center">Choose a new password</h1>
      <p className="type-body-md text-muted mt-3 text-center">for {email}</p>
      <div className="mt-10">
        <AuthForm
          action={resetAction}
          submitLabel="Save password"
          pendingLabel="Saving…"
        >
          <input type="hidden" name="token" value={token} />
          <Field label="New password" htmlFor="password">
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
            />
          </Field>
        </AuthForm>
      </div>
    </main>
  );
}
