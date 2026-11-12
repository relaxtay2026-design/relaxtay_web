"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { brand } from "@/lib/brand";
import { todayUTC } from "@/lib/dates";
import { CancellationRequestEmail } from "@/components/email/cancellation-request";
import { requestPasswordChange } from "@/server/auth/account";
import { markGuestUpdatesSeen } from "@/server/account/queries";

export type AccountFormState = { error: string | null; saved?: boolean };

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export type PasswordChangeState = {
  error: string | null;
  sentTo?: string;
};

/** Profile → Change password: email a confirmation link to the account. */
export async function requestPasswordChangeAction(): Promise<PasswordChangeState> {
  const session = await requireUser();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      accounts: { where: { provider: "credentials" }, select: { id: true } },
    },
  });
  if (!user) return { error: "Account not found." };
  const result = await requestPasswordChange(
    user.email,
    user.accounts.length > 0
  );
  if (result === "rate_limited")
    return {
      error:
        "We've already sent several links in the last hour. Use the most recent one, or try again later.",
    };
  return { error: null, sentTo: user.email };
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

/** Called once the guest has had the updated bookings on screen. */
export async function markUpdatesSeenAction(bookingIds: string[]): Promise<void> {
  const session = await requireUser();
  const ids = bookingIds.filter((id) => typeof id === "string").slice(0, 50);
  await markGuestUpdatesSeen(session.user.id, session.user.email ?? "", ids);
}
