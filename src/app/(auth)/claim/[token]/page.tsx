import type { Metadata } from "next";
import Link from "next/link";
import { claimTokenEmail } from "@/server/auth/account";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/label";
import { AuthForm } from "../../auth-form";
import { claimAction } from "../../actions";

export const metadata: Metadata = { title: "Set up your account" };

/** Account-claim landing (PRD §25). */
export default async function ClaimPage({
  params,
}: PageProps<"/claim/[token]">) {
  const { token } = await params;
  const email = await claimTokenEmail(token);

  if (!email) {
    return (
      <main className="text-center">
        <h1 className="type-headline-lg">This link has expired</h1>
        <p className="type-body-md text-muted mt-3">
          These links are valid for 7 days and work once. You can get a
          fresh one any time via password reset.
        </p>
        <Link
          href="/forgot-password"
          className="type-label mt-8 inline-block underline underline-offset-4"
        >
          Send me a new link
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1 className="type-headline-lg text-center">Set up your account</h1>
      <p className="type-body-md text-muted mt-3 text-center">
        Choose a password for <span className="text-ink">{email}</span>. Any
        stays booked with this address will be waiting for you.
      </p>
      <div className="mt-10">
        <AuthForm
          action={claimAction}
          submitLabel="Create account"
          pendingLabel="Setting up…"
        >
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />
          <Field label="Password" htmlFor="password">
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
