import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-8">Admin Login</h2>
        
        {searchParams?.error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
            {searchParams.error}
          </div>
        )}

        <form action="/auth/login" method="post" className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              name="email"
              type="email"
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              name="password"
              type="password"
              required 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
            />
          </div>
          <button 
            type="submit" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
