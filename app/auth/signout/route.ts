import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/utils/verify-origin';
import { SITE_URL } from '@/lib/site';

export async function POST(request: Request) {
  // Canonical redirect base — never derived from a (potentially spoofed) Host.
  const redirectBase = SITE_URL;

  // CSRF guard: reject cross-origin or malformed-origin form posts.
  if (!isSameOrigin(request)) {
    return new NextResponse('Invalid origin', { status: 403 });
  }

  const supabase = createClient();
  await supabase.auth.signOut();
  
  return NextResponse.redirect(`${redirectBase}/admin/login`, {
    status: 303,
  });
}
