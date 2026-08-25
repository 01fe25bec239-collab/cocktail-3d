// Regression test for DEFECT-001: spirit filters must match whole words only.
// No framework — run with: npm test
import assert from 'node:assert';
import { Cocktail } from '../types/cocktail';
import { matchesSpirit } from './spirit-filter';

// Minimal fixtures — only fields matchesSpirit reads.
const make = (over: Partial<Cocktail>): Cocktail => ({
  id: over.id!, slug: over.id!, name: over.name ?? '', order_index: 0,
  is_published: true, vibe_title: over.vibe_title ?? '', description: over.description ?? '',
  ingredients: over.ingredients ?? [], taste_notes: '', glass_type: over.glass_type ?? '',
  abv: null, theme_color_primary: '', theme_color_secondary: '', liquid_color: '',
  backdrop_video_url: null, backdrop_image_url: null, particle_effect: 'none',
});

const ing = (name: string) => ({ name, amount: '1 oz' });

// Gin matches legitimate gin ingredients.
for (const name of ['Gin', 'Dry Gin', 'London Dry Gin', 'Old Tom Gin', 'Navy Strength Gin']) {
  assert.ok(
    matchesSpirit(make({ ingredients: [ing(name)] }), 'Gin'),
    `Gin must match ingredient "${name}"`
  );
}
assert.ok(matchesSpirit(make({ name: 'Gin & Tonic' }), 'Gin'), 'Gin must match cocktail name');

// Gin must NOT match "gin" substrings inside unrelated words/ingredients.
for (const trap of ['Ginger Beer', 'Ginger Syrup', 'Ginger Ale']) {
  assert.ok(
    !matchesSpirit(make({ ingredients: [ing(trap)] }), 'Gin'),
    `Gin must not match ingredient "${trap}"`
  );
  assert.ok(
    !matchesSpirit(make({ description: `served under hanging lanterns with ${trap}` }), 'Gin'),
    `Gin must not match "${trap}" in description`
  );
}

// Real-world shape of the defect: Dark & Stormy stays out of Gin…
const darkAndStormy = make({
  name: 'Dark & Stormy',
  ingredients: [ing('Dark Rum'), ing('Ginger Beer')],
});
assert.ok(!matchesSpirit(darkAndStormy, 'Gin'), 'Dark & Stormy is not a gin cocktail');
// …and Moscow Mule is Vodka, never Gin.
const moscowMule = make({
  name: 'Moscow Mule',
  ingredients: [ing('Vodka'), ing('Ginger Beer')],
});
assert.ok(matchesSpirit(moscowMule, 'Vodka'), 'Moscow Mule matches Vodka');
assert.ok(!matchesSpirit(moscowMule, 'Gin'), 'Moscow Mule must not match Gin');

// Other spirits keep matching their bases.
assert.ok(matchesSpirit(darkAndStormy, 'Rum'), 'Dark & Stormy matches Rum');
assert.ok(matchesSpirit(make({ ingredients: [ing('Tequila')] }), 'Tequila'));
assert.ok(matchesSpirit(make({ ingredients: [ing('Champagne')] }), 'Champagne'));
assert.ok(matchesSpirit(make({ ingredients: [ing('Mezcal')] }), 'Mezcal'));

// Whiskey alias regression: whiskey, bourbon and rye all count as Whiskey.
assert.ok(matchesSpirit(make({ ingredients: [ing('Bourbon')] }), 'Whiskey'));
assert.ok(matchesSpirit(make({ ingredients: [ing('Rye')] }), 'Whiskey'));
assert.ok(matchesSpirit(make({ name: 'Whiskey Sour' }), 'Whiskey'));
// "rye" must not leak into unrelated words either.
assert.ok(
  !matchesSpirit(make({ description: 'finished with ryegrass' }), 'Whiskey'),
  'Whiskey must not match lookalike words'
);

// "All" always matches.
assert.ok(matchesSpirit(make({}), 'All'));

console.log('✓ spirit-filter tests passed');
