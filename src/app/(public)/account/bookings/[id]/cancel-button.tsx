"use client";

import { useActionState } from "react";
import {
  requestCancellationAction,
  type AccountFormState,
} from "../../actions";
import { Button } from "@/components/ui/button";

const initial: AccountFormState = { error: null };

export function CancelRequestButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    requestCancellationAction,
    initial
  );

  if (state.saved) {
    return (
      <p className="type-body-md rounded border border-sage/40 bg-sage-container/50 px-4 py-3">
        Cancellation requested — we&apos;ll confirm by email shortly.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Request cancellation of this reservation?"))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && (
        <p className="type-body-md mb-3 text-error">{state.error}</p>
      )}
      <Button variant="outline" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Request cancellation"}
      </Button>
    </form>
  );
}
