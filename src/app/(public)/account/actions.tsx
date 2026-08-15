"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { brand } from "@/lib/brand";
import { todayUTC } from "@/lib/dates";
import { CancellationRequestEmail } from "@/components/email/cancellation-request";

export type AccountFormState = { error: string | null; saved?: boolean };

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export async function updateProfileAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const session = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });
  revalidatePath("/account", "layout");
  return { error: null, saved: true };
}

export async function updateMarketingAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const session = await requireUser();
  const optIn = formData.get("marketingOptIn") === "on";
  await db.user.update({
    where: { id: session.user.id },
    data: {
      marketingOptIn: optIn,
      ...(optIn ? { marketingOptInAt: new Date() } : {}),
    },
  });
  revalidatePath("/account/settings");
  return { error: null, saved: true };
}

/** Guest requests cancellation; the manager executes it (PRD D7). */
export async function requestCancellationAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  const session = await requireUser();
  const bookingId = String(formData.get("bookingId") ?? "");
  const email = session.user.email?.toLowerCase() ?? "";

  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ userId: session.user.id }, { guestEmail: email }],
    },
    include: { property: { select: { title: true } } },
  });
  if (!booking) return { error: "Booking not found." };
  if (!["pending", "confirmed"].includes(booking.status))
    return { error: "This booking can no longer be cancelled." };
  if (booking.checkIn < todayUTC())
    return { error: "This stay has already begun." };
  if (booking.cancellationRequestedAt)
    return { error: null, saved: true }; // already requested — idempotent

  await db.booking.update({
    where: { id: booking.id },
    data: { cancellationRequestedAt: new Date() },
  });

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendEmail({
    to: process.env.MANAGER_EMAIL ?? brand.email,
    subject: `Cancellation requested: ${booking.code}`,
    react: (
      <CancellationRequestEmail
        code={booking.code}
        propertyTitle={booking.property.title}
        guestName={booking.guestName}
        guestEmail={booking.guestEmail}
        checkIn={booking.checkIn}
        checkOut={booking.checkOut}
        adminUrl={`${site}/admin/bookings/${booking.id}`}
      />
    ),
  });

  revalidatePath(`/account/bookings/${booking.id}`);
  return { error: null, saved: true };
}
