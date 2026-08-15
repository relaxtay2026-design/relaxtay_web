"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { transitionBooking } from "@/server/booking/transitions";

export type AdminActionState = { error: string | null; done?: boolean };

async function run(
  bookingId: string,
  action: "confirm" | "decline" | "cancel",
  note?: string
): Promise<AdminActionState> {
  await requireManager();
  const result = await transitionBooking(bookingId, action, note);
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { error: null, done: true };
}

export async function confirmBookingAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(String(formData.get("bookingId")), "confirm");
}

export async function declineBookingAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(
    String(formData.get("bookingId")),
    "decline",
    String(formData.get("note") ?? "")
  );
}

export async function cancelBookingAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  return run(
    String(formData.get("bookingId")),
    "cancel",
    String(formData.get("note") ?? "")
  );
}
