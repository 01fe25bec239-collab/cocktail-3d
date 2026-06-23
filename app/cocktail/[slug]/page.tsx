import { createClient } from '@/utils/supabase/server';
import { Cocktail } from '@/types/cocktail';
import { notFound } from 'next/navigation';
import ClientCocktailView from './ClientCocktailView';
import { Metadata } from 'next';

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
  return data as Cocktail;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cocktail = await getCocktail(params.slug);
  if (!cocktail) return { title: 'Cocktail Not Found' };
  
  const title = cocktail.vibe_title ? `${cocktail.name} — ${cocktail.vibe_title} | Cocktail 3D Showcase` : `${cocktail.name} | Cocktail 3D Showcase`;
  const description = cocktail.description || `Discover the visual artistry and flavor notes of ${cocktail.name}.`;
  const images = cocktail.backdrop_image_url ? [{ url: cocktail.backdrop_image_url, alt: cocktail.name }] : [];
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cocktail.backdrop_image_url ? [cocktail.backdrop_image_url] : [],
    },
  };
}

async function getRecommendations(currentSlug: string): Promise<Cocktail[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('cocktails')
    .select('*')
    .eq('is_published', true)
    .neq('slug', currentSlug)
    .limit(3);
  return (data as Cocktail[]) || [];
}

export default async function CocktailPage({ params }: { params: { slug: string } }) {
  const cocktail = await getCocktail(params.slug);
  
  if (!cocktail) {
    notFound();
  }

  const recommendations = await getRecommendations(params.slug);

  return <ClientCocktailView cocktail={cocktail} recommendations={recommendations} />;
}

