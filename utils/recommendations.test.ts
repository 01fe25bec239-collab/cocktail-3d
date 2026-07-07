// Runnable check for getSimilarCocktails scoring. No framework — run with:
//   npm test   (tsx utils/recommendations.test.ts)
import assert from 'node:assert';
import { Cocktail } from '../types/cocktail';
import { getSimilarCocktails } from './recommendations';

// Minimal fixtures — only the fields the scorer reads.
const make = (over: Partial<Cocktail>): Cocktail => ({
  id: over.id!, slug: over.id!, name: over.name ?? '', order_index: 0,
  is_published: true, vibe_title: over.vibe_title ?? '', description: over.description ?? '',
  ingredients: over.ingredients ?? [], taste_notes: '', glass_type: over.glass_type ?? '',
  abv: null, theme_color_primary: '', theme_color_secondary: '', liquid_color: '',
  backdrop_video_url: null, backdrop_image_url: null, particle_effect: 'none',
});

const current = make({ id: 'cur', name: 'Whiskey Sour', vibe_title: 'Cozy', glass_type: 'Rocks' });

const shareSpirit = make({ id: 'a', name: 'Old Fashioned', description: 'whiskey forward', vibe_title: 'x', glass_type: 'y' });
const shareVibe   = make({ id: 'b', name: 'Mojito', vibe_title: 'Cozy', glass_type: 'y' });
const shareGlass  = make({ id: 'c', name: 'Negroni', vibe_title: 'x', glass_type: 'Rocks' });
const unrelated   = make({ id: 'd', name: 'Margarita', vibe_title: 'x', glass_type: 'y' });

const ranked = getSimilarCocktails(current, [current, shareSpirit, shareVibe, shareGlass, unrelated]);

// Excludes self, caps at 3.
assert.ok(!ranked.some(c => c.id === 'cur'), 'must exclude the current cocktail');
assert.strictEqual(ranked.length, 3, 'returns at most 3');

// Spirit match (5) > vibe (3) > glass (1).
assert.strictEqual(ranked[0].id, 'a', 'shared spirit ranks first');
assert.strictEqual(ranked[1].id, 'b', 'shared vibe ranks second');
assert.strictEqual(ranked[2].id, 'c', 'shared glass ranks third');

// Tie-break: equal scores fall back to alphabetical name order.
const tieA = make({ id: 't1', name: 'Zeta', glass_type: 'Rocks' });
const tieB = make({ id: 't2', name: 'Alpha', glass_type: 'Rocks' });
const tie = getSimilarCocktails(current, [current, tieA, tieB]);
assert.strictEqual(tie[0].name, 'Alpha', 'alphabetical tie-break');

console.log('✓ recommendations tests passed');
