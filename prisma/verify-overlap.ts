/**
 * Phase 2 proof: the booking_no_overlap exclusion constraint.
 * 1. Overlap with an existing confirmed booking → must be REJECTED.
 * 2. Two concurrent inserts for the same free range → exactly ONE wins.
 * 3. Overlap with a cancelled booking's dates → must SUCCEED (cleaned up after).
 * Run: npx tsx prisma/verify-overlap.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function daysFromNow(d: number) {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() + d);
  return t;
}

const mk = (code: string, propertyId: string, inDays: number, nights: number) => ({
  code,
  propertyId,
  guestName: "Constraint Tester",
  guestEmail: "tester@example.com",
  guestPhone: "+1 555 000 0000",
  guestCount: 2,
  checkIn: daysFromNow(inDays),
  checkOut: daysFromNow(inDays + nights),
  nightlyPriceCents: 10000,
  totalCents: 10000 * nights,
  currency: "USD",
});

async function main() {
  const results: string[] = [];
  let failed = false;

  // Muskoka has LUM-10002 confirmed at days 14–19 and LUM-10004 cancelled at 40–44
  const muskoka = await db.property.findUniqueOrThrow({
    where: { slug: "muskoka-lakeside-villa" },
  });

  // Test 1: overlap an existing confirmed booking (16–20 vs 14–19)
  try {
    await db.booking.create({ data: mk("TEST-0001", muskoka.id, 16, 4) });
    results.push("✗ TEST 1 FAILED: overlapping booking was ACCEPTED");
    failed = true;
  } catch {
    results.push("✓ Test 1: overlap with confirmed booking rejected by Postgres");
  }

  // Test 2: two concurrent inserts for the same free range (60–64)
  const [a, b] = await Promise.allSettled([
    db.booking.create({ data: mk("TEST-0002", muskoka.id, 60, 4) }),
    db.booking.create({ data: mk("TEST-0003", muskoka.id, 60, 4) }),
  ]);
  const wins = [a, b].filter((r) => r.status === "fulfilled").length;
  if (wins === 1) {
    results.push("✓ Test 2: concurrent race — exactly one of two identical bookings won");
  } else {
    results.push(`✗ TEST 2 FAILED: expected 1 winner, got ${wins}`);
    failed = true;
  }

  // Test 3: cancelled bookings must NOT hold dates (LUM-10004 at 40–44)
  try {
    await db.booking.create({ data: mk("TEST-0004", muskoka.id, 40, 4) });
    results.push("✓ Test 3: dates of a cancelled booking are bookable again");
  } catch {
    results.push("✗ TEST 3 FAILED: cancelled booking still blocks dates");
    failed = true;
  }

  // Cleanup all test rows
  await db.booking.deleteMany({ where: { code: { startsWith: "TEST-" } } });
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
