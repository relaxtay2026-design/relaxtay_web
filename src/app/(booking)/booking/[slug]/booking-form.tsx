"use client";

import * as React from "react";
import { useActionState } from "react";
import { submitBooking, type BookingFormState } from "../actions";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initialState: BookingFormState = { error: null };

export function BookingForm({
  slug,
  checkIn,
  checkOut,
  guests,
  maxGuests,
}: {
  slug: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  maxGuests: number;
}) {
  const [state, formAction, pending] = useActionState(
    submitBooking,
    initialState
  );

  return (
    <form action={formAction} className="max-w-xl">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />

      <h2 className="type-headline-md mb-6">Your information</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Full name" htmlFor="guestName" className="sm:col-span-2">
          <Input
            id="guestName"
            name="guestName"
            required
            autoComplete="name"
            placeholder="Your full name"
          />
        </Field>
        <Field label="Email address" htmlFor="guestEmail">
          <Input
            id="guestEmail"
            name="guestEmail"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Phone number" htmlFor="guestPhone">
          <Input
            id="guestPhone"
            name="guestPhone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 …"
          />
        </Field>
        <Field label="Number of guests" htmlFor="guestCount">
          <select
            id="guestCount"
            name="guestCount"
            defaultValue={guests}
            className="type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} guest{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Optional message"
          htmlFor="guestMessage"
          className="sm:col-span-2"
        >
          <Textarea
            id="guestMessage"
            name="guestMessage"
            placeholder="Any special requests or arrival time details…"
          />
        </Field>
      </div>

      {/* Marketing consent — unchecked by default, exact copy per PRD §20 */}
      <label className="mt-6 flex items-start gap-3">
        <input
          type="checkbox"
          name="marketingOptIn"
          className="mt-1 h-4 w-4 accent-ink"
        />
        <span className="type-body-md text-muted">
          Send me occasional offers, travel deals, and news about new stays.
        </span>
      </label>

      {state.error && (
        <p
          role="alert"
          className="type-body-md mt-6 rounded border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="mt-8" size="lg">
        {pending ? "Sending request…" : "Confirm reservation request"}
      </Button>
      <p className="type-label text-muted mt-4">
        No charge now — we confirm personally, usually within a day.
      </p>
    </form>
  );
}
