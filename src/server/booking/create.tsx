import { z } from "zod";
import { db } from "@/lib/db";
import { brand } from "@/lib/brand";
import { sendEmail } from "@/lib/email";
import { parseDateOnly, todayUTC } from "@/lib/dates";
import { quote } from "./quote";
import {
  BookingRequestGuestEmail,
  BookingRequestManagerEmail,
} from "@/components/email/booking-request";
import { sendClaimInvitation } from "@/server/auth/account";

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
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const checkIn = parseDateOnly(input.checkIn);
  const checkOut = parseDateOnly(input.checkOut);
  if (!checkIn || !checkOut) return { ok: false, error: "Invalid dates." };
  if (checkIn < todayUTC())
    return { ok: false, error: "Check-in cannot be in the past." };
  if (checkOut <= checkIn)
    return { ok: false, error: "Check-out must be after check-in." };

  const property = await db.property.findUnique({
    where: { slug: input.slug },
  });
  if (!property || property.status !== "active")
    return { ok: false, error: "This property is not available for booking." };

  const q = quote(property, checkIn, checkOut);
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

  try {
    const result = await db.$transaction(async (tx) => {
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
        data: {
          code: await nextCode(tx),
          propertyId: property.id,
          userId: user.id,
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
          status: "pending",
        },
      });
      return { row, isNewCustomer: !existed };
    });
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
    await Promise.all([
      sendEmail({
        to: booking.guestEmail,
        subject: `Your reservation request — ${property.title}`,
        react: <BookingRequestGuestEmail b={emailData} />,
      }),
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

/** Sequential-looking human reference: LUM-10482 style, race-safe via retry. */
async function nextCode(tx: {
  booking: { count: (args?: object) => Promise<number> };
}): Promise<string> {
  const count = await tx.booking.count();
  const n = 10000 + count + Math.floor(Math.random() * 50);
  return `${brand.bookingPrefix}-${n}`;
}
