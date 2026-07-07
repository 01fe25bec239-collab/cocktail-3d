import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;

  // CSRF guard: reject cross-origin form posts.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return new NextResponse('Invalid origin', { status: 403 });
  }

  const supabase = createClient();
  await supabase.auth.signOut();
  
  return NextResponse.redirect(`${redirectBase}/admin/login`, {
    status: 303,
  });
}
