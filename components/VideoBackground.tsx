import React, { useRef, useEffect } from 'react';

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function VideoBackground({ src, poster, className }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fallback to forcefully trigger play on mount for stubborn mobile browsers
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Video autoplay blocked by browser:', err);
      });
    }
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      
      // REQUIRED FOR MOBILE AUTOPLAY:
      autoPlay
      loop
      muted
      playsInline
      
      // ADVANCED/FALLBACK ATTRIBUTES FOR OLDER OR ASIAN BROWSERS (e.g. WeChat):
      preload="auto"
      webkit-playsinline="true" // Older iOS Safari
      x5-playsinline="true" // Tencent / WeChat browser
      
      // PREVENT USER INTERFERENCE:
      controls={false}
      disablePictureInPicture
      
      // FALLBACK LOOPING: If native loop fails on some Androids
      onEnded={(e) => {
        e.currentTarget.play().catch(() => {});
      }}
      className={className}
    />
  );
}
