"use server";

import { redirect } from "next/navigation";
import { createBooking, createBookingSchema } from "@/server/booking/create";
import { auth } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { BOOKINGS_PER_IP_PER_HOUR } from "@/lib/booking-limits";

export type BookingFormState = { error: string | null };

/** Thin server action: parse → service → redirect. */
export async function submitBooking(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const parsed = createBookingSchema.safeParse({
    slug: formData.get("slug"),
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    guestCount: formData.get("guestCount"),
    guestName: formData.get("guestName"),
    guestEmail: formData.get("guestEmail"),
    guestPhone: formData.get("guestPhone"),
    guestMessage: formData.get("guestMessage"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: humanize(first.path[0]?.toString(), first.message) };
  }

  // Per-visitor cap (the per-email cap lives in createBooking)
  const ip = await clientIp();
  if (ip) {
    const limit = await rateLimit({
      action: "booking",
      subject: ip,
      limit: BOOKINGS_PER_IP_PER_HOUR,
      windowSeconds: 3600,
    });
    if (!limit.ok)
      return {
        error:
          "You've sent several requests in a short time. Please wait a little and try again, or contact us directly.",
      };
  }

  // Signed in: the booking is theirs, even when made for someone else
  const session = await auth();
  const booker =
    session?.user?.id && session.user.email
      ? { id: session.user.id, email: session.user.email }
      : null;

  const result = await createBooking(parsed.data, booker);
  if (!result.ok) return { error: result.error };

  redirect(`/booking/confirmation/${result.bookingId}`);
}

function humanize(field: string | undefined, message: string): string {
  const names: Record<string, string> = {
    guestName: "Full name",
    guestEmail: "Email address",
    guestPhone: "Phone number",
    guestCount: "Number of guests",
    checkIn: "Check-in date",
    checkOut: "Check-out date",
  };
  return field && names[field] ? `${names[field]}: ${message}` : message;
}
