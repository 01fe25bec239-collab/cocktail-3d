import { supabase } from '@/lib/supabase';
import { Cocktail } from '@/types/cocktail';
import { notFound } from 'next/navigation';
import ClientCocktailView from './ClientCocktailView';
import { Metadata } from 'next';
import { getSimilarCocktails } from '@/utils/recommendations';
import { cache } from 'react';
import { MENU_COLUMNS } from '@/lib/cocktail-columns';

export const revalidate = 60;

// Fix 5: Optimize Page Transition Speed via SSG
// This queries Supabase at build time to statically generate all cocktail pages
// so there is zero server-side latency when a user clicks a cocktail card.
// These reads only touch published rows, so they use the plain anon client —
// the cookie-bound server client would force dynamic rendering and defeat SSG.
export async function generateStaticParams() {
  if (!supabase) return [];

  const { data } = await supabase
    .from('cocktails')
    .select('slug')
    .eq('is_published', true);

  if (!data) return [];

  return data.map((cocktail) => ({
    slug: cocktail.slug,
  }));
}

// React `cache` deduplicates this query: generateMetadata and the page
// component both need the row, and without dedupe each ISR regeneration paid
// for two identical sequential PostgREST round-trips.
const getCocktail = cache(async (slug: string): Promise<Cocktail | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('cocktails')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) return null;
  return data as Cocktail;
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cocktail = await getCocktail(params.slug);
  if (!cocktail) {
    // Throwing here (not just returning fallback metadata) is what makes the
    // ISR-fallback render record a real HTTP 404 — otherwise unknown slugs are
    // served (and cached) with status 200 + "not found" content (soft 404).
    notFound();
  }
  
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
  if (!supabase) return [];

  // Only the columns consumed by the scoring algorithm and the recommendation
  // cards — not the full row (videos/scenes/notes of every cocktail).
  // getSimilarCocktails() excludes the current cocktail itself.
  const { data } = await supabase
    .from('cocktails')
    .select(MENU_COLUMNS)
    .eq('is_published', true);

  if (!data) return [];

  return getSimilarCocktails(currentCocktail, data as unknown as Cocktail[]);
}

export default async function CocktailPage({ params }: { params: { slug: string } }) {
  const cocktail = await getCocktail(params.slug);
  
  if (!cocktail) {
    notFound();
  }

  const recommendations = await getRecommendations(cocktail);

  return <ClientCocktailView cocktail={cocktail} recommendations={recommendations} />;
}

