'use client';

import React, { useRef, useEffect, useState } from 'react';

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoBackground({ src, poster, className }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Set up the Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // When the video enters the viewport (or gets within 200px)
            setIsIntersecting(true);
            setHasLoaded(true); // Flag to permanently attach the 'src'
            
            // Resume playback
            video.play().catch((err) => {
              console.warn('Video playback prevented:', err);
            });
          } else {
            // 3. Pause the video when it leaves the viewport to save CPU/Battery
            setIsIntersecting(false);
            video.pause();
          }
        });
      },
      { 
        // Pre-load the video when it is 200px away from scrolling into view
        rootMargin: '200px 0px' 
      } 
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      
      // 2. Lazy Load: Only attach the source URL once it has entered the observer threshold
      // Otherwise, the browser will eagerly download 20 videos at once.
      src={hasLoaded ? src : undefined}
      
      // Always show the static poster image as the fallback while the video is downloading
      poster={poster}
      
      className={className}
      
      // REQUIRED FOR MOBILE AUTOPLAY:
      autoPlay={isIntersecting}
      loop
      muted
      playsInline
      
      // ADVANCED/FALLBACK ATTRIBUTES:
      preload={hasLoaded ? "auto" : "none"} // Prevent background data usage on initial load
      webkit-playsinline="true"
      x5-playsinline="true"
      
      // PREVENT USER INTERFERENCE:
      controls={false}
      disablePictureInPicture
      
      // FALLBACK LOOPING:
      onEnded={(e) => {
        if (isIntersecting) {
          e.currentTarget.play().catch(() => {});
        }
      }}
    />
  );
}
