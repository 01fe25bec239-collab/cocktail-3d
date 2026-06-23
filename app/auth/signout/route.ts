import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;
  
  const supabase = createClient();
  await supabase.auth.signOut();
  
  return NextResponse.redirect(`${redirectBase}/admin/login`, {
    status: 303,
  });
}
