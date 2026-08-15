import { db } from "@/lib/db";

/** Filters accepted by the public /properties page (PRD §10 — lightweight). */
export type PropertyFilters = {
  guests?: number;
  bedrooms?: number;
  maxPriceCents?: number;
  location?: string;
};

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  reviews: { where: { isPublished: true }, select: { rating: true } },
};

export type PropertyCardData = Awaited<
  ReturnType<typeof listActiveProperties>
>[number];

/** Card-level data for /properties and homepage. Active properties only. */
export async function listActiveProperties(filters: PropertyFilters = {}) {
  const rows = await db.property.findMany({
    where: {
      status: "active",
      ...(filters.guests ? { maxGuests: { gte: filters.guests } } : {}),
      ...(filters.bedrooms ? { bedrooms: { gte: filters.bedrooms } } : {}),
      ...(filters.maxPriceCents
        ? { priceCents: { lte: filters.maxPriceCents } }
        : {}),
      ...(filters.location
        ? { location: { contains: filters.location, mode: "insensitive" } }
        : {}),
    },
    include: cardInclude,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(withRating);
}

/** Full detail for /properties/[slug]. Returns null for unknown/archived. */
export async function getPropertyBySlug(slug: string) {
  const row = await db.property.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      amenities: {
        include: { amenity: true },
        orderBy: { amenity: { sortOrder: "asc" } },
      },
      reviews: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!row || row.status !== "active") return null;
  const ratings = row.reviews.map((r) => r.rating);
  return { ...row, ...aggregate(ratings) };
}

export async function listActiveSlugs() {
  const rows = await db.property.findMany({
    where: { status: "active" },
    select: { slug: true, updatedAt: true },
  });
  return rows;
}

function withRating<T extends { reviews: { rating: number }[] }>(row: T) {
  return { ...row, ...aggregate(row.reviews.map((r) => r.rating)) };
}

function aggregate(ratings: number[]) {
  const reviewCount = ratings.length;
  const avgRating =
    reviewCount === 0
      ? null
      : Math.round((ratings.reduce((a, b) => a + b, 0) / reviewCount) * 100) /
        100;
  return { reviewCount, avgRating };
}
