import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

/**
 * Claim + reset tokens (PRD §25/§6.3): single-use, expiring, HASHED at rest.
 * The raw token exists only inside the emailed link.
 */
export type TokenPurpose = "claim" | "reset";

const TTL_MS: Record<TokenPurpose, number> = {
  claim: 7 * 24 * 60 * 60 * 1000, // 7 days
  reset: 60 * 60 * 1000, // 1 hour
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Create a token for an email; returns the RAW token for the link. */
export async function createToken(
  email: string,
  purpose: TokenPurpose
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const identifier = email.toLowerCase();
  // One live token per (email, purpose): drop stale ones first
  await db.verificationToken.deleteMany({ where: { identifier, purpose } });
  await db.verificationToken.create({
    data: {
      identifier,
      token: sha256(raw),
      purpose,
      expires: new Date(Date.now() + TTL_MS[purpose]),
    },
  });
  return raw;
}

/** Look up a raw token; returns the email or null. Does NOT consume. */
export async function peekToken(
  raw: string,
  purpose: TokenPurpose
): Promise<string | null> {
  const row = await db.verificationToken.findUnique({
    where: { token: sha256(raw) },
  });
  if (!row || row.purpose !== purpose || row.expires < new Date()) return null;
  return row.identifier;
}

/** Consume (single use): returns the email or null. */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose
): Promise<string | null> {
  const row = await db.verificationToken.findUnique({
    where: { token: sha256(raw) },
  });
  if (!row || row.purpose !== purpose) return null;
  await db.verificationToken.delete({ where: { token: row.token } });
  return row.expires < new Date() ? null : row.identifier;
}
