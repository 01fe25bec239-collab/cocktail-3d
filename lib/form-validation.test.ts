// Runnable checks for form validation + db error mapping + file signatures.
// Run with: tsx lib/form-validation.test.ts
import assert from 'node:assert';
import {
  isValidSlug,
  isValidAbv,
  isValidOrderIndex,
  describeDbError,
  PARTICLE_EFFECTS,
} from './form-validation';
import { matchFileKind } from './file-magic';

// --- slug ---
assert.strictEqual(isValidSlug('mojito-classic'), true);
assert.strictEqual(isValidSlug('gin-tonic-2'), true);
assert.strictEqual(isValidSlug('Mojito'), false);
assert.strictEqual(isValidSlug('has spaces'), false);
assert.strictEqual(isValidSlug('-leading'), false);
assert.strictEqual(isValidSlug('trailing-'), false);
assert.strictEqual(isValidSlug('double--hyphen'), false);
assert.strictEqual(isValidSlug(''), false);
assert.strictEqual(isValidSlug(undefined), false);

// --- abv (DB CHECK: 0..100 or NULL) ---
assert.strictEqual(isValidAbv(null), true);
assert.strictEqual(isValidAbv(0), true);
assert.strictEqual(isValidAbv(43.5), true);
assert.strictEqual(isValidAbv(100), true);
assert.strictEqual(isValidAbv(-0.1), false);
assert.strictEqual(isValidAbv(100.1), false);
assert.strictEqual(isValidAbv(NaN), false);
assert.strictEqual(isValidAbv(Infinity), false);

// --- order_index ---
assert.strictEqual(isValidOrderIndex(0), true);
assert.strictEqual(isValidOrderIndex(42), true);
assert.strictEqual(isValidOrderIndex(-1), false);
assert.strictEqual(isValidOrderIndex(1.5), false);
assert.strictEqual(isValidOrderIndex(NaN), false);
assert.strictEqual(isValidOrderIndex('3' as unknown as number), false);

// --- particle effect enum matches the DB migration exactly ---
assert.deepStrictEqual([...PARTICLE_EFFECTS], ['rain', 'fire', 'neon', 'snow', 'bokeh', 'none']);

// --- describeDbError: duplicate slug → friendly message, no raw SQL ---
const dup = describeDbError({
  code: '23505',
  message: 'duplicate key value violates unique constraint "cocktails_slug_key"',
});
assert.ok(dup.startsWith('A cocktail with this slug already exists.'), dup);
assert.ok(!dup.includes('postgres') && !dup.includes('constraint'), dup);

// unique violation with unknown constraint → generic but sane
assert.strictEqual(
  describeDbError({ code: '23505', message: 'duplicate key ... other_table_pkey' }),
  'Another cocktail already uses this value. Try changing the slug.'
);

// check violations map to their constraint
assert.strictEqual(
  describeDbError({
    code: '23514',
    message: 'new row for relation "cocktails" violates check constraint "cocktails_abv_range"',
  }),
  'ABV must be between 0 and 100.'
);
assert.strictEqual(
  describeDbError({
    code: '23514',
    message: 'violates check constraint "cocktails_slug_format"',
  }),
  'Slug must be lowercase letters, numbers, and single hyphens.'
);
assert.strictEqual(
  describeDbError({ code: '22003', message: 'numeric value out of range' }),
  'One or more fields have invalid values.'
);

// unknown failure → generic; no schema internals leak
const generic = describeDbError({ code: 'XX000', message: 'internal error at pg_catalog.foo' });
assert.ok(!generic.includes('pg_catalog'), generic);

// non-object garbage doesn't throw
assert.strictEqual(typeof describeDbError('boom'), 'string');
assert.strictEqual(typeof describeDbError(null), 'string');

// missing code but constraint name in message is still mapped
assert.ok(
  describeDbError({
    message: 'duplicate key value violates unique constraint "cocktails_slug_key"',
  }).startsWith('A cocktail with this slug already exists.')
);

// --- file magic bytes ---
const bytes = (...b: number[]) => new Uint8Array(b);
assert.deepStrictEqual(matchFileKind(bytes(0xff, 0xd8, 0xff, 0xe0)), { kind: 'image', label: 'jpeg' });
assert.deepStrictEqual(matchFileKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d)), { kind: 'image', label: 'png' });
assert.deepStrictEqual(matchFileKind(bytes(0x47, 0x49, 0x46, 0x38, 0x39)), { kind: 'image', label: 'gif' });
assert.deepStrictEqual(matchFileKind(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)), { kind: 'image', label: 'webp' });
// RIFF without WEBP marker must not be treated as webp
assert.strictEqual(matchFileKind(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0, 0, 0, 0)), null);
assert.deepStrictEqual(matchFileKind(bytes(0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70)), { kind: 'video', label: 'mp4/mov' });
assert.deepStrictEqual(matchFileKind(bytes(0x1a, 0x45, 0xdf, 0xa3)), { kind: 'video', label: 'webm/mkv' });
// text pretending to be an image → rejected
assert.strictEqual(matchFileKind(new TextEncoder().encode('<script>alert(1)</script>')), null);

console.log('✓ form-validation tests passed');
