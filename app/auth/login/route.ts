import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { isRateLimited } from '@/utils/rate-limit';
import { isSameOrigin } from '@/utils/verify-origin';
import { getRequestOrigin } from '@/lib/request-origin';

export async function POST(request: Request) {
  // Redirect back to whatever host served this login form (ADMIN-001):
  // localhost stays on localhost, preview deployments stay on their preview.
  // The CSRF guard below must run first — it proves any present Origin header
  // equals Host before either is trusted for redirect construction.
  if (!isSameOrigin(request)) {
    return new NextResponse('Invalid origin', { status: 403 });
  }
  const redirectBase = getRequestOrigin(request);

  // Extract client IP and apply rate limiting. Prefer Netlify's
  // x-nf-client-connection-ip, which is set by the edge and not spoofable by the
  // client, over x-forwarded-for (whose first entry is attacker-controlled).
  const ip =
    request.headers.get('x-nf-client-connection-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    '127.0.0.1';
  const { limited, retryAfter } = isRateLimited(ip);
  
  if (limited) {
    return NextResponse.redirect(
      `${redirectBase}/admin/login?error=${encodeURIComponent(`Too many login attempts. Please try again in ${retryAfter} seconds.`)}`,
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const email = formData.get('email')?.toString()?.trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  
  if (!email || !password) {
    return NextResponse.redirect(
      `${redirectBase}/admin/login?error=Missing+credentials`,
      { status: 303 }
    );
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.redirect(
      `${redirectBase}/admin/login?error=${encodeURIComponent(error.message)}`,
      { status: 303 }
    );
  }

  return NextResponse.redirect(`${redirectBase}/admin`, { status: 303 });
}
