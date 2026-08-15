import { db } from "@/lib/db";
import { addDays, eachNight, todayUTC } from "@/lib/dates";

/**
 * A property's unavailable nights = union of
 *   1. nights held by pending/confirmed bookings
 *   2. nights covered by manager availability blocks (D4)
 * Half-open ranges throughout. Truth is enforced at write time by the
 * DB constraint — this feeds the calendar UI (informational, PRD §17).
 */
export async function getUnavailableDates(
  propertyId: string,
  horizonDays = 550
): Promise<string[]> {
  const from = todayUTC();
  const to = addDays(from, horizonDays);

  const [bookings, blocks] = await Promise.all([
    db.booking.findMany({
      where: {
        propertyId,
        status: { in: ["pending", "confirmed"] },
        checkIn: { lt: to },
        checkOut: { gt: from },
      },
      select: { checkIn: true, checkOut: true },
    }),
    db.availabilityBlock.findMany({
      where: { propertyId, startDate: { lt: to }, endDate: { gt: from } },
      select: { startDate: true, endDate: true },
    }),
  ]);

  const nights = new Set<string>();
  for (const b of bookings) {
    for (const n of eachNight(b.checkIn, b.checkOut)) nights.add(n);
  }
  for (const b of blocks) {
    for (const n of eachNight(b.startDate, b.endDate)) nights.add(n);
  }
  return [...nights].sort();
}

/** True if every night of [checkIn, checkOut) is free right now. */
export async function isRangeAvailable(
  propertyId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const [booking, block] = await Promise.all([
    db.booking.findFirst({
      where: {
        propertyId,
        status: { in: ["pending", "confirmed"] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { id: true },
    }),
    db.availabilityBlock.findFirst({
      where: {
        propertyId,
        startDate: { lt: checkOut },
        endDate: { gt: checkIn },
      },
      select: { id: true },
    }),
  ]);
  return booking === null && block === null;
}
