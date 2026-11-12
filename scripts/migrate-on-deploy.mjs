// Applies pending database migrations during a Vercel *production* build.
//
// Preview copies and local builds skip this on purpose: previews may share
// the live database, and an unmerged branch must never change it.
//
// If a migration fails, this exits non-zero, the build fails, and Vercel
// keeps serving the previous deployment.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(
    `[migrate] Skipped (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}); only production builds migrate.`,
  );
  process.exit(0);
}

let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set; cannot migrate.");
  process.exit(1);
}
// Neon's pooled host ("ep-x-pooler.region...") does not support the session
// locks migrations take; the same host without "-pooler" is the direct one.
url = url.replace(/-pooler\./, ".");

console.log("[migrate] Production build: applying pending migrations.");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(result.status ?? 1);
