/**
 * Proof for booking reference allocation: many bookings in a row and many
 * at the same moment must all succeed with unique references.
 * 1. 100 sequential requests on non-overlapping dates → 100 bookings.
 * 2. 25 simultaneous requests on non-overlapping dates → 25 bookings.
 * 3. Every reference is unique and matches PREFIX-NNNNNN.
 * Cleans up after itself. Run: npx tsx prisma/verify-booking-codes.ts
 */
import "dotenv/config";
import { createBooking } from "../src/server/booking/create";
import { db } from "../src/lib/db";
import { brand } from "../src/lib/brand";
import { addDays, todayUTC, toDateOnlyString } from "../src/lib/dates";
import { MAX_ADVANCE_DAYS } from "../src/lib/booking-limits";

const EMAIL_DOMAIN = "@codes-test.example.com";

async function main() {
  const SEQ = 100;
  const PAR = 25;

  // Back-to-back stays on the shortest-stay property, starting well after
  // the seed data and ending inside the booking horizon.
  const property = await db.property.findFirst({
    where: { status: "active" },
    orderBy: { minNights: "asc" },
  });
  if (!property) throw new Error("No active property — run the seed first.");
  const stay = Math.max(property.minNights, 1);
  const START_OFFSET = 90;
  if (START_OFFSET + (SEQ + PAR) * stay > MAX_ADVANCE_DAYS)
    throw new Error("Not enough room in the booking horizon for this test.");
  const start = addDays(todayUTC(), START_OFFSET);
  const request = (i: number) =>
    createBooking({
      slug: property.slug,
      checkIn: toDateOnlyString(addDays(start, i * stay)),
      checkOut: toDateOnlyString(addDays(start, (i + 1) * stay)),
      guestCount: 1,
      guestName: "Code Tester",
      guestEmail: `guest-${i}${EMAIL_DOMAIN}`,
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
    let seqOk = 0;
    for (let i = 0; i < SEQ; i++) if ((await request(i)).ok) seqOk++;
    report(seqOk === SEQ, `Test 1: ${seqOk}/${SEQ} sequential bookings created`);

    const par = await Promise.all(
      Array.from({ length: PAR }, (_, k) => request(SEQ + k))
    );
    const parOk = par.filter((r) => r.ok).length;
    report(parOk === PAR, `Test 2: ${parOk}/${PAR} simultaneous bookings created`);

    const rows = await db.booking.findMany({
      where: { guestEmail: { endsWith: EMAIL_DOMAIN } },
      select: { code: true },
    });
    const codes = rows.map((r) => r.code);
    const shape = new RegExp(`^${brand.bookingPrefix}-\\d{6}$`);
    report(
      new Set(codes).size === codes.length && codes.every((c) => shape.test(c)),
      `Test 3: ${codes.length} references, all unique and well-formed (e.g. ${codes[0]})`
    );
  } finally {
    await db.booking.deleteMany({
      where: { guestEmail: { endsWith: EMAIL_DOMAIN } },
    });
    await db.verificationToken.deleteMany({
      where: { identifier: { endsWith: EMAIL_DOMAIN } },
    });
    await db.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await db.$disconnect();
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
