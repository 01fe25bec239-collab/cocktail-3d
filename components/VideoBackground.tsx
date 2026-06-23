'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoBackground({ src, poster, className }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { capability, hasChecked } = useDeviceCapability();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (capability === 'high') {
      // High-end device: skip observer, load freely
      setHasLoaded(true);
      setIsIntersecting(true);
      return;
    }

    // Low-end device: Set up the Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            setHasLoaded(true);
            
            video.play().catch((err) => {
              console.warn('Video playback prevented:', err);
            });
          } else {
            setIsIntersecting(false);
            video.pause();
          }
        });
      },
      { rootMargin: '200px 0px' } 
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
      observer.disconnect();
    };
  }, [capability, hasChecked]);

  const isHighEnd = capability === 'high';

  return (
    <video
      ref={videoRef}
      src={hasLoaded || isHighEnd ? src : undefined}
      poster={poster}
      className={className}
      autoPlay={isIntersecting || isHighEnd}
      loop
      muted
      playsInline
      preload={hasLoaded || isHighEnd ? "auto" : "none"}
      webkit-playsinline="true"
      x5-playsinline="true"
      controls={false}
      disablePictureInPicture
      onEnded={(e) => {
        if (isIntersecting || isHighEnd) {
          e.currentTarget.play().catch(() => {});
        }
      }}
    />
  );
}
