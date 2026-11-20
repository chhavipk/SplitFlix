# SplitFlix — OTT subscription store

A self-contained web app for selling shared streaming subscriptions: customer
storefront, UPI checkout with transaction reference, and a full admin dashboard.

**Stack:** React 19 + TanStack Start (server functions + SSR), Tailwind CSS 4,
and a hosted Postgres + auth backend (Supabase-compatible).

---

## What's included

| Area | Pages |
| --- | --- |
| Storefront | `/` home, `/plans` catalog with search + categories, `/product/:id` details, `/combos` multi-service builder, `/reviews`, `/how-it-works`, `/refund-policy`, `/contact` |
| Shopping | `/cart`, `/saved` (favourites) |
| Customer | `/auth` sign in / sign up, `/account` orders + credentials, `/checkout/:planId`, `/checkout-cart` |
| Admin | `/admin` overview + revenue, `/admin/services`, `/admin/accounts`, `/admin/orders`, `/admin/customers`, `/admin/tickets`, `/admin/reviews`, `/admin/settings` |
| SEO | `/sitemap.xml`, `/robots.txt`, per-page titles and descriptions |

Business rules that matter:

- Order prices are set by the database, never by the browser.
- Combos add up existing plan prices — no extra bundle discount.
- No refunds after login credentials have been provided.
- Reviews need a fulfilled order and admin approval before they appear publicly.
- The first account to sign up becomes the admin automatically.

---

## 1. Create the backend

1. Create a database project (Supabase or any Postgres with the same auth
   service) and open its **SQL editor**.
2. Paste the whole contents of [`database/schema.sql`](database/schema.sql) and
   run it **once**. It creates every table, permission, trigger, function and
   the starter catalog.
3. Turn on **Email** sign-in in the auth settings and set the **Site URL** to
   your live address.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | your project's API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_PUBLISHABLE_KEY` | the publishable (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret key — server side only, never `VITE_` |

## 3. Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # business-rule tests
npm run build      # production build into dist/
npm run preview    # serve the build locally
```

## 4. Publish it

**Vercel** — push this folder to a private GitHub repo, import the repo in
Vercel, keep the detected framework, set the build command to `npm run build`,
add the variables from `.env.example` (Production), deploy, then add your own
domain under **Settings → Domains** and point its DNS records at Vercel. Set
`NITRO_PRESET=vercel`.

**Netlify** — same idea, `NITRO_PRESET=netlify`.

**Cloudflare Workers** — `npm run build` then `npx wrangler deploy`
(`NITRO_PRESET=cloudflare-module`, the default).

**Any Node host** — `NITRO_PRESET=node-server npm run build`, then run
`node dist/server/index.mjs`.

After the first deploy: sign up (that account becomes admin), open
**Admin → Settings** and put in your real UPI ID, UPI name and WhatsApp number.
Checkout stays blocked until the UPI ID is a real one.

---

## Layout

```
database/schema.sql      one-shot database setup
drizzle/migrations/      incremental schema changes
src/routes/              file-based pages (URLs match file names)
src/routes/_authenticated/  pages that need a login; admin/ is inside it
src/components/          UI pieces
src/lib/                 business rules, queries, admin actions
src/integrations/supabase/  backend clients
src/test/                rule tests
```

## Notes

- `.env` is git-ignored. Never commit filled-in keys, and never put the secret
  key in a `VITE_` variable — those are shipped to every visitor's browser.
- `src/routeTree.gen.ts` and `src/integrations/supabase/types.ts` are generated;
  don't edit them by hand.
- Passwords are stored hashed by the auth service, so no one can read them.
  Admins reset a password instead of viewing it.
