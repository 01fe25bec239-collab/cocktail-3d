import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/utils/verify-origin';
import { getRequestOrigin } from '@/lib/request-origin';

export async function POST(request: Request) {
  // Redirect back to the host that served this form (see ADMIN-001 in
  // app/auth/login/route.ts); isSameOrigin must run before origin is trusted.
  if (!isSameOrigin(request)) {
    return new NextResponse('Invalid origin', { status: 403 });
  }
  const redirectBase = getRequestOrigin(request);

  const supabase = createClient();
  await supabase.auth.signOut();
  
  return NextResponse.redirect(`${redirectBase}/admin/login`, {
    status: 303,
  });
}
