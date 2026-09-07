# KRIEL — Static deployment on Render + Supabase backend

The public site is a **pure static export** (`out/`) served by a Render **Static Site**.
All data (categories, products, orders, photos) lives in **Supabase** (hosted Postgres +
Auth + Storage + Edge Functions). The admin panel at `/admin/` is a client-side app that
talks to Supabase directly; access is enforced by Supabase Auth + Row Level Security.

## 1. Supabase setup (one time)

1. Create a project at https://supabase.com → note **Project URL** and **anon public key**
   (Settings → API).
2. SQL Editor → paste and run `supabase/schema.sql`
   (creates tables, RLS policies, `create_order()` RPC, the `kriel-media` storage bucket,
   and seeds the initial catalogue).
3. Authentication → Users → **Add user** → e-mail + password for the admin
   (untick "send confirmation", or confirm it). Disable public sign-ups
   (Authentication → Providers → Email → "Allow new users to sign up" = off).
4. Order e-mails (optional but recommended) — install the Supabase CLI, then:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set RESEND_API_KEY=re_xxx ORDER_EMAIL_TO=infokrielshpk@kriel.com ORDER_EMAIL_FROM="KRIEL <orders@yourdomain.com>"
   supabase functions deploy order-email --no-verify-jwt
   ```
   Without this, orders are still saved and visible in the admin panel; only the e-mail
   is skipped (`email_sent = false`).

## 2. Render — Static Site settings

| Setting            | Value                              |
|--------------------|------------------------------------|
| Root Directory     | `kriel-bronze-product-website` (if the app stays in that sub-folder) |
| Build Command      | `npm ci && npm run build`          |
| Publish Directory  | `out`                              |

Environment variables (Render → Environment):

| Key                              | Value                                   |
|----------------------------------|-----------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | `https://xxxx.supabase.co`              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | anon public key                         |
| `NEXT_PUBLIC_SUPABASE_BUCKET`    | `kriel-media` (optional, default)       |
| `NODE_VERSION`                   | `20` (or newer)                         |

Do **not** set `DATABASE_URL`, service-role key, SMTP or session secrets on Render — the
static site does not need them and they would be useless/unsafe in a browser bundle.
Do **not** set `NEXT_STATIC_EXPORT=false` on Render (that flag exists only for local
Node previews that must run `next start`).

Optional: add a Render **Redirect/Rewrite** rule `/admin → /admin/` (Next already emits
`admin/index.html`, so `/admin/` works out of the box).

## 3. How a change in the admin panel reaches the public site

1. Admin logs in at `/admin/` (Supabase Auth) and creates / edits / deletes a product,
   category or photo. Writes go straight to Supabase (RLS allows only authenticated users).
   Photos are uploaded to the `kriel-media` bucket; the DB stores the public URL.
2. The public page ships with the catalogue that was baked in at build time, then — on
   every visit — `LiveCatalog` re-fetches categories/products from Supabase, so the change
   is visible **immediately**, no redeploy needed.
3. Optionally trigger a Render Deploy Hook after big changes so the *pre-rendered HTML*
   (SEO/first paint) also contains the latest data.

## 4. Local development

```bash
cp .env.example .env   # fill in the Supabase values
npm install
npm run dev            # http://localhost:3000  (admin at /admin)
npm run build && npm start   # builds out/ and serves it like Render does
```
