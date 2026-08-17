"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertySchema, pendingImagesSchema } from "./property-schema";

export type PropertyFormState = {
  error: string | null;
  /** Set on success — the client clears its draft then routes here. */
  savedId?: string;
};

/** Public pages that must reflect admin edits (SSG w/ revalidate). */
function revalidatePublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/properties");
  if (slug) revalidatePath(`/properties/${slug}`);
  revalidatePath("/admin/properties");
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "property";
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await db.property.findUnique({ where: { slug } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${i}`;
  }
}

export async function savePropertyAction(
  _prev: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  await requireManager();
  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const d = parsed.data;
  const amenityIds = formData.getAll("amenityIds").map(String);

  const data = {
    title: d.title,
    location: d.location,
    summary: d.summary,
    description: d.description,
    priceCents: Math.round(d.price * 100),
    currency: d.currency,
    maxGuests: d.maxGuests,
    bedrooms: d.bedrooms,
    beds: d.beds,
    bathrooms: d.bathrooms,
    minNights: d.minNights,
    status: d.status,
  };

  // Photos added on the New form before the property exists (impr. A3)
  let pendingImages: { src: string; alt: string }[] = [];
  try {
    pendingImages = pendingImagesSchema.parse(
      JSON.parse(String(formData.get("pendingImages") ?? "[]"))
    );
  } catch {
    pendingImages = [];
  }

  let slug: string;
  let id: string;
  if (d.id) {
    const existing = await db.property.findUnique({ where: { id: d.id } });
    if (!existing) return { error: "Property not found." };
    // Keep slugs stable once public; only retitle changes it pre-launch
    slug = existing.slug;
    await db.$transaction([
      db.property.update({ where: { id: d.id }, data }),
      db.propertyAmenity.deleteMany({ where: { propertyId: d.id } }),
      db.propertyAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ propertyId: d.id!, amenityId })),
      }),
    ]);
    id = d.id;
  } else {
    slug = await uniqueSlug(d.title);
    const created = await db.property.create({
      data: {
        ...data,
        slug,
        amenities: {
          create: amenityIds.map((amenityId) => ({ amenityId })),
        },
        images: {
          create: pendingImages.map((img, i) => ({
            src: img.src,
            alt: img.alt || d.title,
            sortOrder: i,
            isPrimary: i === 0,
          })),
        },
      },
    });
    id = created.id;
  }

  revalidatePublic(slug);
  return { error: null, savedId: id };
}

export async function setPropertyStatusAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("id"));
  const status = formData.get("status") === "active" ? "active" : "inactive";
  const p = await db.property.update({ where: { id }, data: { status } });
  revalidatePublic(p.slug);
  revalidatePath(`/admin/properties/${id}`);
}

// ── Images ──────────────────────────────────────────────────────

async function imageProperty(imageId: string) {
  const img = await db.propertyImage.findUnique({
    where: { id: imageId },
    include: { property: { select: { id: true, slug: true } } },
  });
  return img;
}

export async function addImageAction(formData: FormData): Promise<void> {
  await requireManager();
  const propertyId = String(formData.get("propertyId"));
  const src = String(formData.get("src") ?? "").trim();
  const alt = String(formData.get("alt") ?? "").trim() || "Property photo";
  if (!src) return;
  const property = await db.property.findUnique({ where: { id: propertyId } });
  if (!property) return;
  const count = await db.propertyImage.count({ where: { propertyId } });
  await db.propertyImage.create({
    data: { propertyId, src, alt, sortOrder: count, isPrimary: count === 0 },
  });
  revalidatePublic(property.slug);
  revalidatePath(`/admin/properties/${propertyId}`);
}

export async function deleteImageAction(formData: FormData): Promise<void> {
  await requireManager();
  const img = await imageProperty(String(formData.get("imageId")));
  if (!img) return;
  await db.propertyImage.delete({ where: { id: img.id } });
  // Keep a primary image if any remain
  const remaining = await db.propertyImage.findMany({
    where: { propertyId: img.property.id },
    orderBy: { sortOrder: "asc" },
  });
  if (remaining.length > 0 && !remaining.some((i) => i.isPrimary)) {
    await db.propertyImage.update({
      where: { id: remaining[0].id },
      data: { isPrimary: true },
    });
  }
  revalidatePublic(img.property.slug);
  revalidatePath(`/admin/properties/${img.property.id}`);
}

export async function setPrimaryImageAction(formData: FormData): Promise<void> {
  await requireManager();
  const img = await imageProperty(String(formData.get("imageId")));
  if (!img) return;
  await db.$transaction([
    db.propertyImage.updateMany({
      where: { propertyId: img.property.id },
      data: { isPrimary: false },
    }),
    db.propertyImage.update({
      where: { id: img.id },
      data: { isPrimary: true },
    }),
  ]);
  revalidatePublic(img.property.slug);
  revalidatePath(`/admin/properties/${img.property.id}`);
}

export async function moveImageAction(formData: FormData): Promise<void> {
  await requireManager();
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const img = await imageProperty(String(formData.get("imageId")));
  if (!img) return;
  const all = await db.propertyImage.findMany({
    where: { propertyId: img.property.id },
    orderBy: { sortOrder: "asc" },
  });
  const idx = all.findIndex((i) => i.id === img.id);
  const swap = all[idx + dir];
  if (!swap) return;
  await db.$transaction([
    db.propertyImage.update({
      where: { id: img.id },
      data: { sortOrder: swap.sortOrder },
    }),
    db.propertyImage.update({
      where: { id: swap.id },
      data: { sortOrder: all[idx].sortOrder },
    }),
  ]);
  revalidatePublic(img.property.slug);
  revalidatePath(`/admin/properties/${img.property.id}`);
}
