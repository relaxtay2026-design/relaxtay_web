import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { todayUTC } from "@/lib/dates";
import {
  expireStalePending,
  sweepCompleted,
} from "@/server/booking/transitions";
import type { BookingStatus, Prisma } from "@prisma/client";

/**
 * Admin data layer. Every function here starts with requireManager(), so the
 * data is protected even if a page forgets its own check (the admin layout
 * alone is not enough — layouts are skipped on client-side navigation).
 */

/** Dashboard stat cards (mock 7). */
export async function getDashboardStats() {
  await requireManager();
  await sweepCompleted();
  await expireStalePending();
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
  await requireManager();
  await sweepCompleted();
  await expireStalePending();
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
  const rows = await db.booking.findMany({
    where,
    include: adminBookingInclude,
    orderBy: [{ checkIn: "asc" }],
    take: 200,
  });
  // Whatever is waiting on the manager goes first, newest request on top,
  // so a new request is never buried under older stays. The rest keeps its
  // stay-date order.
  const waiting = rows
    .filter(needsManagerAction)
    .sort((a, b) => waitingSince(b) - waitingSince(a));
  return [...waiting, ...rows.filter((b) => !needsManagerAction(b))];
}

type AttentionFields = {
  status: BookingStatus;
  createdAt: Date;
  cancellationRequestedAt: Date | null;
};

/** A request to approve, or a guest's cancellation request to act on. */
export function needsManagerAction(b: AttentionFields): boolean {
  if (b.status === "pending") return true;
  return b.status === "confirmed" && b.cancellationRequestedAt !== null;
}

function waitingSince(b: AttentionFields): number {
  return (b.cancellationRequestedAt ?? b.createdAt).getTime();
}

export type AttentionCounts = {
  /** Booking requests waiting to be approved or declined. */
  requests: number;
  /** Confirmed stays whose guest has asked to cancel. */
  cancellations: number;
  total: number;
};

/** What the manager still has to act on — drives the sidebar dot. */
export async function getAttentionCounts(): Promise<AttentionCounts> {
  await requireManager();
  await expireStalePending();
  const [requests, cancellations] = await Promise.all([
    db.booking.count({ where: { status: "pending" } }),
    db.booking.count({
      where: { status: "confirmed", cancellationRequestedAt: { not: null } },
    }),
  ]);
  return { requests, cancellations, total: requests + cancellations };
}

export async function getAdminBooking(id: string) {
  await requireManager();
  return db.booking.findUnique({
    where: { id },
    include: {
      property: { select: { title: true, slug: true, location: true } },
      user: { select: { id: true, accountStatus: true } },
    },
  });
}

/** Upcoming table on the dashboard. */
export async function listUpcomingBookings(limit = 8) {
  await requireManager();
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

export async function listAdminProperties() {
  await requireManager();
  return db.property.findMany({
    include: {
      images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAdminProperty(id: string) {
  await requireManager();
  return db.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { select: { amenityId: true } },
    },
  });
}

export async function listAmenities() {
  await requireManager();
  return db.amenity.findMany({ orderBy: { sortOrder: "asc" } });
}

/** Customers with booking aggregates (PRD §45). */
export async function listCustomers() {
  await requireManager();
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

export async function getCustomer(id: string) {
  await requireManager();
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

export async function listAdminReviews(propertyId?: string) {
  await requireManager();
  return db.review.findMany({
    where: propertyId ? { propertyId } : {},
    include: { property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listBlocks(propertyId: string) {
  await requireManager();
  return db.availabilityBlock.findMany({
    where: { propertyId, endDate: { gte: todayUTC() } },
    orderBy: { startDate: "asc" },
  });
}
