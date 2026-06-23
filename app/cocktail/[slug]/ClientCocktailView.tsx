'use client';

import { Cocktail } from '@/types/cocktail';
import Link from 'next/link';
import Image from 'next/image';
import SplineScene from '@/components/SplineScene';
import DoubleBufferedMedia from '@/components/DoubleBufferedMedia';
import { useState, useEffect } from 'react';

export default function ClientCocktailView({
  cocktail,
  recommendations,
}: {
  cocktail: Cocktail;
  recommendations: Cocktail[];
}) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const preloadVideo = (src?: string) => {
    if (!src) return;
    if (document.querySelector(`link[href="${src}"]`)) return; // already preloading
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = src;
    document.head.appendChild(link);
  };

  useEffect(() => {
    // Check for reduced motion and mobile
    const mediaQueryMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setIsReducedMotion(mediaQueryMotion.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);

    mediaQueryMotion.addEventListener('change', handleMotionChange);

    return () => {
      mediaQueryMotion.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <div 
      className="w-screen h-[100dvh] text-white overflow-hidden flex flex-col md:flex-row relative font-sans"
      style={{ backgroundColor: cocktail.theme_color_primary || '#000' }}
    >
      {/* Background Media (renders behind everything) */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <DoubleBufferedMedia 
          src={cocktail.backdrop_video_url || cocktail.backdrop_image_url || ''} 
          poster={cocktail.backdrop_image_url || undefined}
          isVideo={!!cocktail.backdrop_video_url}
          isReducedMotion={isReducedMotion}
        />
      </div>

      {/* Dark gradient scrim behind the text for contrast */}
      <div className="absolute top-0 left-0 w-full md:w-[60%] h-full z-10 bg-gradient-to-r from-black/95 via-black/80 to-transparent pointer-events-none" />

      {/* Left Container: Details (40% width on md screens) */}
      <div className="w-full md:w-[40%] h-[45dvh] md:h-full overflow-y-auto p-6 md:p-12 z-20 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800/50 bg-neutral-950/40 backdrop-blur-md relative shadow-2xl">
        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 mb-6 text-xs font-bold tracking-widest text-neutral-400 hover:text-white uppercase transition-colors"
          >
            ← Back to Menu
          </Link>
          
          <h1 
            className="text-4xl md:text-5xl font-extrabold mb-1 tracking-tighter" 
            style={{ color: cocktail.theme_color_primary || '#f59e0b', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}
          >
            {cocktail.name}
          </h1>
          <p className="text-sm text-neutral-300 font-semibold tracking-wider uppercase mb-6 pb-4 border-b border-neutral-800/80 drop-shadow-md">
            {cocktail.vibe_title || 'Premium Mixology'}
          </p>
          
          <p className="text-base text-neutral-200 leading-relaxed mb-6 drop-shadow-md font-medium">
            {cocktail.description}
          </p>

          {/* Ingredients list */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-3 drop-shadow-md">Ingredients</h3>
            <ul className="space-y-2.5">
              {cocktail.ingredients?.map((ing, i: number) => (
                <li key={i} className="flex justify-between border-b border-neutral-800/40 pb-1.5 text-sm text-neutral-200">
                  <span className="font-medium drop-shadow-sm">{ing.name}</span>
                  <span className="text-neutral-400 font-semibold drop-shadow-sm">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Taste notes */}
          {cocktail.taste_notes && (
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2 drop-shadow-md">Taste Profile</h3>
              <p className="text-neutral-300 text-sm italic font-medium drop-shadow-sm">&quot;{cocktail.taste_notes}&quot;</p>
            </div>
          )}

          {/* You Might Also Like section */}
          <div className="mb-8 mt-4 pt-6 border-t border-neutral-800/60">
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-bold mb-4 drop-shadow-md">You Might Also Like</h3>
            {recommendations && recommendations.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {recommendations.map(rec => (
                  <Link 
                    key={rec.id} 
                    href={`/cocktail/${rec.slug}`}
                    className="flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-neutral-800/50 hover:border-neutral-700/60 transition-all p-3 text-center"
                    onMouseEnter={() => preloadVideo(rec.backdrop_video_url || undefined)}
                    onTouchStart={() => preloadVideo(rec.backdrop_video_url || undefined)}
                  >
                    <div className="relative w-full h-16 rounded-lg overflow-hidden mb-2 bg-neutral-950">
                      {rec.backdrop_image_url && !imgErrors[rec.id] ? (
                        <Image 
                          src={rec.backdrop_image_url} 
                          alt={rec.name}
                          fill
                          className="object-cover brightness-75"
                          onError={() => setImgErrors(prev => ({ ...prev, [rec.id]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800" />
                      )}
                    </div>
                    <span 
                      className="text-xs font-bold tracking-tight line-clamp-1"
                      style={{ color: rec.theme_color_primary || '#f59e0b' }}
                    >
                      {rec.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href="/" className="block w-full py-4 text-center border border-neutral-800 rounded-xl text-sm font-semibold text-neutral-300 bg-neutral-900/50 hover:bg-neutral-800 transition-colors">
                See All Cocktails
              </Link>
            )}
          </div>
        </div>

        {/* Footer meta info within the left column */}
        <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap gap-2 items-center justify-between text-xs text-neutral-300 max-w-xl mx-auto w-full">
          {cocktail.glass_type && (
            <span className="uppercase tracking-wider font-semibold drop-shadow-sm">
              Glass: <strong className="text-white">{cocktail.glass_type}</strong>
            </span>
          )}
          {cocktail.abv !== null && (
            <span className="font-bold text-amber-400 drop-shadow-md">
              {cocktail.abv}% ABV
            </span>
          )}
        </div>
      </div>

      {/* Right Container: 3D Scene */}
      <div 
        className="w-full md:w-[60%] h-[55dvh] md:h-full relative overflow-hidden flex-1 z-10"
      >
        {cocktail.spline_scene_url ? (
          <SplineScene 
            sceneUrl={cocktail.spline_scene_url} 
            fallbackImageUrl={cocktail.backdrop_image_url || ''} 
            altText={cocktail.name} 
          />
        ) : null}
        
        {/* Spline Watermark Corner Cover */}
        <div 
          className="absolute bottom-0 right-0 w-40 h-12 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom right, transparent, #0a0a0a)' }}
        />
      </div>
    </div>
  );
}
