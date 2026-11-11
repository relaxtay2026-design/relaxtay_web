/**
 * Phase 5 proof: sign-up by emailed link, claim, reset, takeover protection.
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
import { passwordStamp, verifyPassword } from "../src/server/auth/passwords";

const EMAILS = ["auth-t1@example.com", "auth-t2@example.com"];

async function cleanup() {
  await db.verificationToken.deleteMany({
    where: { identifier: { in: EMAILS } },
  });
  await db.user.deleteMany({ where: { email: { in: EMAILS } } });
  // Email caps are keyed by a hash of the address — clear them so the
  // script can be re-run within the hour.
  await db.$executeRaw`DELETE FROM "RateLimit"`.catch(() => {});
}

async function main() {
  await cleanup();
  const results: string[] = [];
  let failed = false;
  const check = (ok: boolean, name: string) => {
    results.push(`${ok ? "✓" : "✗"} ${name}`);
    failed ||= !ok;
  };

  // 1. Sign-up creates an unclaimed profile with NO password and a claim link
  await registerUser({ name: "Auth Tester", email: EMAILS[0] });
  const u1 = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  const t1 = await db.verificationToken.count({
    where: { identifier: EMAILS[0], purpose: "claim" },
  });
  check(
    u1?.accountStatus === "unclaimed" && u1.accounts.length === 0 && t1 === 1,
    "Test 1: sign-up creates an unclaimed profile, no password, one claim link"
  );

  // 2. Signing up again with the same email changes nothing
  await registerUser({ name: "Imposter", email: EMAILS[0] });
  const u2 = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  check(
    u2?.accountStatus === "unclaimed" &&
      u2.accounts.length === 0 &&
      u2.name === "Auth Tester",
    "Test 2: repeat sign-up leaves the profile unclaimed and unchanged"
  );

  // 2b. Only the emailed link activates it, with the password chosen there
  const signupRaw = await createToken(EMAILS[0], "claim");
  const r2b = await completeClaim(signupRaw, "test-password-1");
  const u2b = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  check(
    r2b.ok &&
      u2b?.accountStatus === "active" &&
      (await verifyPassword("test-password-1", u2b.accounts[0].passwordHash!)),
    "Test 2b: the emailed link activates the account with the chosen password"
  );

  // 2c. Signing up with an ACTIVE account's email cannot touch it
  await registerUser({ name: "Imposter", email: EMAILS[0] });
  const u2c = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  const t2c = await db.verificationToken.count({
    where: { identifier: EMAILS[0] },
  });
  check(
    u2c?.accountStatus === "active" &&
      u2c.name === "Auth Tester" &&
      (await verifyPassword("test-password-1", u2c.accounts[0].passwordHash!)) &&
      t2c === 0,
    "Test 2c: sign-up against an active account changes nothing, issues no link"
  );

  // 3. Unclaimed profile (like one made by a booking) cannot be taken over
  await db.user.create({
    data: { name: "Booked Guest", email: EMAILS[1], accountStatus: "unclaimed" },
  });
  await registerUser({ name: "Imposter", email: EMAILS[1] });
  const u3 = await db.user.findUnique({
    where: { email: EMAILS[1] },
    include: { accounts: true },
  });
  check(
    u3?.accountStatus === "unclaimed" &&
      u3.accounts.length === 0 &&
      u3.name === "Booked Guest",
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
  const before6 = await db.account.findFirst({
    where: { provider: "credentials", providerAccountId: EMAILS[0] },
  });
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

  // 7. …and changes the stamp that sessions are checked against, so every
  //    session started under the old password ends (see jwt() in lib/auth)
  check(
    passwordStamp(before6?.passwordHash) !==
      passwordStamp(u6!.accounts[0].passwordHash) &&
      passwordStamp(null) === "none",
    "Test 7: a reset changes the session stamp (old sessions end)"
  );

  // 8. A link sent before an account was disabled can't switch it back on
  const lateReset = await createToken(EMAILS[0], "reset");
  const lateClaim = await createToken(EMAILS[0], "claim");
  await db.user.update({
    where: { email: EMAILS[0] },
    data: { accountStatus: "disabled" },
  });
  const r8a = await completePasswordReset(lateReset, "sneak-back-in-1");
  const r8b = await completeClaim(lateClaim, "sneak-back-in-2");
  const u8 = await db.user.findUnique({
    where: { email: EMAILS[0] },
    include: { accounts: true },
  });
  check(
    !r8a.ok &&
      !r8b.ok &&
      u8?.accountStatus === "disabled" &&
      (await verifyPassword("new-password-9", u8.accounts[0].passwordHash!)),
    "Test 8: reset and claim links don't re-enable a disabled account"
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
