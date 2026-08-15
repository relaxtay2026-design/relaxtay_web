import bcrypt from "bcryptjs";

/** PRD §64: hashed passwords only, cost ≥ 12. */
const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Minimal strength gate; UI communicates the rule. */
export const PASSWORD_MIN = 8;
