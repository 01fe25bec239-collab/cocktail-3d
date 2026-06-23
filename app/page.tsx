import { supabase } from '@/lib/supabase';
import { Cocktail } from '@/types/cocktail';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {cocktails.map((cocktail, index) => {
              const accentColor = cocktail.theme_color_primary || '#f59e0b';
              const dynamicImageUrl = cocktail.backdrop_image_url || `/assets/images/cocktail-image-${String(index + 1).padStart(2, '0')}.png`;
              return (
                <Link
                  key={cocktail.id}
                  href={`/cocktail/${cocktail.slug}`}
                  className="group relative flex flex-col justify-between h-[420px] rounded-2xl bg-neutral-900/30 backdrop-blur-md border border-neutral-800/40 overflow-hidden hover:border-neutral-700/60 transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                >
                  {/* Backdrop Image */}
                  <div className="absolute inset-0 -z-10 overflow-hidden">
                    {dynamicImageUrl && (
                      <Image
                        src={dynamicImageUrl}
                        alt={cocktail.name}
                        fill
                        className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.4] group-hover:brightness-[0.45]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    )}
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                  </div>

                  {/* Card Header (Vibe & Tag) */}
                  <div className="p-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400 group-hover:text-white transition-colors duration-300">
                      {cocktail.vibe_title || 'Premium Collection'}
                    </span>
                  </div>

                  {/* Card Footer (Name & Details) */}
                  <div className="p-6 mt-auto">
                    <h3
                      className="text-2xl font-bold tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300"
                      style={{ color: accentColor }}
                    >
                      {cocktail.name}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2 mb-4">
                      {cocktail.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {cocktail.glass_type && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/30 text-neutral-300">
                          {cocktail.glass_type}
                        </span>
                      )}
                      {cocktail.abv !== null && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/30 text-amber-500/90">
                          {cocktail.abv}% ABV
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Hover Accent Line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                    style={{ backgroundColor: accentColor }}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-neutral-400 text-lg">No cocktails published yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
