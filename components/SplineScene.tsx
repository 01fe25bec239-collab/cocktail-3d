'use client';

import { useHardwareDetect } from '@/hooks/useHardwareDetect';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { preload } from 'react-dom';

// 4. Lazy Load the Spline Component so it doesn't block the main thread
// This splits the heavy Spline runtime out of the initial JS bundle
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  // Remove the spinner. We will show the high-res poster image instead while it loads.
  loading: () => null, 
});

interface SplineSceneProps {
  sceneUrl: string;
  fallbackImageUrl: string;
  altText: string;
}

export default function SplineScene({ sceneUrl, fallbackImageUrl, altText }: SplineSceneProps) {
  // 1. Detect device hardware capabilities
  const { isLowEnd, hasChecked } = useHardwareDetect();
  
  // Track when Spline is fully loaded and ready to play
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);

  // Preload the heavy .splinecode binary payload instantly 
  // so the network starts fetching it before the JS evaluates
  preload(sceneUrl, { as: 'fetch', crossOrigin: 'anonymous' });

  // Prevent hydration mismatch by returning empty or fallback while checking
  if (!hasChecked) {
    return <div className="w-full h-full bg-transparent" />;
  }

  // 2. Conditionally render the static fallback instead of 3D
  if (isLowEnd) {
    return (
      // Fix 6: Strict layout constraints to prevent layout shift
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Image
          src={fallbackImageUrl}
          alt={altText}
          fill
          className="object-cover opacity-80"
          priority
        />
        {/* Badge letting the user know they are in Lite mode */}
        <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-wider text-neutral-400 z-20">
          Lite Mode (Battery Saver)
        </div>
      </div>
    );
  }

  // Render the actual 3D scene for capable devices
  return (
    // Fix 6: Absolute inset-0 ensures it perfectly fills the container without shifting
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      
      {/* Fix 3: Instant Skeleton / Poster overlay */}
      {/* This sits perfectly on top of the 3D scene and smoothly fades out once Spline fires onLoad */}
      <div 
        className={`absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-1000 ease-in-out ${
          isSplineLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Image
          src={fallbackImageUrl}
          alt={altText}
          fill
          className="object-cover opacity-80"
          priority
        />
      </div>

      {/* The actual 3D scene. It loads invisibly underneath the poster image. */}
      <div className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0">
        <Spline 
          scene={sceneUrl} 
          onLoad={() => {
            // Once the 3D scene is fully initialized and looping, trigger the crossfade!
            setIsSplineLoaded(true);
          }}
        />
      </div>
      
    </div>
  );
}
