'use client';

import { useEffect } from 'react';

export default function ViewportFix() {
  useEffect(() => {
    const setVh = () => {
      // Calculate 1% of the dynamic viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setVh();

    // Listen to resize events
    window.addEventListener('resize', setVh);

    return () => window.removeEventListener('resize', setVh);
  }, []);

  return null;
}
