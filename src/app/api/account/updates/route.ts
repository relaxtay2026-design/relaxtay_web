import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countGuestUpdates } from "@/server/account/queries";

/**
 * How many of the signed-in guest's bookings have an update they haven't
 * seen (confirmed, declined, cancelled). Read by the header avatar and the
 * account sidebar; signed-out visitors simply get 0.
 */
export async function GET() {
  const session = await auth();
  const count = session?.user?.id
    ? await countGuestUpdates(session.user.id, session.user.email ?? "")
    : 0;
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
