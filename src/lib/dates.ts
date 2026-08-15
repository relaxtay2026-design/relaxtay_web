/**
 * All booking dates are DATE-ONLY, treated as UTC midnight throughout
 * (Postgres @db.Date ↔ JS Date at 00:00Z ↔ "YYYY-MM-DD" strings).
 * Half-open convention everywhere: [checkIn, checkOut) — checkout day free.
 */

/** "YYYY-MM-DD" → Date at UTC midnight. Returns null for invalid input. */
export function parseDateOnly(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "YYYY-MM-DD" (UTC). */
export function toDateOnlyString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today at UTC midnight. */
export function todayUTC(): Date {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  return t;
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** Whole nights between check-in and check-out (half-open). */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

/** Every occupied night of [start, end) as "YYYY-MM-DD". */
export function eachNight(start: Date, end: Date): string[] {
  const out: string[] = [];
  for (let d = new Date(start); d < end; d = addDays(d, 1)) {
    out.push(toDateOnlyString(d));
  }
  return out;
}

/** "Aug 20 – Aug 24, 2026" for confirmations and emails. */
export function formatDateRange(checkIn: Date, checkOut: Date): string {
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-CA", {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });
  return `${fmt(checkIn, false)} – ${fmt(checkOut, true)}`;
}
