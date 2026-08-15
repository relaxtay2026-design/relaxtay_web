/**
 * Phase 5 proof: registration, claim, reset, takeover protection.
 * Run: npx tsx prisma/verify-auth-flow.ts
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import {
  registerUser,
  completeClaim,
  completePasswordReset,
} from "../src/server/auth/account";
import { createToken } from "../src/server/auth/tokens";
import { verifyPassword } from "../src/server/auth/passwords";

const EMAILS = ["auth-t1@example.com", "auth-t2@example.com"];

async function cleanup() {
  await db.verificationToken.deleteMany({
    where: { identifier: { in: EMAILS } },
  });
  await db.user.deleteMany({ where: { email: { in: EMAILS } } });
}

async function main() {
  await cleanup();
  const results: string[] = [];
  let failed = false;
  const check = (ok: boolean, name: string) => {
    results.push(`${ok ? "✓" : "✗"} ${name}`);
    failed ||= !ok;
  };

  // 1. Fresh registration → active user with credentials
  const r1 = await registerUser({
    name: "Auth Tester",
    email: EMAILS[0],
    password: "test-password-1",
  });
  const u1 = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  check(
    r1.ok &&
      u1?.accountStatus === "active" &&
      Boolean(u1.accounts[0]?.passwordHash) &&
      (await verifyPassword("test-password-1", u1.accounts[0].passwordHash!)),
    "Test 1: registration creates active user with verifiable password"
  );

  // 2. Re-registering the same email is refused
  const r2 = await registerUser({
    name: "Imposter",
    email: EMAILS[0],
    password: "other-password",
  });
  check(!r2.ok, "Test 2: duplicate registration refused");

  // 3. Unclaimed profile (like one made by a booking) cannot be taken over
  await db.user.create({
    data: { name: "Booked Guest", email: EMAILS[1], accountStatus: "unclaimed" },
  });
  const r3 = await registerUser({
    name: "Imposter",
    email: EMAILS[1],
    password: "steal-attempt",
  });
  const u3 = await db.user.findUnique({
    where: { email: EMAILS[1] },
    include: { accounts: true },
  });
  check(
    !r3.ok && u3?.accountStatus === "unclaimed" && u3.accounts.length === 0,
    "Test 3: unclaimed profile takeover blocked (claim email re-sent instead)"
  );

  // 4. Claim flow: token → password → active
  const claimRaw = await createToken(EMAILS[1], "claim");
  const r4 = await completeClaim(claimRaw, "claimed-password");
  const u4 = await db.user.findUnique({
    where: { email: EMAILS[1] },
    include: { accounts: true },
  });
  check(
    r4.ok &&
      u4?.accountStatus === "active" &&
      (await verifyPassword("claimed-password", u4.accounts[0].passwordHash!)),
    "Test 4: claim token activates account with chosen password"
  );

  // 5. Claim token is single-use
  const r5 = await completeClaim(claimRaw, "second-use");
  check(!r5.ok, "Test 5: claim token cannot be reused");

  // 6. Password reset replaces the password
  const resetRaw = await createToken(EMAILS[0], "reset");
  const r6 = await completePasswordReset(resetRaw, "new-password-9");
  const u6 = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  check(
    r6.ok &&
      (await verifyPassword("new-password-9", u6!.accounts[0].passwordHash!)) &&
      !(await verifyPassword("test-password-1", u6!.accounts[0].passwordHash!)),
    "Test 6: password reset replaces old password"
  );

  await cleanup();
  results.push("· test rows cleaned up");
  console.log(results.join("\n"));
  if (failed) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
