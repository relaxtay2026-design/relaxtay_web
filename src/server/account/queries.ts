import { db } from "@/lib/db";
import { todayUTC } from "@/lib/dates";

const bookingInclude = {
  property: {
    select: {
      title: true,
      slug: true,
      location: true,
      images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
    },
  },
};

/**
 * A booking belongs to the account that made it: the signed-in booker, or,
 * for a booking made signed out, the account of the email on the form.
 * The guest email alone never grants access, so a friend someone booked
 * for does not see that booking in their own account.
 */
const ownedBy = (userId: string) => ({ userId });

/** All bookings belonging to a signed-in user. */
export function listUserBookings(userId: string) {
  return db.booking.findMany({
    where: ownedBy(userId),
    include: bookingInclude,
    orderBy: { checkIn: "desc" },
  });
}

/** Next upcoming stay for the dashboard hero (pending or confirmed). */
export function nextUpcomingBooking(userId: string) {
  return db.booking.findFirst({
    where: {
      ...ownedBy(userId),
      status: { in: ["pending", "confirmed"] },
      checkOut: { gte: todayUTC() },
    },
    include: bookingInclude,
    orderBy: { checkIn: "asc" },
  });
}

/** Single booking, ownership enforced (PRD §11 security). */
export function getUserBooking(id: string, userId: string) {
  return db.booking.findFirst({
    where: {
      id,
      ...ownedBy(userId),
    },
    include: bookingInclude,
  });
}

/** Status changes the guest hasn't seen yet (confirmed, declined, cancelled). */
export function listGuestUpdates(userId: string) {
  return db.booking.findMany({
    where: { ...ownedBy(userId), guestUpdateAt: { not: null } },
    select: {
      id: true,
      status: true,
      checkIn: true,
      checkOut: true,
      property: { select: { title: true } },
    },
    orderBy: { guestUpdateAt: "desc" },
    take: 20,
  });
}

export function countGuestUpdates(userId: string) {
  return db.booking.count({
    where: { ...ownedBy(userId), guestUpdateAt: { not: null } },
  });
}

/** The guest has now seen these bookings' current status. */
export function markGuestUpdatesSeen(
  userId: string,
  bookingIds: string[]
) {
  if (bookingIds.length === 0) return Promise.resolve({ count: 0 });
  return db.booking.updateMany({
    where: {
      ...ownedBy(userId),
      id: { in: bookingIds },
      guestUpdateAt: { not: null },
    },
    data: { guestUpdateAt: null },
  });
}
