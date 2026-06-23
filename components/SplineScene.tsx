'use client';

import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { preload } from 'react-dom';
// 1. Static import to ensure it's in the initial client bundle (no lazy loading)
import Spline from '@splinetool/react-spline';

interface SplineSceneProps {
  sceneUrl: string;
  fallbackImageUrl: string;
  altText: string;
}

export default function SplineScene({ sceneUrl, fallbackImageUrl, altText }: SplineSceneProps) {
  const { capability, hasChecked } = useDeviceCapability();
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3. Preload the .splinecode file in the document <head>
  // In Next.js App Router, ReactDOM.preload injects the <link rel="preload"> tag automatically.
  preload(sceneUrl, { as: 'fetch', crossOrigin: 'anonymous' });

  useEffect(() => {
    if (!hasChecked) return;

    if (capability === 'high') {
      console.log('DEVICE PATH: high');
      setIsInView(true);

      // 2. Hard timeout for high-end: ensure Spline displays within 800ms max
      const timer = setTimeout(() => {
        setIsSplineLoaded(true);
        console.log('Hard timeout triggered: Forced Spline display');
      }, 800);
      return () => clearTimeout(timer);
    } else {
      console.log('DEVICE PATH: low');
      // For low end, lazy load when in view
      if (!containerRef.current) return;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' }
      );
      
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [capability, hasChecked]);

  if (!hasChecked) {
    return <div className="w-full h-full bg-transparent" />;
  }

  const isHighEnd = capability === 'high';

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      
      {/* 4. On high-end, the poster is ONLY shown conditionally and removed instantly */}
      {(!isHighEnd || (!isSplineLoaded && isHighEnd)) && (
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
          {!isHighEnd && (
            <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-wider text-neutral-400 z-20">
              Lite Mode (Battery Saver)
            </div>
          )}
        </div>
      )}

      {/* Actual 3D Scene */}
      <div className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing ${isHighEnd ? 'z-10' : 'z-0'}`}>
        {isInView && (
          <Spline 
            scene={sceneUrl} 
            onLoad={(splineApp) => {
              console.log('Spline onLoad fired');
              if (!isHighEnd) {
                // Cap pixel ratio for low end
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const app = splineApp as any;
                  if (app.setPixelRatio) {
                    app.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
                  } else if (app._renderer && app._renderer.setPixelRatio) {
                    app._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
                  }
                } catch {
                  // Ignore errors
                }
              }
              setIsSplineLoaded(true);
            }}
          />
        )}
      </div>
      
    </div>
  );
}
