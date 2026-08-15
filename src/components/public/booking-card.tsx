"use client";

import * as React from "react";
import Link from "next/link";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { formatMoney } from "@/lib/money";
import { parseDateOnly, toDateOnlyString, nightsBetween } from "@/lib/dates";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Availability = { unavailable: string[]; minNights: number };

/**
 * Sticky booking card (PRD §16/§17): live availability calendar with
 * unavailable nights disabled, client-side quote for display only —
 * the server recomputes everything at request time.
 */
export function BookingCard({
  propertyId,
  slug,
  priceCents,
  currency,
  maxGuests,
  minNights,
}: {
  propertyId: string;
  slug: string;
  priceCents: number;
  currency: string;
  maxGuests: number;
  minNights: number;
}) {
  const [availability, setAvailability] = React.useState<Availability | null>(
    null
  );
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [guests, setGuests] = React.useState(2);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    fetch(`/api/availability/${propertyId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => alive && data && setAvailability(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [propertyId]);

  const disabled = React.useMemo(() => {
    const days = (availability?.unavailable ?? [])
      .map(parseDateOnly)
      .filter((d): d is Date => d !== null);
    return [{ before: new Date() }, ...days];
  }, [availability]);

  const nights =
    range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const validStay = nights >= minNights;
  const bookingHref =
    range?.from && range?.to && validStay
      ? `/booking/${slug}?checkIn=${toDateOnlyString(range.from)}&checkOut=${toDateOnlyString(range.to)}&guests=${guests}`
      : null;

  const fmtField = (d: Date | undefined) =>
    d
      ? d.toLocaleDateString("en-CA", { month: "short", day: "numeric" })
      : "Select date";

  return (
    <Card>
      <CardSection>
        <p>
          <span className="font-display text-3xl">
            {formatMoney(priceCents, currency)}
          </span>
          <span className="type-body-md text-muted"> / night</span>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <Label>Check-in</Label>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              className={cn(
                "type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-4 text-left",
                "focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze",
                !range?.from && "text-muted/70"
              )}
            >
              {fmtField(range?.from)}
            </button>
          </div>
          <div>
            <Label>Check-out</Label>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              className={cn(
                "type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-4 text-left",
                "focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze",
                !range?.to && "text-muted/70"
              )}
            >
              {fmtField(range?.to)}
            </button>
          </div>
        </div>

        {calendarOpen && (
          <div className="mt-4 rounded border border-border-ghost p-3">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={disabled}
              excludeDisabled
              min={minNights}
              numberOfMonths={1}
              className="rdp-lumiere mx-auto"
            />
            {minNights > 1 && (
              <p className="type-label text-muted mt-2 text-center">
                Minimum stay: {minNights} nights
              </p>
            )}
          </div>
        )}

        <div className="mt-3">
          <Label htmlFor="bc-guests">Guests</Label>
          <select
            id="bc-guests"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value, 10))}
            className="type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} guest{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>

        {bookingHref ? (
          <Link
            href={bookingHref}
            className={cn(buttonVariants({ size: "md" }), "mt-6 w-full")}
          >
            Request this stay
          </Link>
        ) : (
          <button
            disabled
            className={cn(buttonVariants({ size: "md" }), "mt-6 w-full")}
          >
            {range?.from && range?.to && !validStay
              ? `Minimum ${minNights} nights`
              : "Select dates"}
          </button>
        )}
        <p className="type-label text-muted mt-4 text-center">
          You won&apos;t be charged yet — we confirm personally
        </p>

        {nights > 0 && validStay && (
          <>
            <Divider className="my-5" />
            <div className="flex justify-between">
              <p className="type-body-md text-muted">
                {nights} night{nights === 1 ? "" : "s"} ×{" "}
                {formatMoney(priceCents, currency)}
              </p>
              <p className="type-body-md">
                {formatMoney(nights * priceCents, currency)}
              </p>
            </div>
            <div className="mt-2 flex justify-between">
              <p className="type-body-md font-medium">Total</p>
              <p className="type-body-md font-medium">
                {formatMoney(nights * priceCents, currency)}
              </p>
            </div>
          </>
        )}
      </CardSection>
    </Card>
  );
}
