/**
 * Proof for the booking guard rails (src/lib/booking-limits.ts).
 * 1. A stay longer than MAX_NIGHTS is rejected.
 * 2. A stay ending beyond MAX_ADVANCE_DAYS is rejected.
 * 3. One email can hold MAX_PENDING_PER_EMAIL open requests, not one more.
 * 4. A pending request older than PENDING_EXPIRY_HOURS is declined by the
 *    sweep and its dates become available again.
 * 5. The rate limiter allows `limit` hits per window, blocks the next,
 *    keeps subjects separate, and resets when the window lapses.
 * Cleans up after itself. Run: npx tsx prisma/verify-booking-limits.ts
 */
import "dotenv/config";
import { createBooking } from "../src/server/booking/create";
import { isRangeAvailable } from "../src/server/booking/availability";
import { rateLimit } from "../src/lib/rate-limit";
import { db } from "../src/lib/db";
import { addDays, todayUTC, toDateOnlyString } from "../src/lib/dates";
import {
  MAX_ADVANCE_DAYS,
  MAX_NIGHTS,
  MAX_PENDING_PER_EMAIL,
  PENDING_EXPIRY_HOURS,
} from "../src/lib/booking-limits";

const EMAIL = "limits-tester@limits-test.example.com";
const RL_ACTION = "verify-limits";

async function main() {
  const property = await db.property.findFirst({
    where: { status: "active" },
    orderBy: { minNights: "asc" },
  });
  if (!property) throw new Error("No active property — run the seed first.");
  const stay = Math.max(property.minNights, 1);
  const day = (n: number) => toDateOnlyString(addDays(todayUTC(), n));
  const request = (from: number, to: number, email = EMAIL) =>
    createBooking({
      slug: property.slug,
      checkIn: day(from),
      checkOut: day(to),
      guestCount: 1,
      guestName: "Limits Tester",
      guestEmail: email,
      guestPhone: "+1 555 010 0000",
      guestMessage: "",
      marketingOptIn: false,
    });

  let failed = false;
  const report = (ok: boolean, line: string) => {
    if (!ok) failed = true;
    console.log(`${ok ? "✓" : "✗"} ${line}`);
  };

  try {
    const tooLong = await request(200, 200 + MAX_NIGHTS + 1);
    report(
      !tooLong.ok && tooLong.error.includes(`${MAX_NIGHTS} nights`),
      `Test 1: ${MAX_NIGHTS + 1}-night stay rejected`
    );

    const tooFar = await request(MAX_ADVANCE_DAYS, MAX_ADVANCE_DAYS + stay);
    report(
      !tooFar.ok && tooFar.error.includes("too far ahead"),
      `Test 2: stay ending ${MAX_ADVANCE_DAYS + stay} days out rejected`
    );

    const base = 300;
    const made: string[] = [];
    for (let i = 0; i < MAX_PENDING_PER_EMAIL; i++) {
      const r = await request(base + i * stay, base + (i + 1) * stay);
      if (r.ok) made.push(r.bookingId);
    }
    const extra = await request(
      base + MAX_PENDING_PER_EMAIL * stay,
      base + (MAX_PENDING_PER_EMAIL + 1) * stay
    );
    report(
      made.length === MAX_PENDING_PER_EMAIL && !extra.ok,
      `Test 3: ${made.length} open requests accepted, the next one rejected`
    );

    // Age the first request past the expiry window, then read availability.
    const first = await db.booking.findUniqueOrThrow({ where: { id: made[0] } });
    await db.booking.update({
      where: { id: first.id },
      data: {
        createdAt: new Date(Date.now() - (PENDING_EXPIRY_HOURS + 1) * 3_600_000),
      },
    });
    const freed = await isRangeAvailable(
      property.id,
      first.checkIn,
      first.checkOut
    );
    const after = await db.booking.findUniqueOrThrow({ where: { id: first.id } });
    const others = await db.booking.count({
      where: { id: { in: made.slice(1) }, status: "pending" },
    });
    report(
      freed &&
        after.status === "declined" &&
        (after.statusNote ?? "").includes("expired") &&
        others === made.length - 1,
      `Test 4: stale request declined ("${after.statusNote}"), dates free again, fresh requests untouched`
    );

    const hit = (subject: string) =>
      rateLimit({ action: RL_ACTION, subject, limit: 5, windowSeconds: 3600 });
    const results: boolean[] = [];
    for (let i = 0; i < 6; i++) results.push((await hit("203.0.113.7")).ok);
    const otherSubject = (await hit("203.0.113.8")).ok;
    await db.$executeRaw`
      UPDATE "RateLimit" SET "windowStart" = "windowStart" - interval '2 hours'
      WHERE "key" LIKE ${RL_ACTION + ":%"}`;
    const afterWindow = (await hit("203.0.113.7")).ok;
    report(
      results.slice(0, 5).every(Boolean) &&
        results[5] === false &&
        otherSubject &&
        afterWindow,
      `Test 5: rate limit allows 5, blocks the 6th, separates subjects, resets after the window`
    );
  } finally {
    await db.booking.deleteMany({ where: { guestEmail: EMAIL } });
    await db.verificationToken.deleteMany({ where: { identifier: EMAIL } });
    await db.user.deleteMany({ where: { email: EMAIL } });
    await db.$executeRaw`DELETE FROM "RateLimit" WHERE "key" LIKE ${RL_ACTION + ":%"}`;
    await db.$disconnect();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
