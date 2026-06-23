import { createClient } from '@/utils/supabase/server';
import { Cocktail } from '@/types/cocktail';
import { notFound } from 'next/navigation';
import ClientCocktailView from './ClientCocktailView';

export const revalidate = 60;

async function getCocktail(slug: string): Promise<Cocktail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cocktails')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function CocktailPage({ params }: { params: { slug: string } }) {
  const cocktail = await getCocktail(params.slug);
  
  if (!cocktail) {
    notFound();
  }

  return <ClientCocktailView cocktail={cocktail} />;
}
