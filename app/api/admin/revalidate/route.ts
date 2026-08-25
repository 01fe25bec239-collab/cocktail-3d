import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { isSameOrigin } from '@/utils/verify-origin';
import { sanitizeRevalidatePaths } from '@/lib/revalidate-paths';

// On-demand ISR invalidation for admin mutations (ADMIN-002).
//
// Public routes are statically cached with `revalidate = 60`; without this,
// admin edits could take up to a minute to appear. The admin client calls this
// AFTER its Supabase mutation has succeeded.
//
// Authorization mirrors the admin shell exactly: same-origin POST + an
// authenticated session that passes the is_admin allowlist RPC. Fail closed —
// any RPC error means no user, which means 403.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return new NextResponse('Invalid origin', { status: 403 });
  }

  const supabase = createClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 });
  }

  const paths = sanitizeRevalidatePaths((body as { paths?: unknown })?.paths);
  if (paths.length === 0) {
    return NextResponse.json({ revalidated: [], when: new Date().toISOString() });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: paths, when: new Date().toISOString() });
}
