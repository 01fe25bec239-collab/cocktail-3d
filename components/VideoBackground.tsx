'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

import Image from 'next/image';

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
  onCanPlay?: () => void;
}

export default function VideoBackground({ src, poster, className = '', onCanPlay }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { capability, hasChecked } = useDeviceCapability();

  useEffect(() => {
    setIsVideoPlaying(false);
  }, [src]);

  useEffect(() => {
    // Wait for capability detection; the default is 'high', so acting early
    // would eagerly load the video on every device.
    if (!hasChecked) return;

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

  const isHighEnd = hasChecked && capability === 'high';

  return (
    <div className={`${className} overflow-hidden pointer-events-none`}>
      {poster && (
        <Image
          src={poster}
          alt="Video Poster"
          fill
          priority={true}
          className={`object-cover transition-opacity duration-700 ease-out z-10 ${
            isVideoPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      <video
        ref={videoRef}
        src={hasLoaded || isHighEnd ? src : undefined}
        className="absolute inset-0 w-full h-full object-cover z-0"
        autoPlay={isIntersecting || isHighEnd}
        loop
        muted
        playsInline
        preload={hasLoaded || isHighEnd ? "auto" : "none"}
        webkit-playsinline="true"
        x5-playsinline="true"
        controls={false}
        disablePictureInPicture
        onCanPlay={onCanPlay}
        onPlaying={() => setIsVideoPlaying(true)}
        onEnded={(e) => {
          if (isIntersecting || isHighEnd) {
            e.currentTarget.play().catch(() => {});
          }
        }}
      />
    </div>
  );
}
