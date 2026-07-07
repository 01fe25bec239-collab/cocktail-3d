# Cocktail 3D Showcase

An immersive 3D cocktail menu built with Next.js. Each cocktail has a detail page
with a Spline 3D scene, video/image backdrop, ingredients, and recommendations;
the home page renders a filterable menu over a WebGL particle background.

## Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **3D:** [Spline](https://spline.design) (`@splinetool/react-spline`) for cocktail
  scenes; React Three Fiber / three.js for the home-page particle background
- **Backend:** Supabase — Postgres (RLS), Auth (cookie sessions), Storage (media bucket)
- **Hosting:** Netlify

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev                  # http://localhost:3000
```

### Environment variables

See [`.env.example`](.env.example). Required:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (client + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key (client + server reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side scripts only (seed/backup) — never exposed to the client |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata/sitemap (optional) |

## Database

SQL migrations live in [`supabase/migrations`](supabase/migrations) and run in
filename order. Apply them via the Supabase SQL editor or CLI.

> **Admin access:** writes to `cocktails` and the `media` storage bucket are
> restricted to an allowlist (`admin_users` table). After applying
> `20260706000000_admin_allowlist.sql`, register your admin account:
>
> ```sql
> INSERT INTO admin_users (user_id)
> SELECT id FROM auth.users WHERE email = 'your-admin@email.here';
> ```
>
> Also disable public sign-ups in Dashboard → Authentication → Sign In / Providers.

Seed the catalog from `data/cocktails.json` (uses the service-role key):

```bash
npm run seed
```

## Admin panel

`/admin` is protected by Supabase Auth (middleware redirects unauthenticated
users to `/admin/login`). Create/edit/publish cocktails and upload media there.

## Scripts

- `npm run dev` – dev server
- `npm run build` – production build (runs `next-sitemap` on postbuild)
- `npm run start` – serve the production build
- `npm run lint` – ESLint
- `npm run seed` – seed Supabase from `data/cocktails.json`
- `npm test` – runs `utils/recommendations.test.ts`

## Deployment

Configured for Netlify (see [`netlify.toml`](netlify.toml), which also sets
security headers except the CSP — the CSP lives once in `next.config.mjs`).
Set the environment variables above in the Netlify dashboard.
