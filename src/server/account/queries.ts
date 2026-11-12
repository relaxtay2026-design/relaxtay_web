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

/** All bookings belonging to a signed-in user (by id OR historical email). */
export function listUserBookings(userId: string, email: string) {
  return db.booking.findMany({
    where: { OR: [{ userId }, { guestEmail: email.toLowerCase() }] },
    include: bookingInclude,
    orderBy: { checkIn: "desc" },
  });
}

/** Next upcoming stay for the dashboard hero (pending or confirmed). */
export function nextUpcomingBooking(userId: string, email: string) {
  return db.booking.findFirst({
    where: {
      OR: [{ userId }, { guestEmail: email.toLowerCase() }],
      status: { in: ["pending", "confirmed"] },
      checkOut: { gte: todayUTC() },
    },
    include: bookingInclude,
    orderBy: { checkIn: "asc" },
  });
}

/** Single booking, ownership enforced (PRD §11 security). */
export function getUserBooking(id: string, userId: string, email: string) {
  return db.booking.findFirst({
    where: {
      id,
      OR: [{ userId }, { guestEmail: email.toLowerCase() }],
    },
    include: bookingInclude,
  });
}

const ownedBy = (userId: string, email: string) => ({
  OR: [{ userId }, { guestEmail: email.toLowerCase() }],
});

/** Status changes the guest hasn't seen yet (confirmed, declined, cancelled). */
export function listGuestUpdates(userId: string, email: string) {
  return db.booking.findMany({
    where: { ...ownedBy(userId, email), guestUpdateAt: { not: null } },
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

export function countGuestUpdates(userId: string, email: string) {
  return db.booking.count({
    where: { ...ownedBy(userId, email), guestUpdateAt: { not: null } },
  });
}

/** The guest has now seen these bookings' current status. */
export function markGuestUpdatesSeen(
  userId: string,
  email: string,
  bookingIds: string[]
) {
  if (bookingIds.length === 0) return Promise.resolve({ count: 0 });
  return db.booking.updateMany({
    where: {
      ...ownedBy(userId, email),
      id: { in: bookingIds },
      guestUpdateAt: { not: null },
    },
    data: { guestUpdateAt: null },
  });
}
