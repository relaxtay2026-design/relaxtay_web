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
