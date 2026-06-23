import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  
  const email = formData.get('email')?.toString()?.trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  
  const redirectBase = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;

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
