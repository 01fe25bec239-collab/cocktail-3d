// Shared admin form validation + database error mapping (ADMIN-004).
// Pure functions so they can be unit-tested without a browser or Supabase.

import { ParticleEffect } from '@/types/cocktail';

export const ABV_MIN = 0;
export const ABV_MAX = 100;
export const ORDER_INDEX_MIN = 0;
export const ORDER_INDEX_MAX = 100000;
export const SLUG_MAX_LENGTH = 100;

export const PARTICLE_EFFECTS: readonly ParticleEffect[] = [
  'rain',
  'fire',
  'neon',
  'snow',
  'bokeh',
  'none',
] as const;

export const DEFAULT_PARTICLE_EFFECT: ParticleEffect = 'none';

/** DB CHECK: slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' */
export function isValidSlug(slug: unknown): boolean {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/** DB CHECK: abv IS NULL OR (abv >= 0 AND abv <= 100) */
export function isValidAbv(abv: unknown): boolean {
  if (abv === null || abv === undefined) return true;
  return typeof abv === 'number' && Number.isFinite(abv) && abv >= ABV_MIN && abv <= ABV_MAX;
}

/** INTEGER column; menu order must be a sane non-negative whole number. */
export function isValidOrderIndex(orderIndex: unknown): boolean {
  return (
    typeof orderIndex === 'number' &&
    Number.isInteger(orderIndex) &&
    orderIndex >= ORDER_INDEX_MIN &&
    orderIndex <= ORDER_INDEX_MAX
  );
}

interface DbErrorLike {
  message?: string | null;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}

const UNIQUE_CONSTRAINT_MESSAGES: Record<string, string> = {
  cocktails_slug_key: 'A cocktail with this slug already exists. Choose a different slug.',
};

const CHECK_CONSTRAINT_MESSAGES: Record<string, string> = {
  cocktails_slug_format: 'Slug must be lowercase letters, numbers, and single hyphens.',
  cocktails_abv_range: `ABV must be between ${ABV_MIN} and ${ABV_MAX}.`,
  cocktails_hex_colors: 'Colors must be valid hex values (e.g. #1a2b3c).',
  cocktails_ingredients_shape: 'Each ingredient needs a name and an amount.',
};

function constraintName(error: DbErrorLike): string | null {
  // Postgres surfaces constraint names in either `message` ("...constraint
  // cocktails_slug_key") or `details` ("Key (slug)=(x) already exists." has
  // none, but RPC/edge variants differ) — check both.
  const haystack = `${error.message ?? ''} ${error.details ?? ''}`;
  for (const name of [...Object.keys(UNIQUE_CONSTRAINT_MESSAGES), ...Object.keys(CHECK_CONSTRAINT_MESSAGES)]) {
    if (haystack.includes(name)) return name;
  }
  return null;
}

/**
 * Maps known Postgres errors to human-friendly messages. Unknown failures get
 * a generic message — raw SQL/schema details never reach the admin UI.
 */
export function describeDbError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Could not save the cocktail. Please try again.';
  }
  const e = error as DbErrorLike;

  switch (e.code) {
    case '23505': { // unique_violation
      const name = constraintName(e);
      if (name && UNIQUE_CONSTRAINT_MESSAGES[name]) return UNIQUE_CONSTRAINT_MESSAGES[name];
      return 'Another cocktail already uses this value. Try changing the slug.';
    }
    case '23514': { // check_violation
      const name = constraintName(e);
      if (name && CHECK_CONSTRAINT_MESSAGES[name]) return CHECK_CONSTRAINT_MESSAGES[name];
      return 'One or more fields have invalid values.';
    }
    case '22P02': // invalid_text_representation etc.
    case '22003': // numeric_value_out_of_range
      return 'One or more fields have invalid values.';
    default:
      break;
  }

  // Some drivers omit the code but include the constraint in the message.
  const name = constraintName(e);
  if (name && UNIQUE_CONSTRAINT_MESSAGES[name]) return UNIQUE_CONSTRAINT_MESSAGES[name];
  if (name && CHECK_CONSTRAINT_MESSAGES[name]) return CHECK_CONSTRAINT_MESSAGES[name];

  return 'Could not save the cocktail. Please try again.';
}
