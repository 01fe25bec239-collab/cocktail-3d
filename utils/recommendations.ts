import { Cocktail } from '@/types/cocktail';

const SPIRITS = ['vodka', 'gin', 'rum', 'tequila', 'mezcal', 'whiskey', 'bourbon', 'rye', 'champagne', 'cognac'];

function getSpirits(cocktail: Cocktail): string[] {
  const text = `${cocktail.name} ${cocktail.description} ${cocktail.ingredients?.map(i => i.name).join(' ')}`.toLowerCase();
  return SPIRITS.filter(spirit => text.includes(spirit));
}

export function getSimilarCocktails(current: Cocktail, all: Cocktail[]): Cocktail[] {
  const currentSpirits = getSpirits(current);
  
  return all
    .filter(c => c.id !== current.id)
    .map(c => {
      let score = 0;
      
      // 1. Spirit match (High weight: 5 points)
      const cSpirits = getSpirits(c);
      const sharedSpirits = currentSpirits.filter(s => cSpirits.includes(s));
      score += sharedSpirits.length * 5;
      
      // 2. Mood/Vibe match (Medium weight: 3 points)
      if (c.vibe_title && current.vibe_title && c.vibe_title.toLowerCase() === current.vibe_title.toLowerCase()) {
        score += 3;
      }
      
      // 3. Glass match (Low weight: 1 point)
      if (c.glass_type === current.glass_type) {
        score += 1;
      }
      
      return { cocktail: c, score };
    })
    // Sort descending by score. If scores are tied, fallback to alphabetical
    .sort((a, b) => b.score - a.score || a.cocktail.name.localeCompare(b.cocktail.name))
    .slice(0, 3) // Return top 3
    .map(x => x.cocktail);
}
