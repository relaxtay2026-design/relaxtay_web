import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUnavailableDates } from "@/server/booking/availability";

/**
 * Public, read-only: unavailable nights for a property's calendar.
 * Informational only (PRD §17) — truth is enforced at write time.
 */
export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/availability/[propertyId]">
) {
  const { propertyId } = await params;
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { id: true, status: true, minNights: true },
  });
  if (!property || property.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const unavailable = await getUnavailableDates(property.id);
  return NextResponse.json(
    { unavailable, minNights: property.minNights },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
