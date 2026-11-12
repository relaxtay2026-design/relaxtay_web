import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { todayUTC } from "@/lib/dates";
import { PENDING_EXPIRY_HOURS } from "@/lib/booking-limits";
import {
  BookingConfirmedEmail,
  BookingDeclinedEmail,
  BookingCancelledEmail,
} from "@/components/email/booking-status";

/**
 * The status machine (PRD §5.4). Every transition is validated against
 * the current status and emails the guest. Manager-only — callers gate
 * with requireManager().
 */
export type TransitionResult = { ok: true } | { ok: false; error: string };

type Action = "confirm" | "decline" | "cancel";

const ALLOWED: Record<Action, string[]> = {
  confirm: ["pending"],
  decline: ["pending"],
  cancel: ["pending", "confirmed"],
};

const TARGET: Record<Action, "confirmed" | "declined" | "cancelled"> = {
  confirm: "confirmed",
  decline: "declined",
  cancel: "cancelled",
};

export async function transitionBooking(
  bookingId: string,
  action: Action,
  note?: string
): Promise<TransitionResult> {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { select: { title: true, location: true } },
      user: { select: { email: true } },
    },
  });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (!ALLOWED[action].includes(booking.status))
    return {
      ok: false,
      error: `A ${booking.status} booking cannot be ${TARGET[action]}.`,
    };

  const updated = await db.booking.update({
    where: { id: booking.id, status: booking.status }, // optimistic guard
    data: {
      status: TARGET[action],
      statusNote: note?.trim() || null,
      // Shows on the guest's side as an update until they have seen it
      guestUpdateAt: new Date(),
    },
  });

  const b = {
    code: updated.code,
    propertyTitle: booking.property.title,
    propertyLocation: booking.property.location,
    guestName: updated.guestName,
    guestCount: updated.guestCount,
    checkIn: updated.checkIn,
    checkOut: updated.checkOut,
    totalCents: updated.totalCents,
    currency: updated.currency,
  };
  const email =
    action === "confirm" ? (
      <BookingConfirmedEmail b={b} />
    ) : action === "decline" ? (
      <BookingDeclinedEmail b={b} note={note} />
    ) : (
      <BookingCancelledEmail b={b} note={note} />
    );
  const subject =
    action === "confirm"
      ? `Your stay is confirmed — ${booking.property.title}`
      : action === "decline"
        ? `About your request — ${booking.property.title}`
        : `Reservation cancelled — ${updated.code}`;

  // The guest, and the account holder when they booked for someone else
  const recipients = [
    ...new Set([updated.guestEmail, booking.user?.email?.toLowerCase()]),
  ].filter((to): to is string => !!to);
  await Promise.all(
    recipients.map((to) => sendEmail({ to, subject, react: email }))
  );
  return { ok: true };
}

/**
 * Lazy sweep (PRD §5.4): confirmed stays whose checkout has passed become
 * completed. Called from admin queries — cheap, idempotent.
 */
export async function sweepCompleted(): Promise<void> {
  await db.booking.updateMany({
    where: { status: "confirmed", checkOut: { lt: todayUTC() } },
    data: { status: "completed" },
  });
}

/** Shown to the manager as the status note and to the guest in the email. */
export const EXPIRED_NOTE = `the request expired after ${PENDING_EXPIRY_HOURS} hours without a confirmation`;

/**
 * Lazy sweep: a pending request nobody answered within PENDING_EXPIRY_HOURS
 * is declined, the guest is emailed, and its dates open up again. Without
 * this a request holds the calendar forever. Called wherever availability
 * is read or written — cheap (indexed) and idempotent.
 */
export async function expireStalePending(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - PENDING_EXPIRY_HOURS * 3_600_000);
    const stale = await db.booking.findMany({
      where: { status: "pending", createdAt: { lt: cutoff } },
      select: { id: true },
      take: 50,
    });
    for (const { id } of stale) {
      try {
        await transitionBooking(id, "decline", EXPIRED_NOTE);
      } catch (e) {
        // Lost a race with the manager or another sweep — already handled.
        console.warn(`[booking] expiry of ${id} skipped:`, e);
      }
    }
  } catch (e) {
    // Housekeeping must never break the request that triggered it.
    console.error("[booking] expiry sweep failed:", e);
  }
}
