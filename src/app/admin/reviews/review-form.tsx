"use client";

import { useActionState } from "react";
import { saveReviewAction, type ReviewFormState } from "./actions";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initial: ReviewFormState = { error: null };

type Property = { id: string; title: string };

export function ReviewForm({ properties }: { properties: Property[] }) {
  const [state, formAction, pending] = useActionState(
    saveReviewAction,
    initial
  );

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <Field label="Property" htmlFor="propertyId">
        <select
          id="propertyId"
          name="propertyId"
          required
          className="type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
        >
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Guest name" htmlFor="authorName">
          <Input id="authorName" name="authorName" required />
        </Field>
        <Field label="Rating" htmlFor="rating">
          <select
            id="rating"
            name="rating"
            defaultValue="5"
            className="type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Review" htmlFor="body" className="sm:col-span-2">
        <Textarea id="body" name="body" required className="min-h-24" />
      </Field>
      <Field label="Stayed (e.g. August 2026)" htmlFor="stayedMonth">
        <Input id="stayedMonth" name="stayedMonth" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add review"}
        </Button>
      </div>
      {state.error && (
        <p className="type-body-md text-error sm:col-span-2">{state.error}</p>
      )}
      {state.done && !state.error && (
        <p className="type-body-md rounded border border-sage/40 bg-sage-container/50 px-4 py-2 sm:col-span-2">
          Review saved.
        </p>
      )}
    </form>
  );
}
