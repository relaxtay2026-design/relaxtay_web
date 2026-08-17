"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { db } from "@/lib/db";

/** Amenity names appear on public property pages — refresh everything. */
function revalidateAmenities() {
  revalidatePath("/", "layout");
}

export type AmenityResult =
  | { ok: true; amenity: { id: string; name: string } }
  | { ok: false; error: string };

/** Inline quick-add from the property form (impr. A2). */
export async function createAmenityAction(
  name: string
): Promise<AmenityResult> {
  await requireManager();
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60)
    return { ok: false, error: "Amenity name must be 2–60 characters." };

  const existing = await db.amenity.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing)
    return { ok: true, amenity: { id: existing.id, name: existing.name } };

  const count = await db.amenity.count();
  const amenity = await db.amenity.create({
    // "sparkles" renders via AmenityIcon's generic fallback
    data: { name: trimmed, icon: "sparkles", sortOrder: count },
  });
  revalidateAmenities();
  return { ok: true, amenity: { id: amenity.id, name: amenity.name } };
}

export async function renameAmenityAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("amenityId"));
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) return;
  await db.amenity.update({ where: { id }, data: { name } });
  revalidateAmenities();
}

/** Deleting cascades out of every property (join rows cascade). */
export async function deleteAmenityAction(formData: FormData): Promise<void> {
  await requireManager();
  await db.amenity.delete({ where: { id: String(formData.get("amenityId")) } });
  revalidateAmenities();
}
