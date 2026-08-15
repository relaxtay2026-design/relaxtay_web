"use client";

import { useActionState } from "react";
import { savePropertyAction, type PropertyFormState } from "./actions";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/card";

const initial: PropertyFormState = { error: null };

type Amenity = { id: string; name: string };

type PropertyValues = {
  id?: string;
  title: string;
  location: string;
  summary: string;
  description: string;
  price: number; // dollars
  currency: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  minNights: number;
  status: string;
  amenityIds: string[];
};

const selectCls =
  "type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze";

/** Add/Edit form (mock 8): basic info → pricing & capacity → amenities. */
export function PropertyForm({
  values,
  amenities,
}: {
  values: PropertyValues;
  amenities: Amenity[];
}) {
  const [state, formAction, pending] = useActionState(
    savePropertyAction,
    initial
  );

  return (
    <form action={formAction} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <section>
        <h2 className="type-headline-md">Basic information</h2>
        <p className="type-body-md text-muted mt-1 mb-6">
          The primary details that define the listing.
        </p>
        <div className="space-y-6">
          <Field label="Property name" htmlFor="title">
            <Input
              id="title"
              name="title"
              required
              defaultValue={values.title}
              placeholder="e.g. The Glasshouse Retreat"
            />
          </Field>
          <Field label="Location" htmlFor="location">
            <Input
              id="location"
              name="location"
              required
              defaultValue={values.location}
              placeholder="City, Province"
            />
          </Field>
          <Field label="Short summary (cards & search)" htmlFor="summary">
            <Textarea
              id="summary"
              name="summary"
              required
              defaultValue={values.summary}
              className="min-h-20"
              placeholder="One or two sentences shown on property cards…"
            />
          </Field>
          <Field label="Full description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              required
              defaultValue={values.description}
              className="min-h-40"
              placeholder="Describe the atmosphere, architecture, and unique selling points…"
            />
          </Field>
        </div>
      </section>

      <Divider className="my-10" />

      <section>
        <h2 className="type-headline-md mb-6">Pricing &amp; capacity</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <Field label="Nightly rate" htmlFor="price">
            <Input
              id="price"
              name="price"
              type="number"
              min={1}
              step="0.01"
              required
              defaultValue={values.price || ""}
            />
          </Field>
          <Field label="Currency" htmlFor="currency">
            <select
              id="currency"
              name="currency"
              defaultValue={values.currency}
              className={selectCls}
            >
              <option value="USD">USD</option>
              <option value="CAD">CAD</option>
            </select>
          </Field>
          <Field label="Minimum nights" htmlFor="minNights">
            <Input
              id="minNights"
              name="minNights"
              type="number"
              min={1}
              required
              defaultValue={values.minNights}
            />
          </Field>
          <Field label="Max guests" htmlFor="maxGuests">
            <Input
              id="maxGuests"
              name="maxGuests"
              type="number"
              min={1}
              required
              defaultValue={values.maxGuests}
            />
          </Field>
          <Field label="Bedrooms" htmlFor="bedrooms">
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min={0}
              required
              defaultValue={values.bedrooms}
            />
          </Field>
          <Field label="Beds" htmlFor="beds">
            <Input
              id="beds"
              name="beds"
              type="number"
              min={1}
              required
              defaultValue={values.beds}
            />
          </Field>
          <Field label="Bathrooms" htmlFor="bathrooms">
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min={1}
              required
              defaultValue={values.bathrooms}
            />
          </Field>
          <Field label="Status" htmlFor="status">
            <select
              id="status"
              name="status"
              defaultValue={values.status}
              className={selectCls}
            >
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
            </select>
          </Field>
        </div>
      </section>

      <Divider className="my-10" />

      <section>
        <h2 className="type-headline-md mb-1">Amenities</h2>
        <p className="type-body-md text-muted mb-6">
          Select the features available at this property.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {amenities.map((a) => (
            <label key={a.id} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name="amenityIds"
                value={a.id}
                defaultChecked={values.amenityIds.includes(a.id)}
                className="h-4 w-4 accent-ink"
              />
              <span className="type-body-md">{a.name}</span>
            </label>
          ))}
        </div>
      </section>

      {state.error && (
        <p className="type-body-md mt-8 rounded border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container">
          {state.error}
        </p>
      )}

      <div className="mt-10 flex gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save property"}
        </Button>
      </div>
    </form>
  );
}
