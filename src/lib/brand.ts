/**
 * Brand configuration — the ONE place the brand lives (PRD decision D6).
 * The name is a placeholder until the real brand is chosen; swapping it
 * here updates the wordmark, metadata, and email templates everywhere.
 */
export const brand = {
  name: "Lumière",
  legalName: "Lumière Hospitality",
  tagline: "Stay somewhere worth remembering",
  description:
    "Curating exceptional spaces for those who appreciate the quiet luxury of thoughtful design and uncompromising comfort.",
  /** Transactional sender + reply-to. Swap when the domain is real. */
  email: "stays@example.com",
  /** Booking reference prefix: LUM-482915 style. */
  bookingPrefix: "LUM",
} as const;
