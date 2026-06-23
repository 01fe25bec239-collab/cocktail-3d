'use client';

import { useHardwareDetect } from '@/hooks/useHardwareDetect';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// 3. Lazy Load the Spline Component so it doesn't block the main thread
// This splits the heavy Spline runtime out of the initial JS bundle
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mb-4" />
      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-500/80">Loading 3D Scene</span>
    </div>
  ),
});

interface SplineSceneProps {
  sceneUrl: string;
  fallbackImageUrl: string;
  altText: string;
}

export default function SplineScene({ sceneUrl, fallbackImageUrl, altText }: SplineSceneProps) {
  // 1. Detect device hardware capabilities
  const { isLowEnd, hasChecked } = useHardwareDetect();

  // Prevent hydration mismatch by returning empty or fallback while checking
  if (!hasChecked) {
    return <div className="w-full h-full bg-transparent" />;
  }

  // 2. Conditionally render the static fallback instead of 3D
  if (isLowEnd) {
    return (
      <div className="relative w-full h-full">
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
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Spline scene={sceneUrl} />
    </div>
  );
}
