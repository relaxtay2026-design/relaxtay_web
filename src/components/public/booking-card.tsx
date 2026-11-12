"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { formatMoney } from "@/lib/money";
import {
  parseDateOnly,
  toDateOnlyString,
  nightsBetween,
  eachNight,
  addDays,
  todayUTC,
  pickerDayToDateOnly,
  dateOnlyToPickerDay,
} from "@/lib/dates";
import { MAX_ADVANCE_DAYS, MAX_NIGHTS } from "@/lib/booking-limits";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Availability = { unavailable: string[]; minNights: number };

/** Friendly copy for ?be= codes bounced back from /booking (impr. #3). */
const BOUNCE_ERRORS: Record<string, string> = {
  unavail: "Those dates are no longer available — please pick different dates.",
  past: "Check-in can't be in the past — please pick new dates.",
  order: "Check-out must be after check-in.",
  min: "Those dates are under this property's minimum stay.",
  dates: "Please select your dates to continue.",
  max: `Stays are limited to ${MAX_NIGHTS} nights per request — for longer, please contact us.`,
  far: "Those dates are too far ahead — please pick an earlier stay.",
};

/**
 * Sticky booking card (PRD §16/§17). Availability problems surface as a
 * small inline notice right here — never a full error page. The CTA
 * re-checks live availability before navigating (impr. #3).
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
  const router = useRouter();
  const [availability, setAvailability] = React.useState<Availability | null>(
    null
  );
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [guests, setGuests] = React.useState(2);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  const loadAvailability = React.useCallback(async (): Promise<
    Availability | null
  > => {
    try {
      const r = await fetch(`/api/availability/${propertyId}`, {
        cache: "no-store",
      });
      if (!r.ok) return null;
      const data = (await r.json()) as Availability;
      setAvailability(data);
      return data;
    } catch {
      return null;
    }
  }, [propertyId]);

  React.useEffect(() => {
    loadAvailability();
    // Came back from /booking with a problem? Show it here, quietly.
    const params = new URLSearchParams(window.location.search);
    const be = params.get("be");
    if (be && BOUNCE_ERRORS[be]) {
      setError(BOUNCE_ERRORS[be]);
      setCalendarOpen(true);
      // The page renders two cards (sidebar on desktop, inline on phones)
      // and both must read ?be= before it is cleared, or the phone card —
      // the visible one there — never shows the message.
      const timer = setTimeout(() => {
        const now = new URLSearchParams(window.location.search);
        if (!now.has("be")) return;
        now.delete("be");
        const qs = now.toString();
        window.history.replaceState(
          null,
          "",
          window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loadAvailability]);

  // The server's calendar runs on UTC dates; these are the same days as the
  // picker shows them (see pickerDayToDateOnly in lib/dates).
  /** First day a stay can start: today, by the server's calendar. */
  const firstBookableDay = React.useMemo(
    () => dateOnlyToPickerDay(toDateOnlyString(todayUTC()))!,
    []
  );
  /** Latest check-out the server accepts (MAX_ADVANCE_DAYS from today). */
  const lastBookableDay = React.useMemo(
    () =>
      dateOnlyToPickerDay(
        toDateOnlyString(addDays(todayUTC(), MAX_ADVANCE_DAYS))
      )!,
    []
  );

  const disabled = React.useMemo(() => {
    const days = (availability?.unavailable ?? [])
      .map(dateOnlyToPickerDay)
      .filter((d): d is Date => d !== null);
    return [{ before: firstBookableDay }, { after: lastBookableDay }, ...days];
  }, [availability, firstBookableDay, lastBookableDay]);

  /** The picked stay as server dates (UTC midnight), or null. */
  const stay = React.useMemo(() => {
    if (!range?.from || !range?.to) return null;
    const checkIn = parseDateOnly(pickerDayToDateOnly(range.from));
    const checkOut = parseDateOnly(pickerDayToDateOnly(range.to));
    return checkIn && checkOut ? { checkIn, checkOut } : null;
  }, [range]);

  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
  const validStay = nights >= minNights;

  // Bring any problem into view at once — the card can be below the fold
  // on a phone, or the message below the calendar.
  const errorRef = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(() => {
    if (error)
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  /**
   * Every rule the booking page enforces, checked here first so a problem
   * shows instantly in the card instead of after a reload.
   */
  function stayProblem(): string | null {
    if (!stay) return BOUNCE_ERRORS.dates;
    const today = todayUTC();
    if (stay.checkIn < today) return BOUNCE_ERRORS.past;
    if (stay.checkOut <= stay.checkIn) return BOUNCE_ERRORS.order;
    if (stay.checkOut > addDays(today, MAX_ADVANCE_DAYS))
      return BOUNCE_ERRORS.far;
    if (nights > MAX_NIGHTS) return BOUNCE_ERRORS.max;
    if (!validStay) return `Minimum stay is ${minNights} nights for this property.`;
    return null;
  }

  /** Fast client-side + fresh-fetch validation before navigating. */
  async function requestStay() {
    setError(null);
    const problem = stayProblem();
    if (problem || !stay) {
      setError(problem ?? BOUNCE_ERRORS.dates);
      setCalendarOpen(true);
      return;
    }
    setChecking(true);
    const fresh = (await loadAvailability()) ?? availability;
    setChecking(false);
    if (fresh) {
      const taken = new Set(fresh.unavailable);
      const clash = eachNight(stay.checkIn, stay.checkOut).some((n) =>
        taken.has(n)
      );
      if (clash) {
        setError(BOUNCE_ERRORS.unavail);
        setRange(undefined);
        setCalendarOpen(true);
        return;
      }
    }
    router.push(
      `/booking/${slug}?checkIn=${toDateOnlyString(stay.checkIn)}&checkOut=${toDateOnlyString(stay.checkOut)}&guests=${guests}`
    );
  }

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
              onSelect={(r) => {
                setRange(r);
                setError(null);
              }}
              disabled={disabled}
              excludeDisabled
              min={minNights}
              max={MAX_NIGHTS}
              endMonth={lastBookableDay}
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

        {error && (
          <p
            ref={errorRef}
            role="alert"
            className="type-body-md mt-4 rounded border border-error/30 bg-error-container/40 px-3 py-2.5 text-on-error-container"
          >
            {error}
          </p>
        )}

        <Button
          onClick={requestStay}
          disabled={checking}
          className="mt-6 w-full"
          size="md"
        >
          {checking ? "Checking dates…" : "Request this stay"}
        </Button>
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
