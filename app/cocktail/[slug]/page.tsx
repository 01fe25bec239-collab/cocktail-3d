import { createClient } from '@/utils/supabase/server';
import { Cocktail } from '@/types/cocktail';
import { notFound } from 'next/navigation';
import ClientCocktailView from './ClientCocktailView';
import { Metadata } from 'next';
import { getSimilarCocktails } from '@/utils/recommendations';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const revalidate = 60;

// Fix 5: Optimize Page Transition Speed via SSG
// This queries Supabase at build time to statically generate all cocktail pages
// so there is zero server-side latency when a user clicks a cocktail card.
export async function generateStaticParams() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from('cocktails')
    .select('slug')
    .eq('is_published', true);

  if (!data) return [];

  return data.map((cocktail) => ({
    slug: cocktail.slug,
  }));
}

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
      url: `/cocktail/${cocktail.slug}`,
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

async function getRecommendations(currentCocktail: Cocktail): Promise<Cocktail[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('cocktails')
    .select('*')
    .eq('is_published', true);
    
  if (!data) return [];
  
  return getSimilarCocktails(currentCocktail, data as Cocktail[]);
}

export default async function CocktailPage({ params }: { params: { slug: string } }) {
  const cocktail = await getCocktail(params.slug);
  
  if (!cocktail) {
    notFound();
  }

  const recommendations = await getRecommendations(cocktail);

  return <ClientCocktailView cocktail={cocktail} recommendations={recommendations} />;
}

