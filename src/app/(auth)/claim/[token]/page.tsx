import type { Metadata } from "next";
import Link from "next/link";
import { claimTokenEmail } from "@/server/auth/account";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { AuthForm } from "../../auth-form";
import { claimAction } from "../../actions";

export const metadata: Metadata = { title: "Claim your account" };

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
          Claim links are valid for 7 days. You can get a fresh one any time
          via password reset — it works for unclaimed accounts too.
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
      <h1 className="type-headline-lg text-center">Claim your account</h1>
      <p className="type-body-md text-muted mt-3 text-center">
        Set a password for <span className="text-ink">{email}</span> and your
        booking history will be waiting.
      </p>
      <div className="mt-10">
        <AuthForm
          action={claimAction}
          submitLabel="Claim account"
          pendingLabel="Setting up…"
        >
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
          </Field>
        </AuthForm>
      </div>
    </main>
  );
}
