"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AuthFormState } from "./actions";

const initial: AuthFormState = { error: null };

/**
 * Generic auth form shell: fields are provided by the caller as children,
 * this handles action state, error display, and the submit button.
 */
export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  children,
  footer,
  successContent,
}: {
  action: (prev: AuthFormState, fd: FormData) => Promise<AuthFormState>;
  submitLabel: string;
  pendingLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Shown instead of the form when state.done is true (e.g. forgot-password). */
  successContent?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.done && successContent) return <>{successContent}</>;

  return (
    <form action={formAction} className="space-y-6">
      {children}
      {state.error && (
        <p
          role="alert"
          className="type-body-md rounded border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full" size="md">
        {pending ? pendingLabel : submitLabel}
      </Button>
      {footer}
    </form>
  );
}
