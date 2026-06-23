'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';

/**
 * useSplineLazy
 *
 * Two-tier IntersectionObserver strategy for lazy-mounting heavy
 * 3D content (Spline scenes) with a hysteresis zone:
 *
 *  • **Mount** when the section enters a 200 px proximity.
 *  • **Unmount** only once it leaves a ~200 vh (2 full sections)
 *    proximity — so the 3D canvas survives small over-scrolls
 *    without thrashing mount/unmount.
 *
 * The asymmetric margins prevent flicker when the user reverses
 * direction near a boundary.
 */
export function useSplineLazy(
  ref: RefObject<HTMLElement | null>
): boolean {
  const [shouldMount, setShouldMount] = useState(false);
  /* Track whether this section has ever been close enough to mount.
     Prevents the unmount observer's initial "not intersecting" from
     resetting an already-mounted component. */
  const everMounted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* ── Mount observer: fires when section enters 200 px range ── */
    const mountObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          everMounted.current = true;
          setShouldMount(true);
        }
      },
      { rootMargin: '200px' }
    );

    /* ── Unmount observer: fires when section leaves ~2 viewports ── */
    const unmountObs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && everMounted.current) {
          setShouldMount(false);
        }
      },
      { rootMargin: '200%' }
    );

    mountObs.observe(el);
    unmountObs.observe(el);

    return () => {
      mountObs.disconnect();
      unmountObs.disconnect();
    };
  }, [ref]);

  return shouldMount;
}
