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
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || h.get("x-real-ip")?.trim() || null;
  } catch {
    return null; // not in a request scope
  }
}

/** IPs and emails are personal data — store only a hash of them. */
function hash(subject: string): string {
  return createHash("sha256").update(subject.toLowerCase()).digest("hex").slice(0, 32);
}
