import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { isRateLimited } from '@/utils/rate-limit';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;

  // Extract client IP and apply rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
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
