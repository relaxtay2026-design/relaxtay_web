"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import {
  requestPasswordChangeAction,
  type PasswordChangeState,
} from "../actions";
import { Button } from "@/components/ui/button";

const initial: PasswordChangeState = { error: null };

/**
 * Change (or first set) the password. The new password is chosen behind a
 * link emailed to the account's own address — for a Google account that is
 * the Gmail address — so the change is confirmed by the inbox owner.
 */
export function PasswordChange({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    requestPasswordChangeAction,
    initial
  );

  if (state.sentTo) {
    return (
      <div
        role="status"
        className="flex max-w-md gap-3 rounded border border-border-ghost bg-surface-low px-4 py-3"
      >
        <MailCheck className="mt-0.5 h-5 w-5 flex-none text-sage" strokeWidth={1.5} />
        <p className="type-body-md">
          We&apos;ve emailed a confirmation link to{" "}
          <span className="font-medium">{state.sentTo}</span>. Open it to
          choose your new password. The link works for one hour.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <p className="type-body-md text-muted">
        {hasPassword
          ? "To change your password, we'll email a confirmation link to "
          : "You sign in with Google. To also sign in with a password, we'll email a link to "}
        <span className="text-ink">{email}</span>. Saving the new password
        signs you out on every device.
      </p>
      {state.error && (
        <p
          role="alert"
          className="type-body-md rounded border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} variant="outline" size="md">
        {pending
          ? "Sending…"
          : hasPassword
            ? "Change password"
            : "Set a password"}
      </Button>
    </form>
  );
}
