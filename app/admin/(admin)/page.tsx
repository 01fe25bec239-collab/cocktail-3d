import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import AdminCocktailList from '@/components/admin/AdminCocktailList';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data: cocktails, error } = await supabase
    .from('cocktails')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error loading cocktails:', error.message);
    return <div className="p-4 text-red-500">Error loading cocktails. Please try again.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Manage Cocktails</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Create, edit, and reorder your cocktail menu.
          </p>
        </div>
        <Link 
          href="/admin/new/edit" 
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Cocktail
        </Link>
      </div>
      <div className="p-6">
        <AdminCocktailList initialCocktails={cocktails || []} />
      </div>
    </div>
  );
}
