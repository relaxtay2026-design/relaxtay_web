import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field } from "@/components/ui/label";
import { AuthForm } from "../auth-form";
import { loginAction, googleAction } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await auth();
  if (session?.user?.id)
    redirect(session.user.role === "manager" ? "/admin" : "/account");
  const sp = await searchParams;

  return (
    <main>
      <h1 className="type-headline-lg text-center">Welcome back</h1>
      <p className="type-body-md text-muted mt-3 text-center">
        Sign in to see your stays. Booking never requires an account.
      </p>

      {sp.reset === "1" && (
        <p className="type-body-md mt-6 rounded border border-sage/40 bg-sage-container/50 px-4 py-3">
          Password updated — sign in with your new password.
        </p>
      )}

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
          action={loginAction}
          submitLabel="Sign in"
          pendingLabel="Signing in…"
          footer={
            <div className="space-y-3 text-center">
              <Link
                href="/forgot-password"
                className="type-label block text-muted underline underline-offset-4 hover:text-ink"
              >
                Forgot password?
              </Link>
              <p className="type-body-md text-muted">
                New here?{" "}
                <Link
                  href="/register"
                  className="text-ink underline underline-offset-4 hover:text-bronze"
                >
                  Create an account
                </Link>
              </p>
            </div>
          }
        >
          <Field label="Email address" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
            />
          </Field>
        </AuthForm>
      </div>
    </main>
  );
}
