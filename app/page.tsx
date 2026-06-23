import { supabase } from '@/lib/supabase';
import { Cocktail } from '@/types/cocktail';
import dynamic from 'next/dynamic';
import ClientMenu from '@/components/ClientMenu';

const BlackHoleBackground = dynamic(
  () => import('@/components/BlackHoleBackground'),
  { ssr: false }
);

async function getCocktails(): Promise<Cocktail[] | null> {
  if (!supabase) {
    console.warn('Supabase not configured — skipping cocktail fetch.');
    return null;
  }

  const { data, error } = await supabase
    .from('cocktails')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Failed to fetch cocktails:', error.message);
    return null;
  }

  return (data as Cocktail[]) ?? [];
}

export const revalidate = 0;

export default async function Home() {
  const cocktails = await getCocktails();

  return (
    <main className="min-h-screen bg-transparent text-white font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      <BlackHoleBackground />

      {/* Header */}
      <header className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto relative z-10">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
          Sip the Extraordinary
        </h1>
        <p className="text-lg md:text-xl text-neutral-200 font-medium tracking-wide max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
          A sensory journey through avant-garde mixology, where master craftsmanship meets liquid choreography.
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto mt-8 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.8)]" />
      </header>

      {/* Cocktails Grid */}
      <section className="px-6 pb-32 max-w-7xl mx-auto relative z-10">
        {cocktails === null ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-red-400 text-lg">Failed to load the cocktail collection. Please try again later.</p>
          </div>
        ) : cocktails.length > 0 ? (
          <ClientMenu cocktails={cocktails} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-neutral-400 text-lg">No cocktails published yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
