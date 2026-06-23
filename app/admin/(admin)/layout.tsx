import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-gray-900">Admin Panel</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/admin" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Cocktails
                </Link>
                <Link href="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  View Site
                </Link>
              </div>
            </div>
            {user && (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-4">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
