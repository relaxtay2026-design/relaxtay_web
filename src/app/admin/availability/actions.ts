"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDateOnly } from "@/lib/dates";

export type BlockFormState = { error: string | null; done?: boolean };

/** Create a manager block (D4). Warns instead of overlapping live bookings. */
export async function createBlockAction(
  _prev: BlockFormState,
  formData: FormData
): Promise<BlockFormState> {
  await requireManager();
  const propertyId = String(formData.get("propertyId"));
  const start = parseDateOnly(String(formData.get("startDate")));
  const end = parseDateOnly(String(formData.get("endDate")));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!start || !end) return { error: "Both dates are required." };
  if (end <= start) return { error: "End date must be after start date." };

  const clash = await db.booking.findFirst({
    where: {
      propertyId,
      status: { in: ["pending", "confirmed"] },
      checkIn: { lt: end },
      checkOut: { gt: start },
    },
    select: { code: true },
  });
  if (clash)
    return {
      error: `These dates overlap booking ${clash.code}. Cancel or decline it first.`,
    };

  await db.availabilityBlock.create({
    data: { propertyId, startDate: start, endDate: end, note },
  });
  revalidatePath("/admin/availability");
  return { error: null, done: true };
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  await requireManager();
  await db.availabilityBlock.delete({
    where: { id: String(formData.get("blockId")) },
  });
  revalidatePath("/admin/availability");
}
