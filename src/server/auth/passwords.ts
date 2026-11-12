import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

/** PRD §64: hashed passwords only, cost ≥ 12. */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A short fingerprint of the stored password hash, carried in each session.
 * When the password changes the fingerprint no longer matches and sessions
 * started under the old password end. It cannot be turned back into the
 * hash, and "none" covers accounts that sign in with Google only.
 */
export function passwordStamp(hash: string | null | undefined): string {
  if (!hash) return "none";
  return createHash("sha256").update(hash).digest("base64url").slice(0, 16);
}

/** Minimal strength gate; UI communicates the rule. */
export const PASSWORD_MIN = 8;
