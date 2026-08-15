import { db } from "@/lib/db";
import { todayUTC } from "@/lib/dates";
import { sweepCompleted } from "@/server/booking/transitions";
import type { BookingStatus, Prisma } from "@prisma/client";

/** Dashboard stat cards (mock 7). */
export async function getDashboardStats() {
  await sweepCompleted();
  const today = todayUTC();
  const [activeProperties, upcoming, pending] = await Promise.all([
    db.property.count({ where: { status: "active" } }),
    db.booking.count({
      where: { status: "confirmed", checkIn: { gte: today } },
    }),
    db.booking.count({ where: { status: "pending" } }),
  ]);
  return { activeProperties, upcoming, pending };
}

const adminBookingInclude = {
  property: { select: { title: true, slug: true } },
} satisfies Prisma.BookingInclude;

export type AdminBookingTab =
  | "all"
  | "pending"
  | "confirmed"
  | "upcoming"
  | "completed"
  | "cancelled";

export async function listAdminBookings(
  tab: AdminBookingTab,
  propertyId?: string
) {
  await sweepCompleted();
  const today = todayUTC();
  const where: Prisma.BookingWhereInput = {
    ...(propertyId ? { propertyId } : {}),
    ...(tab === "pending" && { status: "pending" as BookingStatus }),
    ...(tab === "confirmed" && { status: "confirmed" as BookingStatus }),
    ...(tab === "completed" && { status: "completed" as BookingStatus }),
    ...(tab === "cancelled" && {
      status: { in: ["cancelled", "declined"] as BookingStatus[] },
    }),
    ...(tab === "upcoming" && {
      status: { in: ["pending", "confirmed"] as BookingStatus[] },
      checkIn: { gte: today },
    }),
  };
  return db.booking.findMany({
    where,
    include: adminBookingInclude,
    orderBy: [{ checkIn: "asc" }],
    take: 200,
  });
}

export function getAdminBooking(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: {
      property: { select: { title: true, slug: true, location: true } },
      user: { select: { id: true, accountStatus: true } },
    },
  });
}

/** Upcoming table on the dashboard. */
export function listUpcomingBookings(limit = 8) {
  return db.booking.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      checkOut: { gte: todayUTC() },
    },
    include: adminBookingInclude,
    orderBy: { checkIn: "asc" },
    take: limit,
  });
}

export function listAdminProperties() {
  return db.property.findMany({
    include: {
      images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function getAdminProperty(id: string) {
  return db.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { select: { amenityId: true } },
    },
  });
}

export function listAmenities() {
  return db.amenity.findMany({ orderBy: { sortOrder: "asc" } });
}

/** Customers with booking aggregates (PRD §45). */
export async function listCustomers() {
  const users = await db.user.findMany({
    where: { role: "guest" },
    include: {
      bookings: {
        select: { checkOut: true, status: true },
        orderBy: { checkOut: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    accountStatus: u.accountStatus,
    marketingOptIn: u.marketingOptIn,
    bookingCount: u.bookings.length,
    lastStay:
      u.bookings.find((b) => ["completed", "confirmed"].includes(b.status))
        ?.checkOut ?? null,
  }));
}

export function getCustomer(id: string) {
  return db.user.findUnique({
    where: { id, role: "guest" },
    include: {
      bookings: {
        include: { property: { select: { title: true } } },
        orderBy: { checkIn: "desc" },
      },
    },
  });
}

export function listAdminReviews(propertyId?: string) {
  return db.review.findMany({
    where: propertyId ? { propertyId } : {},
    include: { property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function listBlocks(propertyId: string) {
  return db.availabilityBlock.findMany({
    where: { propertyId, endDate: { gte: todayUTC() } },
    orderBy: { startDate: "asc" },
  });
}
