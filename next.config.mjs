/** @type {import('next').NextConfig} */

// Derive the Supabase origin/host from env so the config isn't pinned to one
// project. Falls back to the current project's URL for local builds without env.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dwgvrvudrxkktgijpzii.supabase.co';
const supabaseHost = new URL(supabaseUrl).host;
// Supabase Realtime uses wss://, which CSP scheme-matching does NOT cover via
// an https:// source expression. Including it keeps future realtime usage from
// being silently blocked by connect-src.
const supabaseWssUrl = supabaseUrl.replace(/^https:/, 'wss:');

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://prod.spline.design; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: ${supabaseUrl}; media-src 'self' blob: data: ${supabaseUrl}; connect-src 'self' ${supabaseUrl} ${supabaseWssUrl} https://prod.spline.design https://resources.spline.design; font-src 'self' https://fonts.gstatic.com; worker-src 'self' blob:; frame-src 'self' https://prod.spline.design; object-src 'none';`,
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
