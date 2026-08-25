// Canonical production URL. Used ONLY for metadata that must be absolute
// regardless of the serving host: metadataBase (app/layout.tsx), canonical/OG
// URLs (app/page.tsx) and the sitemap (next-sitemap.config.js).
//
// It is deliberately NOT used for auth redirects — those derive their base
// from the incoming request (lib/request-origin.ts) so login/logout always
// stay on localhost / preview / production respectively (ADMIN-001).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://cocktail-3d.netlify.app';
