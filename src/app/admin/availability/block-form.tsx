"use client";

import { useActionState } from "react";
import { createBlockAction, type BlockFormState } from "./actions";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const initial: BlockFormState = { error: null };

export function BlockForm({ propertyId }: { propertyId: string }) {
  const [state, formAction, pending] = useActionState(
    createBlockAction,
    initial
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="propertyId" value={propertyId} />
      <Field label="From" htmlFor="startDate" className="w-40">
        <Input id="startDate" name="startDate" type="date" required />
      </Field>
      <Field label="Until (exclusive)" htmlFor="endDate" className="w-40">
        <Input id="endDate" name="endDate" type="date" required />
      </Field>
      <Field label="Note" htmlFor="note" className="min-w-52 flex-1">
        <Input
          id="note"
          name="note"
          placeholder="e.g. Maintenance, offline booking…"
        />
      </Field>
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Blocking…" : "Block dates"}
      </Button>
      {state.error && (
        <p className="type-body-md text-error w-full">{state.error}</p>
      )}
      {state.done && !state.error && (
        <p className="type-body-md w-full rounded border border-sage/40 bg-sage-container/50 px-4 py-2">
          Dates blocked.
        </p>
      )}
    </form>
  );
}
