"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  confirmBookingAction,
  declineBookingAction,
  cancelBookingAction,
  type AdminActionState,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

const initial: AdminActionState = { error: null };

/** Confirm / decline / cancel with an inline note + native confirm dialog. */
export function TransitionButtons({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmBookingAction,
    initial
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineBookingAction,
    initial
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelBookingAction,
    initial
  );
  const [note, setNote] = React.useState("");

  const error = confirmState.error ?? declineState.error ?? cancelState.error;
  const pending = confirmPending || declinePending || cancelPending;
  const canConfirm = status === "pending";
  const canDecline = status === "pending";
  const canCancel = ["pending", "confirmed"].includes(status);

  if (!canConfirm && !canCancel) return null;

  const guard = (msg: string) => (e: React.FormEvent) => {
    if (!confirm(msg)) e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <Field label="Note to guest (optional, included in the email)">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Sorry — those dates just went to another party."
          className="min-h-20"
        />
      </Field>
      {error && <p className="type-body-md text-error">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {canConfirm && (
          <form
            action={confirmAction}
            onSubmit={guard("Confirm this booking? The guest will be emailed.")}
          >
            <input type="hidden" name="bookingId" value={bookingId} />
            <Button disabled={pending}>Confirm booking</Button>
          </form>
        )}
        {canDecline && (
          <form
            action={declineAction}
            onSubmit={guard("Decline this request? The guest will be emailed.")}
          >
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="note" value={note} />
            <Button variant="outline" disabled={pending}>
              Decline
            </Button>
          </form>
        )}
        {canCancel && (
          <form
            action={cancelAction}
            onSubmit={guard(
              "Cancel this booking? The dates will be released and the guest emailed."
            )}
          >
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="note" value={note} />
            <Button
              variant="outline"
              disabled={pending}
              className="border-error text-error hover:bg-error hover:text-ivory"
            >
              Cancel booking
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
