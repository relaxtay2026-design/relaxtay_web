/**
 * Brand configuration — the ONE place the brand lives (PRD decision D6).
 * Changing a value here updates the wordmark, metadata, and email templates
 * everywhere.
 */
export const brand = {
  name: "Relaxtay",
  /**
   * The business or person that owns the site, shown in the footer
   * copyright line and at the bottom of emails. Same as the brand name
   * until a registered name is supplied.
   */
  legalName: "Relaxtay",
  tagline: "Stay somewhere worth remembering",
  description:
    "Curating exceptional spaces for those who appreciate the quiet luxury of thoughtful design and uncompromising comfort.",
  /**
   * Contact address shown to guests (footer, about page, booking page) and
   * where manager notifications go when MANAGER_EMAIL is not set. Emails
   * are SENT from MAIL_FROM, not from this address.
   */
  email: "relaxtay2026@gmail.com",
  /** Booking reference prefix: RLX-482915 style. */
  bookingPrefix: "RLX",
} as const;
