# Setup — Accounts, API Keys, and Deployment

Everything this app needs from the outside world, and how to get it.
Copy `.env.example` to `.env` and fill it as you go.

## 1. Neon — PostgreSQL database (required)

Env: `DATABASE_URL`

1. Sign up at [neon.tech](https://neon.tech) (Google login works).
2. **New Project** — any name; pick region **US East** (near Vercel's default).
3. Project page → **Connect** → **uncheck "Connection pooling"** → copy the
   string: `postgresql://USER:PASSWORD@ep-xxx.aws.neon.tech/neondb?sslmode=require`
4. Put it in `.env` as `DATABASE_URL`.
5. A fresh database is empty — initialize it once:

   ```bash
   npx prisma migrate deploy   # creates all tables + the no-overlap constraint
   npm run db:seed             # 8 demo properties, amenities, reviews, manager user
   ```

The seed creates the manager login `manager@example.com` / `manager123`
(override with `SEED_MANAGER_PASSWORD`). **Change this before going live.**

## 2. Resend — transactional email (required for emails)

Env: `RESEND_API_KEY`, `MAIL_FROM`, `MANAGER_EMAIL`

1. Sign up at [resend.com](https://resend.com). ⚠️ Until a domain is
   verified, Resend only delivers to the address you signed up with.
2. **API Keys → Create API Key** → `RESEND_API_KEY`.
3. `MANAGER_EMAIL` = the manager's real inbox (new-booking and
   cancellation notifications go there). Use the Resend signup address
   while in sandbox.
4. `MAIL_FROM` = `onboarding@resend.dev` while in sandbox.

**Unlock email to all guests:** Resend → **Domains → Add Domain** → add
the SPF/DKIM DNS records it shows → once verified, set
`MAIL_FROM="Lumière <stays@yourdomain.com>"`.

Without `RESEND_API_KEY` the app still works — emails are logged to the
server console instead of sent.

## 3. Cloudinary — image hosting & CDN (required for photo uploads)

Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

1. Free account at [cloudinary.com](https://cloudinary.com).
2. **Settings (gear) → API Keys**: copy **Cloud name** (the short code —
   not the key's display label), **API Key**, **API Secret**.
3. `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is the same cloud name again
   (the browser uses it to build image URLs).

Without these, the admin photo manager falls back to paste-an-image-URL;
with them, drag-and-drop upload activates automatically.

## 4. Google OAuth — "Continue with Google" (optional)

Env: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

1. [console.cloud.google.com](https://console.cloud.google.com) → New Project.
2. **OAuth consent screen** → External → app name + support email → save.
3. **Credentials → Create Credentials → OAuth client ID → Web application**.
4. Authorized redirect URIs — add BOTH:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-LIVE-DOMAIN/api/auth/callback/google`
5. Copy Client ID / Client Secret into `.env`.

Google sign-in enables itself when both vars are present. Email/password
auth works regardless.

## 5. AUTH_SECRET — session signing (required)

Not a service. Generate locally:

```bash
openssl rand -base64 32
```

Set `AUTH_SECRET` to the output and `AUTH_TRUST_HOST="true"`.
Use a different secret per environment (dev vs production).

## 6. GitHub + Vercel — hosting (production)

1. Push this repo to the owner's GitHub (private is fine — no secrets are
   committed; `.env` is gitignored).
2. [vercel.com](https://vercel.com) → log in with GitHub → **Add New →
   Project** → import the repo. Next.js is auto-detected.
3. Before deploying, add ALL env vars from your filled `.env` in
   **Environment Variables**.
4. Deploy. Then add one more variable with the URL Vercel assigned —
   `NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app` — and **Redeploy**
   (it drives sitemap URLs and links inside notification emails).
5. Every `git push` to `main` auto-deploys from then on.

## Handoff checklist (moving to a new owner's accounts)

- [ ] New Neon project → `DATABASE_URL` → `migrate deploy` + seed
      (or `pg_dump`/`pg_restore` from the old database to keep data)
- [ ] New Resend key → `RESEND_API_KEY`, `MANAGER_EMAIL` = new owner's inbox
- [ ] New Cloudinary account → all 4 vars → re-upload property photos
      (old uploads live in the old account)
- [ ] Fresh `AUTH_SECRET` (invalidates existing sessions — that's fine)
- [ ] Google OAuth client under the new owner's Google account (optional)
- [ ] GitHub repo transferred / Vercel project under the new owner,
      env vars re-entered there
- [ ] Change the seeded manager password
