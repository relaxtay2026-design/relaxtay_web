import { createHash } from "crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres (table RateLimit), so it
 * works across serverless instances without another service.
 *
 * Fails OPEN: if the table is missing or the database errors, the request
 * is allowed and the error logged. A limiter outage must never take
 * booking or sign-in down with it.
 */
export type RateLimitResult = { ok: boolean; remaining: number };

export async function rateLimit(opts: {
  /** What is being limited, e.g. "booking" or "login". */
  action: string;
  /** Who is being limited: an IP address, an email… Hashed before storage. */
  subject: string;
  /** Allowed hits per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const key = `${opts.action}:${hash(opts.subject)}`;
  try {
    // One atomic statement: start a fresh window if the old one has lapsed,
    // otherwise count this hit.
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, timezone('utc', now()))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowStart" < timezone('utc', now()) - make_interval(secs => ${opts.windowSeconds})
          THEN 1 ELSE "RateLimit"."count" + 1 END,
        "windowStart" = CASE
          WHEN "RateLimit"."windowStart" < timezone('utc', now()) - make_interval(secs => ${opts.windowSeconds})
          THEN timezone('utc', now()) ELSE "RateLimit"."windowStart" END
      RETURNING "count"`;
    const count = Number(rows[0]?.count ?? 1);

    // Occasional housekeeping so the table stays small.
    if (Math.random() < 0.02) {
      await db.$executeRaw`
        DELETE FROM "RateLimit" WHERE "windowStart" < timezone('utc', now()) - interval '2 days'`;
    }
    return { ok: count <= opts.limit, remaining: Math.max(0, opts.limit - count) };
  } catch (e) {
    console.error(`[rate-limit] ${opts.action} check failed, allowing:`, e);
    return { ok: true, remaining: opts.limit };
  }
}

/**
 * The caller's IP address, or null when it can't be determined (local dev,
 * scripts). Vercel sets x-forwarded-for itself and overwrites any value the
 * client sends, so the first entry can be trusted there.
 */
export async function clientIp(): Promise<string | null> {
  try {
    return ipFromHeaders(await headers());
  } catch {
    return null; // not in a request scope
  }
}

/** Same as clientIp(), for code that already holds the request headers. */
export function ipFromHeaders(h: Headers): string | null {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || null;
}

/**
 * Limits for the account flows. Each is checked per IP address and, where
 * an email is involved, per email address — so neither one visitor hammering
 * many accounts nor many visitors hammering one account gets far.
 */
export const AUTH_LIMITS = {
  /** Sign-in attempts. */
  loginPerIp: { limit: 10, windowSeconds: 15 * 60 },
  loginPerEmail: { limit: 20, windowSeconds: 60 * 60 },
  /** New accounts. */
  registerPerIp: { limit: 5, windowSeconds: 60 * 60 },
  /** Password-reset and claim emails. */
  emailPerIp: { limit: 5, windowSeconds: 60 * 60 },
  emailPerAddress: { limit: 3, windowSeconds: 60 * 60 },
} as const;

/**
 * True when the caller is within `rule` for `action`. A null subject (no
 * IP available, e.g. local scripts) is not limited.
 */
export async function withinLimit(
  action: string,
  subject: string | null,
  rule: { limit: number; windowSeconds: number }
): Promise<boolean> {
  if (!subject) return true;
  return (await rateLimit({ action, subject, ...rule })).ok;
}

/** IPs and emails are personal data — store only a hash of them. */
function hash(subject: string): string {
  return createHash("sha256").update(subject.toLowerCase()).digest("hex").slice(0, 32);
}
