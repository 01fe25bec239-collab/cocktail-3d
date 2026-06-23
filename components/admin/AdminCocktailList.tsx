'use client';

import { Cocktail } from '@/types/cocktail';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AdminCocktailList({ initialCocktails }: { initialCocktails: Cocktail[] }) {
  const [cocktails, setCocktails] = useState<Cocktail[]>(initialCocktails);
  const [loadingPublishId, setLoadingPublishId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setCocktails(initialCocktails);
  }, [initialCocktails]);

  const togglePublish = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setCocktails(cocktails.map(c => c.id === id ? { ...c, is_published: !currentStatus } : c));
    setLoadingPublishId(id);

    const { error } = await supabase
      .from('cocktails')
      .update({ is_published: !currentStatus })
      .eq('id', id);
    
    setLoadingPublishId(null);

    if (!error) {
      router.refresh();
    } else {
      // Revert on error
      setCocktails(cocktails.map(c => c.id === id ? { ...c, is_published: currentStatus } : c));
      alert('Failed to update status');
    }
  };

  const deleteCocktail = async (id: string) => {
    const { error } = await supabase.from('cocktails').delete().eq('id', id);
    if (!error) {
      setCocktails(cocktails.filter(c => c.id !== id));
      setDeleteConfirmId(null);
      router.refresh();
    } else {
      alert('Failed to delete');
    }
  };

  return (
    <>
      <ul className="divide-y divide-gray-200">
        {cocktails.map((cocktail) => (
          <li key={cocktail.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-2 transition-colors rounded-md">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{cocktail.name}</span>
              <span className="text-xs text-gray-500">{cocktail.slug}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => togglePublish(cocktail.id, cocktail.is_published)}
                disabled={loadingPublishId === cocktail.id}
                className={`px-3 py-1 text-xs font-medium rounded-full disabled:opacity-50 ${cocktail.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {loadingPublishId === cocktail.id ? 'Updating...' : (cocktail.is_published ? 'Published' : 'Draft')}
              </button>
              <Link 
                href={`/admin/${cocktail.id}/edit`}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Edit
              </Link>
              <button 
                onClick={() => setDeleteConfirmId(cocktail.id)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {cocktails.length === 0 && (
          <li className="py-4 text-sm text-gray-500 text-center">No cocktails found.</li>
        )}
      </ul>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this cocktail? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCocktail(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
