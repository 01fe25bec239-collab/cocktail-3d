'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const BlackHoleBackground = dynamic(
  () => import('@/components/BlackHoleBackground'),
  { ssr: false }
);

// The WebGL background is purely decorative: neither its ~600KB three.js
// chunk nor its GPU/context initialization may compete with the header and
// cocktail grid for the critical path. Mounting is deferred until after the
// browser has committed a real paint of the content, so content always wins
// the first frame and the visual system streams in right after.
export default function DeferredBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Double-rAF guarantees one full paint cycle has committed before the
    // decorative layer starts loading. requestIdleCallback alone is NOT
    // sufficient here: it can fire between tasks before the very first paint,
    // letting three.js init block FCP/LCP behind a multi-hundred-ms task
    // (measured: FCP 104ms -> 1060ms with RIC on real hardware).
    let frame1 = 0;
    let frame2 = 0;
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, []);

  return ready ? <BlackHoleBackground /> : null;
}
