"use client";

import { useActionState } from "react";
import {
  confirmBookingAction,
  declineBookingAction,
  type AdminActionState,
} from "./actions";

const initial: AdminActionState = { error: null };

/** Inline confirm/decline for pending rows — no detail page needed. */
export function QuickActions({ bookingId }: { bookingId: string }) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmBookingAction,
    initial
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineBookingAction,
    initial
  );
  const pending = confirmPending || declinePending;
  const error = confirmState.error ?? declineState.error;

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="type-label text-error">{error}</span>}
      <form
        action={confirmAction}
        onSubmit={(e) => {
          if (!confirm("Confirm this booking? The guest will be emailed."))
            e.preventDefault();
        }}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="submit"
          disabled={pending}
          className="type-label rounded bg-ink px-3 py-1.5 text-ivory transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {confirmPending ? "…" : "Confirm"}
        </button>
      </form>
      <form
        action={declineAction}
        onSubmit={(e) => {
          if (!confirm("Decline this request? The guest will be emailed."))
            e.preventDefault();
        }}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <button
          type="submit"
          disabled={pending}
          className="type-label rounded border border-ink px-3 py-1.5 transition-colors hover:bg-ink hover:text-ivory disabled:opacity-40"
        >
          {declinePending ? "…" : "Decline"}
        </button>
      </form>
    </div>
  );
}
