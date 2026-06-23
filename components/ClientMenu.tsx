'use client';

import { useState, useMemo } from 'react';
import { Cocktail } from '@/types/cocktail';
import Link from 'next/link';
import Image from 'next/image';

export default function ClientMenu({ cocktails }: { cocktails: Cocktail[] }) {
  const [search, setSearch] = useState('');
  const [selectedSpirit, setSelectedSpirit] = useState('All');
  const [selectedGlass, setSelectedGlass] = useState('All');
  const [abvRange, setAbvRange] = useState('All');
  const [sortBy, setSortBy] = useState('order'); // 'order' | 'abv-asc' | 'abv-desc' | 'name-asc'

  // Extract all distinct glass types
  const glassTypes = useMemo(() => {
    const types = new Set<string>();
    cocktails.forEach(c => {
      if (c.glass_type) types.add(c.glass_type);
    });
    return ['All', ...Array.from(types)];
  }, [cocktails]);

  // Major spirit groups
  const spiritBases = ['All', 'Gin', 'Vodka', 'Rum', 'Whiskey', 'Tequila', 'Champagne', 'Mezcal'];

  // Helper to check if a cocktail matches a spirit base
  const matchesSpirit = (cocktail: Cocktail, spirit: string): boolean => {
    if (spirit === 'All') return true;
    const nameLower = cocktail.name.toLowerCase();
    const descLower = cocktail.description.toLowerCase();
    const ingredientsLower = cocktail.ingredients.map(ing => ing.name.toLowerCase()).join(' ');

    const targetSpirit = spirit.toLowerCase();
    // Special check for Whiskey/Bourbon
    if (targetSpirit === 'whiskey') {
      return (
        nameLower.includes('whiskey') ||
        nameLower.includes('bourbon') ||
        nameLower.includes('rye') ||
        descLower.includes('whiskey') ||
        descLower.includes('bourbon') ||
        descLower.includes('rye') ||
        ingredientsLower.includes('whiskey') ||
        ingredientsLower.includes('bourbon') ||
        ingredientsLower.includes('rye')
      );
    }

    return (
      nameLower.includes(targetSpirit) ||
      descLower.includes(targetSpirit) ||
      ingredientsLower.includes(targetSpirit)
    );
  };

  const filteredAndSortedCocktails = useMemo(() => {
    return cocktails
      .filter(cocktail => {
        // Search filter
        const matchesSearch =
          cocktail.name.toLowerCase().includes(search.toLowerCase()) ||
          cocktail.vibe_title.toLowerCase().includes(search.toLowerCase()) ||
          cocktail.description.toLowerCase().includes(search.toLowerCase());

        // Spirit base filter
        const matchesSpiritFilter = matchesSpirit(cocktail, selectedSpirit);

        // Glass type filter
        const matchesGlassFilter =
          selectedGlass === 'All' || cocktail.glass_type === selectedGlass;

        // ABV range filter
        let matchesAbv = true;
        const abv = cocktail.abv ?? 0;
        if (abvRange === 'non-alcoholic') {
          matchesAbv = abv === 0;
        } else if (abvRange === 'low') {
          matchesAbv = abv > 0 && abv < 12;
        } else if (abvRange === 'high') {
          matchesAbv = abv >= 12;
        }

        return matchesSearch && matchesSpiritFilter && matchesGlassFilter && matchesAbv;
      })
      .sort((a, b) => {
        if (sortBy === 'abv-asc') {
          return (a.abv ?? 0) - (b.abv ?? 0);
        }
        if (sortBy === 'abv-desc') {
          return (b.abv ?? 0) - (a.abv ?? 0);
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        return a.order_index - b.order_index;
      });
  }, [cocktails, search, selectedSpirit, selectedGlass, abvRange, sortBy]);

  return (
    <div className="w-full">
      {/* Filtering Interface */}
      <div className="mb-12 p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 backdrop-blur-lg flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Search Menu</label>
            <input
              type="text"
              placeholder="Search by name, ingredients, or vibe..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-white outline-none placeholder-neutral-500 transition-all text-sm"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-cyan-500/50 text-white outline-none transition-all text-sm"
            >
              <option value="order">Curated Order</option>
              <option value="abv-asc">ABV: Low to High</option>
              <option value="abv-desc">ABV: High to Low</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* ABV Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Strength (ABV)</label>
            <select
              value={abvRange}
              onChange={e => setAbvRange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-cyan-500/50 text-white outline-none transition-all text-sm"
            >
              <option value="All">All Strengths</option>
              <option value="non-alcoholic">Non-Alcoholic (0% ABV)</option>
              <option value="low">Session / Light (Under 12% ABV)</option>
              <option value="high">Full Strength (12%+ ABV)</option>
            </select>
          </div>
        </div>

        {/* Spirit Base & Glass Filters */}
        <div className="flex flex-wrap gap-6 items-center justify-between border-t border-neutral-800/40 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mr-2">Spirit:</span>
            {spiritBases.map(spirit => (
              <button
                key={spirit}
                onClick={() => setSelectedSpirit(spirit)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedSpirit === spirit
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                {spirit}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Glass:</span>
            <select
              value={selectedGlass}
              onChange={e => setSelectedGlass(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-neutral-950/50 border border-neutral-800/80 focus:border-cyan-500/50 text-white outline-none text-xs"
            >
              {glassTypes.map(glass => (
                <option key={glass} value={glass}>
                  {glass}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cocktails Grid */}
      {filteredAndSortedCocktails.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredAndSortedCocktails.map((cocktail, index) => {
            const accentColor = cocktail.theme_color_primary || '#f59e0b';
            const dynamicImageUrl =
              cocktail.backdrop_image_url ||
              `/assets/images/cocktail-image-${String(index + 1).padStart(2, '0')}.webp`;
            return (
              <Link
                key={cocktail.id}
                href={`/cocktail/${cocktail.slug}`}
                prefetch={true}
                onMouseEnter={() => {
                  // Preload the heavy Spline library when user hovers over a card
                  import('@splinetool/react-spline');
                }}
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
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/10">
          <p className="text-neutral-500 text-lg mb-2">No cocktails match your selected filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedSpirit('All');
              setSelectedGlass('All');
              setAbvRange('All');
            }}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
