"use client";

import { useActionState } from "react";
import { updateProfileAction, type AccountFormState } from "../actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initial: AccountFormState = { error: null };

export function ProfileForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initial
  );

  return (
    <form action={formAction} className="max-w-md space-y-6">
      <Field label="Full name" htmlFor="name">
        <Input id="name" name="name" defaultValue={name} required />
      </Field>
      <Field label="Email address" htmlFor="email">
        <Input id="email" value={email} disabled />
      </Field>
      <Field label="Phone number" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" defaultValue={phone} />
      </Field>
      {state.error && (
        <p className="type-body-md text-error">{state.error}</p>
      )}
      {state.saved && !state.error && (
        <p className="type-body-md rounded border border-sage/40 bg-sage-container/50 px-4 py-3">
          Profile saved.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
