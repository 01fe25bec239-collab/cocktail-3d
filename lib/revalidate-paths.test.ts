// Runnable checks for revalidate-path mapping. Run with: tsx lib/revalidate-paths.test.ts
import assert from 'node:assert';
import {
  sanitizeRevalidatePaths,
  cocktailMutationPaths,
  HOMEPAGE_PATH,
} from './revalidate-paths';

// Homepage allowed.
assert.deepStrictEqual(sanitizeRevalidatePaths(['/']), ['/']);

// Valid slug paths kept.
assert.deepStrictEqual(
  sanitizeRevalidatePaths(['/cocktail/mojito', '/cocktail/gin-tonic-2']),
  ['/cocktail/mojito', '/cocktail/gin-tonic-2']
);

// Traversal / injection / garbage rejected.
assert.deepStrictEqual(
  sanitizeRevalidatePaths([
    '/cocktail/../../admin',
    '/cocktail/Evil',
    'https://evil.example',
    '/anything-else',
    null,
    42,
    { path: '/' },
    '/x'.repeat(500),
  ]),
  []
);

// Duplicates collapsed, order stable.
assert.deepStrictEqual(
  sanitizeRevalidatePaths(['/', '/cocktail/a', '/', '/cocktail/a']),
  ['/', '/cocktail/a']
);

// Non-array input → empty.
assert.deepStrictEqual(sanitizeRevalidatePaths(undefined), []);
assert.deepStrictEqual(sanitizeRevalidatePaths('/'), []);

// Edit without slug change → homepage + that slug only (no duplicate).
assert.deepStrictEqual(
  cocktailMutationPaths({ oldSlug: 'mojito', newSlug: 'mojito' }),
  [HOMEPAGE_PATH, '/cocktail/mojito']
);

// Edit with slug change → homepage + old + new.
assert.deepStrictEqual(
  cocktailMutationPaths({ oldSlug: 'old-name', newSlug: 'new-name' }),
  [HOMEPAGE_PATH, '/cocktail/old-name', '/cocktail/new-name']
);

// Create (no oldSlug) → homepage + new slug.
assert.deepStrictEqual(
  cocktailMutationPaths({ newSlug: 'fresh-slug' }),
  [HOMEPAGE_PATH, '/cocktail/fresh-slug']
);

// Delete → homepage + removed slug.
assert.deepStrictEqual(
  cocktailMutationPaths({ oldSlug: 'deleted-one' }),
  [HOMEPAGE_PATH, '/cocktail/deleted-one']
);

console.log('✓ revalidate-paths tests passed');
