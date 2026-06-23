'use client';

import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';

interface SplineSceneProps {
  sceneUrl: string;
  fallbackImageUrl: string;
  altText: string;
}

export default function SplineScene({ sceneUrl, fallbackImageUrl, altText }: SplineSceneProps) {
  const { capability, hasChecked } = useDeviceCapability();
  const [currentSceneUrl, setCurrentSceneUrl] = useState(sceneUrl);
  const [coverPoster, setCoverPoster] = useState(fallbackImageUrl);
  const [coverVisible, setCoverVisible] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isTransitioning = useRef(false);

  // Initial load logic (IntersectionObserver for low-end)
  useEffect(() => {
    if (!hasChecked) return;

    if (capability === 'high') {
      setIsInView(true);
    } else {
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

  // Handle route navigation / scene changes
  useEffect(() => {
    if (sceneUrl === currentSceneUrl) return;
    
    // Ignore clicks during transition (Trap #5)
    if (isTransitioning.current) return;
    
    isTransitioning.current = true;
    setCoverPoster(fallbackImageUrl);
    setCoverVisible(true);
    
    // Swap Spline scene underneath after cover renders
    const timer = setTimeout(() => {
      setCurrentSceneUrl(sceneUrl);
    }, 150);

    return () => clearTimeout(timer);
  }, [sceneUrl, fallbackImageUrl, currentSceneUrl]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSplineLoad = (splineApp: any) => {
    // Low-end pixel ratio optimization
    if (capability !== 'high') {
      try {
        if (splineApp.setPixelRatio) {
          splineApp.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
        } else if (splineApp._renderer && splineApp._renderer.setPixelRatio) {
          splineApp._renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
        }
      } catch {
        // Ignore errors
      }
    }

    // Trap #1: Wait 150ms for WebGL first frame to paint before hiding cover
    setTimeout(() => {
      setCoverVisible(false);
      // Unlock after fade-out completes (400ms transition)
      setTimeout(() => {
        isTransitioning.current = false;
      }, 400);
    }, 150);
  };

  if (!hasChecked) {
    return <div className="w-full h-full bg-transparent" />;
  }

  const isHighEnd = capability === 'high';

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      
      {/* Cover Layer (z-index 20) */}
      <div 
        className={`absolute inset-0 w-full h-full z-20 pointer-events-none transition-opacity duration-400 ease-in-out ${
          coverVisible || (!isHighEnd && !isInView) ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Image
          src={coverPoster}
          alt={altText}
          fill
          className="object-cover opacity-80"
          priority
        />
        {!isHighEnd && (
          <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] uppercase tracking-wider text-neutral-400 z-30">
            Lite Mode (Battery Saver)
          </div>
        )}
      </div>

      {/* Actual 3D Scene */}
      <div className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0`}>
        {isInView && (
          <Spline 
            scene={currentSceneUrl} 
            onLoad={handleSplineLoad}
          />
        )}
      </div>
      
    </div>
  );
}
