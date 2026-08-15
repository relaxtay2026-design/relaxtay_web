import { nightsBetween } from "@/lib/dates";

export type QuoteLine = { label: string; amountCents: number };

export type Quote = {
  nights: number;
  nightlyPriceCents: number;
  currency: string;
  lines: QuoteLine[];
  totalCents: number;
};

/**
 * THE only place price math lives (PRD §5.5). The booking form, the
 * property page, and createBooking all render/persist this output.
 * Line-item shape from day one so V1.1 fees/taxes are additive.
 */
export function quote(
  property: { priceCents: number; currency: string },
  checkIn: Date,
  checkOut: Date
): Quote {
  const nights = nightsBetween(checkIn, checkOut);
  const stay = nights * property.priceCents;
  const lines: QuoteLine[] = [
    {
      label: `${nights} night${nights === 1 ? "" : "s"}`,
      amountCents: stay,
    },
  ];
  return {
    nights,
    nightlyPriceCents: property.priceCents,
    currency: property.currency,
    lines,
    totalCents: lines.reduce((sum, l) => sum + l.amountCents, 0),
  };
}
