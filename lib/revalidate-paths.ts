// Pure allowlist for on-demand public-route revalidation (ADMIN-002).
// Admin mutations run in the browser, so the paths they request must never be
// trusted blindly — the API route filters every candidate through this.

export const HOMEPAGE_PATH = '/';

const SLUG_PATH_RE = /^\/cocktail\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Filters an untrusted array down to revalidatable public paths. */
export function sanitizeRevalidatePaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) return [];
  const seen = new Set<string>();
  for (const p of paths) {
    if (typeof p !== 'string') continue;
    const candidate = p.length <= 200 ? p : '';
    if (candidate === HOMEPAGE_PATH || SLUG_PATH_RE.test(candidate)) {
      seen.add(candidate);
    }
  }
  return Array.from(seen);
}

/**
 * Public routes affected by a cocktail mutation.
 * - `oldSlug` covers edit flows where the slug changed (its ISR entry would
 *   otherwise keep serving the old content until the timer expires).
 * - `newSlug` is omitted when it equals `oldSlug`.
 */
export function cocktailMutationPaths(options: {
  newSlug?: string | null;
  oldSlug?: string | null;
}): string[] {
  const paths = [HOMEPAGE_PATH];
  const { newSlug, oldSlug } = options;
  if (oldSlug && typeof oldSlug === 'string') paths.push(`/cocktail/${oldSlug}`);
  if (newSlug && typeof newSlug === 'string' && newSlug !== oldSlug) {
    paths.push(`/cocktail/${newSlug}`);
  }
  return sanitizeRevalidatePaths(paths);
}
