const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SPIRITS = ['vodka', 'gin', 'rum', 'tequila', 'mezcal', 'whiskey', 'bourbon', 'rye', 'champagne', 'cognac'];

function getSpirits(cocktail) {
  const text = `${cocktail.name} ${cocktail.description} ${cocktail.ingredients?.map(i => i.name).join(' ')}`.toLowerCase();
  return SPIRITS.filter(spirit => text.includes(spirit));
}

function getSimilarCocktails(current, all) {
  const currentSpirits = getSpirits(current);
  return all
    .filter(c => c.id !== current.id)
    .map(c => {
      let score = 0;
      const cSpirits = getSpirits(c);
      const sharedSpirits = currentSpirits.filter(s => cSpirits.includes(s));
      score += sharedSpirits.length * 5;
      if (c.vibe_title && current.vibe_title && c.vibe_title.toLowerCase() === current.vibe_title.toLowerCase()) {
        score += 3;
      }
      if (c.glass_type === current.glass_type) {
        score += 1;
      }
      return { cocktail: c, score };
    })
    .sort((a, b) => b.score - a.score || a.cocktail.name.localeCompare(b.cocktail.name))
    .slice(0, 3)
    .map(x => ({ name: x.cocktail.name, score: x.score }));
}

async function check() {
  const { data } = await supabase.from('cocktails').select('*').eq('is_published', true);
  const margarita = data.find(c => c.slug === 'margarita-neon-rooftop-party');
  console.log("Margarita Spirits:", getSpirits(margarita));
  console.log("Recommendations:", getSimilarCocktails(margarita, data));
}

check();
