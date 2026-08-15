/**
 * Phase 4 proof: createBooking end-to-end against Neon + Resend.
 * 1. Valid request → pending booking created, customer upserted, emails sent.
 * 2. Same dates again → friendly "dates taken" error (constraint path).
 * 3. Under-min-nights and over-capacity rejected.
 * Cleans up after itself. Run: npx tsx prisma/verify-booking-flow.ts
 */
import "dotenv/config";
import { createBooking } from "../src/server/booking/create";
import { db } from "../src/lib/db";

async function main() {
  const base = {
    slug: "cedar-and-stone-cabin",
    guestCount: 2,
    guestName: "Flow Tester",
    guestEmail: "flow-tester@example.com",
    guestPhone: "+1 555 010 0000",
    guestMessage: "Integration test booking.",
    marketingOptIn: true,
  };
  const checkIn = "2027-03-10";
  const checkOut = "2027-03-14";
  const results: string[] = [];
  let failed = false;

  const r1 = await createBooking({ ...base, checkIn, checkOut });
  if (r1.ok) {
    const b = await db.booking.findUnique({
      where: { id: r1.bookingId },
      include: { user: true },
    });
    const okShape =
      b?.status === "pending" &&
      b.totalCents === 4 * 28500 &&
      b.user?.email === "flow-tester@example.com" &&
      b.user.marketingOptIn === true;
    results.push(
      okShape
        ? `✓ Test 1: booking ${b.code} pending, total $${b.totalCents / 100}, customer linked + opted in`
        : "✗ TEST 1 FAILED: booking created but shape wrong"
    );
    failed ||= !okShape;
  } else {
    results.push(`✗ TEST 1 FAILED: ${r1.error}`);
    failed = true;
  }

  const r2 = await createBooking({ ...base, checkIn, checkOut });
  if (!r2.ok && r2.error.includes("no longer available")) {
    results.push("✓ Test 2: double-booking rejected with friendly error");
  } else {
    results.push("✗ TEST 2 FAILED: duplicate dates were accepted");
    failed = true;
  }

  const r3 = await createBooking({
    ...base,
    checkIn: "2027-04-01",
    checkOut: "2027-04-02", // 1 night < minNights 2
  });
  if (!r3.ok && r3.error.includes("minimum stay")) {
    results.push("✓ Test 3: minimum-stay rule enforced");
  } else {
    results.push("✗ TEST 3 FAILED: under-min stay accepted");
    failed = true;
  }

  const r4 = await createBooking({
    ...base,
    guestCount: 9, // cabin max 4
    checkIn: "2027-05-01",
    checkOut: "2027-05-05",
  });
  if (!r4.ok && r4.error.includes("accommodate")) {
    results.push("✓ Test 4: over-capacity rejected");
  } else {
    results.push("✗ TEST 4 FAILED: over-capacity accepted");
    failed = true;
  }

  // Cleanup
  await db.booking.deleteMany({
    where: { guestEmail: "flow-tester@example.com" },
  });
  await db.user.deleteMany({ where: { email: "flow-tester@example.com" } });
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
