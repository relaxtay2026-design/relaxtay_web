/**
 * Money is integer cents + ISO-4217 currency everywhere (PRD D3).
 * Formatting happens ONLY here, at the display edge.
 */
export function formatMoney(
  cents: number,
  currency: string,
  opts: { withCents?: boolean } = {}
) {
  const { withCents = false } = opts;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(cents / 100);
}

/** "$420 / night" — the recurring display unit across cards and booking UI. */
export function formatNightly(cents: number, currency: string) {
  return `${formatMoney(cents, currency)} / night`;
}
