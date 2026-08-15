/**
 * Phase 6 proof: the booking status machine + date release.
 * Run: npx tsx prisma/verify-transitions.ts
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { createBooking } from "../src/server/booking/create";
import { transitionBooking } from "../src/server/booking/transitions";

const EMAIL = "transitions-tester@example.com";

async function cleanup() {
  await db.booking.deleteMany({ where: { guestEmail: EMAIL } });
  await db.verificationToken.deleteMany({ where: { identifier: EMAIL } });
  await db.user.deleteMany({ where: { email: EMAIL } });
}

async function main() {
  await cleanup();
  const results: string[] = [];
  let failed = false;
  const check = (ok: boolean, name: string) => {
    results.push(`${ok ? "✓" : "✗"} ${name}`);
    failed ||= !ok;
  };

  const base = {
    slug: "old-quebec-pied-a-terre",
    guestCount: 2,
    guestName: "Transition Tester",
    guestEmail: EMAIL,
    guestPhone: "+1 555 020 0000",
    marketingOptIn: false,
  };

  // pending → confirmed
  const r1 = await createBooking({
    ...base,
    checkIn: "2027-08-01",
    checkOut: "2027-08-04",
  });
  if (!r1.ok) throw new Error(`setup failed: ${r1.error}`);
  const t1 = await transitionBooking(r1.bookingId, "confirm");
  const b1 = await db.booking.findUnique({ where: { id: r1.bookingId } });
  check(t1.ok && b1?.status === "confirmed", "pending → confirmed");

  // confirmed → decline must fail (invalid transition)
  const t2 = await transitionBooking(r1.bookingId, "decline");
  check(!t2.ok, "confirmed → decline rejected (invalid transition)");

  // confirmed → cancelled, and the dates are released
  const t3 = await transitionBooking(r1.bookingId, "cancel", "test note");
  const b3 = await db.booking.findUnique({ where: { id: r1.bookingId } });
  check(
    t3.ok && b3?.status === "cancelled" && b3.statusNote === "test note",
    "confirmed → cancelled with note"
  );
  const rebook = await createBooking({
    ...base,
    checkIn: "2027-08-01",
    checkOut: "2027-08-04",
  });
  check(rebook.ok, "cancelled dates immediately rebookable");

  // pending → declined releases dates too
  const t4 = await transitionBooking(
    rebook.ok ? rebook.bookingId : "",
    "decline",
    "went with another party"
  );
  const b4 = rebook.ok
    ? await db.booking.findUnique({ where: { id: rebook.bookingId } })
    : null;
  check(t4.ok && b4?.status === "declined", "pending → declined");

  await cleanup();
  results.push("· test rows cleaned up");
  console.log(results.join("\n"));
  if (failed) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
