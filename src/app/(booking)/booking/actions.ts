"use server";

import { redirect } from "next/navigation";
import { createBooking, createBookingSchema } from "@/server/booking/create";

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

  const result = await createBooking(parsed.data);
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
