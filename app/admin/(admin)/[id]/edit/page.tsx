import { createClient } from '@/utils/supabase/server';
import { Cocktail } from '@/types/cocktail';
import CocktailForm from '@/components/admin/CocktailForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditCocktailPage({
  params,
}: {
  params: { id: string };
}) {
  const isNew = params.id === 'new';
  let cocktail: Cocktail | null = null;

  if (!isNew) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cocktails')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      notFound();
    }
    cocktail = data as Cocktail;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {isNew ? 'Create New Cocktail' : `Edit: ${cocktail?.name}`}
        </h1>
        
        <CocktailForm initialData={cocktail} />
      </div>
    </div>
  );
}
