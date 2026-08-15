import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { AuthForm } from "../auth-form";
import { registerAction, googleAction } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/account");

  return (
    <main>
      <h1 className="type-headline-lg text-center">Create your account</h1>
      <p className="type-body-md text-muted mt-3 text-center">
        Keep your stays, booking status, and details in one place.
      </p>

      <div className="mt-10 space-y-6">
        {googleEnabled && (
          <>
            <form action={googleAction}>
              <button
                type="submit"
                className="type-label h-11 w-full rounded border border-ink bg-transparent text-ink transition-colors hover:bg-ink hover:text-ivory"
              >
                Continue with Google
              </button>
            </form>
            <div className="flex items-center gap-4">
              <span className="h-px flex-1 bg-divider" />
              <span className="type-label text-muted">or</span>
              <span className="h-px flex-1 bg-divider" />
            </div>
          </>
        )}

        <AuthForm
          action={registerAction}
          submitLabel="Create account"
          pendingLabel="Creating…"
          footer={
            <p className="type-body-md text-muted text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-ink underline underline-offset-4 hover:text-bronze"
              >
                Sign in
              </Link>
            </p>
          }
        >
          <Field label="Full name" htmlFor="name">
            <Input id="name" name="name" required autoComplete="name" />
          </Field>
          <Field label="Email address" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </Field>
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
