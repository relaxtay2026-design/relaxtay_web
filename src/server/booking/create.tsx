import { randomInt } from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { sendEmail } from "@/lib/email";
import { addDays, parseDateOnly, todayUTC } from "@/lib/dates";
import {
  MAX_ADVANCE_DAYS,
  MAX_NIGHTS,
  MAX_PENDING_PER_EMAIL,
} from "@/lib/booking-limits";
import { quote } from "./quote";
import {
  BookingRequestGuestEmail,
  BookingRequestManagerEmail,
} from "@/components/email/booking-request";
import { sendClaimInvitation } from "@/server/auth/account";
import { expireStalePending } from "./transitions";

/** Input schema — shared by the server action (PRD §5.2). */
export const createBookingSchema = z.object({
  slug: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.coerce.number().int().min(1),
  guestName: z.string().trim().min(2).max(120),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().min(5).max(40),
  guestMessage: z.string().trim().max(2000).optional().or(z.literal("")),
  marketingOptIn: z.coerce.boolean().default(false),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

const DATES_TAKEN =
  "These dates are no longer available. Please choose different dates.";

/**
 * The booking transaction (PRD §5.2):
 * validate → price server-side → upsert customer → insert pending booking.
 * The DB exclusion constraint is the final arbiter of overlaps; the block
 * check runs inside the same transaction. Emails go out after commit and
 * never fail the booking.
 */
export async function createBooking(
  input: CreateBookingInput,
  /**
   * The signed-in account making the request, if any. The booking then
   * belongs to that account even when the form names someone else (a
   * friend or family member); the guest details stay as typed.
   */
  booker?: { id: string; email: string } | null
): Promise<CreateBookingResult> {
  const checkIn = parseDateOnly(input.checkIn);
  const checkOut = parseDateOnly(input.checkOut);
  if (!checkIn || !checkOut) return { ok: false, error: "Invalid dates." };
  if (checkIn < todayUTC())
    return { ok: false, error: "Check-in cannot be in the past." };
  if (checkOut <= checkIn)
    return { ok: false, error: "Check-out must be after check-in." };
  if (checkOut > addDays(todayUTC(), MAX_ADVANCE_DAYS))
    return {
      ok: false,
      error: "Those dates are too far ahead. Please choose an earlier stay.",
    };

  const property = await db.property.findUnique({
    where: { slug: input.slug },
  });
  if (!property || property.status !== "active")
    return { ok: false, error: "This property is not available for booking." };

  const q = quote(property, checkIn, checkOut);
  if (q.nights > MAX_NIGHTS)
    return {
      ok: false,
      error: `Stays are limited to ${MAX_NIGHTS} nights per request. For a longer stay, please contact us.`,
    };
  if (q.nights < property.minNights)
    return {
      ok: false,
      error: `This property has a minimum stay of ${property.minNights} nights.`,
    };
  if (input.guestCount > property.maxGuests)
    return {
      ok: false,
      error: `This property can accommodate up to ${property.maxGuests} guests.`,
    };

  const email = input.guestEmail.toLowerCase();

  // Free the dates of requests nobody answered in time before judging
  // availability, then cap how many open requests one email may hold.
  await expireStalePending();
  const openRequests = await db.booking.count({
    where: {
      status: "pending",
      OR: [{ guestEmail: email }, ...(booker ? [{ userId: booker.id }] : [])],
    },
  });
  if (openRequests >= MAX_PENDING_PER_EMAIL)
    return {
      ok: false,
      error: `You already have ${openRequests} requests waiting for our reply. We'll answer those first — you can send another once one is confirmed or declined.`,
    };

  const bookingData = (userId: string, code: string) => ({
    code,
    propertyId: property.id,
    userId,
    guestName: input.guestName,
    guestEmail: email,
    guestPhone: input.guestPhone,
    guestCount: input.guestCount,
    guestMessage: input.guestMessage || null,
    checkIn,
    checkOut,
    nightlyPriceCents: q.nightlyPriceCents,
    totalCents: q.totalCents,
    currency: q.currency,
    status: "pending" as const,
  });

  try {
    const book = () => db.$transaction(async (tx) => {
      // Blocks aren't covered by the exclusion constraint — check here,
      // inside the transaction (manager-only writes; race window ~nil).
      const block = await tx.availabilityBlock.findFirst({
        where: {
          propertyId: property.id,
          startDate: { lt: checkOut },
          endDate: { gt: checkIn },
        },
        select: { id: true },
      });
      if (block) throw new DatesTakenError();

      if (booker) {
        if (input.marketingOptIn)
          await tx.user.update({
            where: { id: booker.id },
            data: { marketingOptIn: true, marketingOptInAt: new Date() },
          });
        const row = await tx.booking.create({
          data: bookingData(booker.id, await nextCode(tx)),
        });
        return { row, isNewCustomer: false };
      }

      const existed = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      // Upsert customer by email (PRD §6.4 / §25)
      const user = await tx.user.upsert({
        where: { email },
        create: {
          name: input.guestName,
          email,
          phone: input.guestPhone,
          accountStatus: "unclaimed",
          marketingOptIn: input.marketingOptIn,
          marketingOptInAt: input.marketingOptIn ? new Date() : null,
        },
        // Existing customer: never overwrite profile from a booking form,
        // but a fresh opt-in is recorded (opt-OUT only via settings).
        update: input.marketingOptIn
          ? { marketingOptIn: true, marketingOptInAt: new Date() }
          : {},
      });

      // The exclusion constraint fires on overlap with pending/confirmed
      const row = await tx.booking.create({
        data: bookingData(user.id, await nextCode(tx)),
      });
      return { row, isNewCustomer: !existed };
    });
    const result = await withUniqueRetry(book);
    const booking = result.row;

    // Post-commit notifications — must not fail the booking
    const emailData = {
      code: booking.code,
      propertyTitle: property.title,
      propertyLocation: property.location,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      guestCount: booking.guestCount,
      guestMessage: booking.guestMessage,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: q.nights,
      totalCents: booking.totalCents,
      currency: booking.currency,
    };
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    // The guest, and the signed-in booker when they booked for someone else
    const guestRecipients = [
      ...new Set([booking.guestEmail, booker?.email.toLowerCase()]),
    ].filter((to): to is string => !!to);
    await Promise.all([
      ...guestRecipients.map((to) =>
        sendEmail({
          to,
          subject: `Your reservation request — ${property.title}`,
          react: <BookingRequestGuestEmail b={emailData} />,
        })
      ),
      sendEmail({
        to: process.env.MANAGER_EMAIL ?? brand.email,
        subject: `New booking request: ${property.title} (${booking.code})`,
        react: (
          <BookingRequestManagerEmail
            b={emailData}
            adminUrl={`${site}/admin/bookings/${booking.id}`}
          />
        ),
      }),
      // First booking from this email → invite them to claim the account
      // (PRD §25). Fire-and-forget like the rest.
      ...(result.isNewCustomer
        ? [sendClaimInvitation(booking.guestEmail, booking.guestName)]
        : []),
    ]);

    return { ok: true, bookingId: booking.id };
  } catch (e) {
    if (e instanceof DatesTakenError) return { ok: false, error: DATES_TAKEN };
    if (isOverlapViolation(e)) return { ok: false, error: DATES_TAKEN };
    console.error("[booking] create failed:", e);
    return {
      ok: false,
      error: "We couldn't complete your reservation. Please try again.",
    };
  }
}

class DatesTakenError extends Error {}

/** Postgres exclusion violation (23P01) surfaces via constraint name. */
function isOverlapViolation(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.message} ${JSON.stringify(e)}` : "";
  return msg.includes("booking_no_overlap") || msg.includes("23P01");
}

/**
 * Human booking reference, e.g. RLX-482915: prefix + 6 random digits.
 *
 * Random rather than counted: a reference derived from the booking count
 * lands in the same narrow range as its neighbours and collides with them.
 * A taken reference is skipped here; the rare case of two requests picking
 * the same free reference at the same instant is caught by the unique
 * index and retried by withUniqueRetry().
 */
async function nextCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const code = `${brand.bookingPrefix}-${randomInt(100_000, 1_000_000)}`;
    const taken = await tx.booking.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a free booking reference.");
}

const CODE_ATTEMPTS = 10;
const TRANSACTION_ATTEMPTS = 3;

/**
 * Re-run the booking transaction when it loses a race on a unique index
 * (Prisma P2002): two requests allocating the same reference, or two first
 * bookings from the same new email. A unique violation aborts the Postgres
 * transaction, so the retry has to be a fresh transaction.
 */
async function withUniqueRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (e) {
      if (attempt >= TRANSACTION_ATTEMPTS || !isUniqueViolation(e)) throw e;
    }
  }
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: unknown }).code === "P2002"
  );
}
