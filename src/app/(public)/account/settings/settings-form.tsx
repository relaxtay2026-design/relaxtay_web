"use client";

import { useActionState } from "react";
import { updateMarketingAction, type AccountFormState } from "../actions";
import { Button } from "@/components/ui/button";

const initial: AccountFormState = { error: null };

export function SettingsForm({ optedIn }: { optedIn: boolean }) {
  const [state, formAction, pending] = useActionState(
    updateMarketingAction,
    initial
  );

  return (
    <form action={formAction} className="max-w-md space-y-6">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="marketingOptIn"
          defaultChecked={optedIn}
          className="mt-1 h-4 w-4 accent-ink"
        />
        <span className="type-body-md text-muted">
          Receive occasional offers, travel deals, and news about new stays.
          Transactional emails about your bookings always arrive regardless.
        </span>
      </label>
      {state.saved && (
        <p className="type-body-md rounded border border-sage/40 bg-sage-container/50 px-4 py-3">
          Preferences saved.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
