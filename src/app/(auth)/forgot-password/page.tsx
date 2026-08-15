import type { Metadata } from "next";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { AuthForm } from "../auth-form";
import { forgotAction } from "../actions";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main>
      <h1 className="type-headline-lg text-center">Reset your password</h1>
      <p className="type-body-md text-muted mt-3 text-center">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <div className="mt-10">
        <AuthForm
          action={forgotAction}
          submitLabel="Send reset link"
          pendingLabel="Sending…"
          successContent={
            <div className="text-center">
              <p className="type-body-lg">Check your inbox.</p>
              <p className="type-body-md text-muted mt-3">
                If an account exists for that email, a reset link is on its
                way. It&apos;s valid for one hour.
              </p>
              <Link
                href="/login"
                className="type-label mt-8 inline-block underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </div>
          }
          footer={
            <p className="type-body-md text-muted text-center">
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-ink"
              >
                Back to sign in
              </Link>
            </p>
          }
        >
          <Field label="Email address" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </Field>
        </AuthForm>
      </div>
    </main>
  );
}
