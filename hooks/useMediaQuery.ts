'use client';

import { useState, useEffect } from 'react';

/**
 * Generic reactive media-query hook.
 * Returns `false` during SSR / initial hydration (safe default).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** True when the viewport is narrower than 768 px. */
export function useMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** True when the user has requested reduced motion. */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
