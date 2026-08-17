import { z } from "zod";

/**
 * Shared by the client form (instant field-level validation, impr. A4)
 * and the server action (authoritative backstop). No "use server" here —
 * plain module importable from both sides.
 */
export const propertyFields = {
  title: z.string().trim().min(3, "At least 3 characters").max(120),
  location: z.string().trim().min(3, "At least 3 characters").max(160),
  summary: z
    .string()
    .trim()
    .min(10, "At least 10 characters — one or two card-worthy sentences")
    .max(300, "Keep it under 300 characters"),
  description: z
    .string()
    .trim()
    .min(20, "At least 20 characters")
    .max(8000),
  price: z.coerce.number().min(1, "Must be at least 1").max(1_000_000),
  currency: z.enum(["USD", "CAD"]),
  maxGuests: z.coerce.number().int().min(1).max(50),
  bedrooms: z.coerce.number().int().min(0).max(50),
  beds: z.coerce.number().int().min(1).max(100),
  bathrooms: z.coerce.number().int().min(1).max(50),
  minNights: z.coerce.number().int().min(1).max(60),
  status: z.enum(["active", "inactive"]),
};

export const propertySchema = z.object({
  id: z.string().optional().or(z.literal("")),
  ...propertyFields,
});

export type PropertyFieldName = keyof typeof propertyFields;

/** Images added on the New form before the property exists (impr. A3). */
export const pendingImagesSchema = z
  .array(z.object({ src: z.string().min(1), alt: z.string().max(200) }))
  .max(30);
