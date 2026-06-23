'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import VideoBackground from './VideoBackground';

interface DoubleBufferedMediaProps {
  src: string;
  poster?: string;
  className?: string;
  isReducedMotion?: boolean;
  isVideo?: boolean;
}

export default function DoubleBufferedMedia({
  src,
  poster,
  className = '',
  isReducedMotion = false,
  isVideo = false,
}: DoubleBufferedMediaProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [nextSrc, setNextSrc] = useState<string | null>(null);
  const [nextPoster, setNextPoster] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (src === currentSrc) return;
    
    // Start transition
    setNextSrc(src);
    setNextPoster(poster);
  }, [src, currentSrc, poster]);

  const handleNextLoaded = () => {
    // Once the next media is loaded, give it a tiny buffer then swap
    setTimeout(() => {
      setCurrentSrc(nextSrc!);
      setNextSrc(null);
      setNextPoster(undefined);
    }, 50);
  };

  const renderMediaLayer = (
    mediaSrc: string, 
    mediaPoster: string | undefined, 
    isNext: boolean
  ) => {
    const isImage = !isVideo || isReducedMotion;

    if (isImage) {
      return (
        <Image
          src={mediaSrc}
          alt="Backdrop"
          fill
          priority={!isNext} // Current is priority
          className={`object-cover ${className} ${
            isNext 
              ? 'transition-opacity duration-500 opacity-100 absolute inset-0 z-10' 
              : 'opacity-60 absolute inset-0 z-0'
          }`}
          onLoad={isNext ? handleNextLoaded : undefined}
        />
      );
    }

    return (
      <VideoBackground
        src={mediaSrc}
        poster={mediaPoster}
        className={`object-cover ${className} ${
          isNext 
            ? 'transition-opacity duration-500 opacity-100 absolute inset-0 z-10' 
            : 'opacity-60 absolute inset-0 z-0'
        }`}
        onCanPlay={isNext ? handleNextLoaded : undefined}
      />
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
      {/* Current Base Layer */}
      {renderMediaLayer(currentSrc, poster, false)}
      
      {/* Incoming Transition Layer */}
      {nextSrc && (
        <div 
          className="absolute inset-0 z-10 opacity-60" 
        >
           {renderMediaLayer(nextSrc, nextPoster, true)}
        </div>
      )}
    </div>
  );
}
