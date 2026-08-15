"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireManager } from "@/lib/auth";
import { db } from "@/lib/db";

export type ReviewFormState = { error: string | null; done?: boolean };

const reviewSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  propertyId: z.string().min(1),
  authorName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10).max(2000),
  stayedMonth: z.string().trim().max(40).optional().or(z.literal("")),
});

async function revalidateFor(propertyId: string) {
  const p = await db.property.findUnique({
    where: { id: propertyId },
    select: { slug: true },
  });
  revalidatePath("/");
  if (p) revalidatePath(`/properties/${p.slug}`);
  revalidatePath("/admin/reviews");
}

export async function saveReviewAction(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  await requireManager();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const d = parsed.data;
  const data = {
    propertyId: d.propertyId,
    authorName: d.authorName,
    rating: d.rating,
    body: d.body,
    stayedMonth: d.stayedMonth || null,
  };
  if (d.id) {
    await db.review.update({ where: { id: d.id }, data });
  } else {
    await db.review.create({ data });
  }
  await revalidateFor(d.propertyId);
  return { error: null, done: true };
}

/** Homepage testimonial strip curation (impr. #6). */
export async function toggleFeatureAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("reviewId"));
  const review = await db.review.findUnique({ where: { id } });
  if (!review) return;
  await db.review.update({
    where: { id },
    data: { isFeatured: !review.isFeatured },
  });
  await revalidateFor(review.propertyId);
}

export async function togglePublishAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("reviewId"));
  const review = await db.review.findUnique({ where: { id } });
  if (!review) return;
  await db.review.update({
    where: { id },
    data: { isPublished: !review.isPublished },
  });
  await revalidateFor(review.propertyId);
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = String(formData.get("reviewId"));
  const review = await db.review.findUnique({ where: { id } });
  if (!review) return;
  await db.review.delete({ where: { id } });
  await revalidateFor(review.propertyId);
}
