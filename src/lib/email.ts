import { Resend } from "resend";
import type { ReactElement } from "react";
import { brand } from "@/lib/brand";

/**
 * Transactional email transport. Falls back to console logging when
 * RESEND_API_KEY is absent (offline dev), and NEVER throws into the
 * booking path — a failed notification must not fail a booking.
 *
 * Until a sending domain is verified in Resend, MAIL_FROM stays
 * onboarding@resend.dev and Resend only delivers to the account
 * owner's inbox — set MANAGER_EMAIL to that address for testing.
 *
 * Guest replies go to REPLY_TO, or the brand's contact address, so they
 * reach a real inbox whatever address the mail is sent from.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "onboarding@resend.dev";
  if (!key) {
    console.log(`[email:dev] to=${opts.to} subject="${opts.subject}"`);
    return;
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: opts.to,
      replyTo: process.env.REPLY_TO || brand.email,
      subject: opts.subject,
      react: opts.react,
    });
    if (error) console.error(`[email] send failed to=${opts.to}:`, error);
  } catch (e) {
    console.error(`[email] transport error to=${opts.to}:`, e);
  }
}
