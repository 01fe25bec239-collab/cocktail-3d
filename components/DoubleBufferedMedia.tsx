'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [slots, setSlots] = useState([
    { src, poster, isVideo },
    { src: '', poster: undefined as string | undefined, isVideo: false }
  ]);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [pendingSlot, setPendingSlot] = useState<0 | 1 | null>(null);

  const swapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetSrcRef = useRef(src);
  const activeSlotRef = useRef<0 | 1>(0);

  useEffect(() => {
    // 1. Check targetSrcRef BEFORE overwriting it to prevent loop
    if (src === targetSrcRef.current) return;
    
    targetSrcRef.current = src;

    // Cancel any pending transition swap
    if (swapTimeoutRef.current) {
      clearTimeout(swapTimeoutRef.current);
      swapTimeoutRef.current = null;
    }

    const nextSlot = activeSlotRef.current === 0 ? 1 : 0;
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[nextSlot] = { src, poster, isVideo };
      return newSlots;
    });
    setPendingSlot(nextSlot);
  }, [src, poster, isVideo]); // Removed slots and activeSlot from deps!

  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current) {
        clearTimeout(swapTimeoutRef.current);
      }
    };
  }, []);

  const handleNextLoaded = (index: number, loadedSrc: string) => {
    // Ignore stale events from previous src
    if (loadedSrc !== targetSrcRef.current) return;

    if (index === pendingSlot) {
      swapTimeoutRef.current = setTimeout(() => {
        const newActive = index as 0 | 1;
        setActiveSlot(newActive);
        activeSlotRef.current = newActive; // Keep ref in sync
        setPendingSlot(null);
        swapTimeoutRef.current = null;
      }, 50);
    }
  };

  const renderSlot = (index: 0 | 1) => {
    const slotData = slots[index];
    if (!slotData.src) return null;

    const isActive = index === activeSlot;
    const isPending = index === pendingSlot;
    
    let zIndex = 'z-0';
    let opacity = 'opacity-0';
    
    if (isActive) {
      zIndex = 'z-20';
      opacity = 'opacity-100';
    } else if (isPending) {
      zIndex = 'z-30';
      opacity = 'opacity-0'; // buffers invisibly
    } else {
      zIndex = 'z-10';
      opacity = 'opacity-0'; // fades out after being replaced
    }

    const isImage = !slotData.isVideo || isReducedMotion;
    const baseClassName = `absolute inset-0 transition-opacity duration-700 ease-in-out ${zIndex} ${opacity}`;

    if (isImage) {
      return (
        <div key={index} className={baseClassName}>
          <Image
            src={slotData.src}
            alt="Backdrop"
            fill
            priority={isActive || isPending}
            className={`object-cover ${className}`}
            onLoad={isPending ? () => handleNextLoaded(index, slotData.src) : undefined}
          />
        </div>
      );
    }

    return (
      <div key={index} className={baseClassName}>
        <VideoBackground
          src={slotData.src}
          poster={slotData.poster}
          className={`object-cover absolute inset-0 w-full h-full ${className}`}
          onCanPlay={isPending ? () => handleNextLoaded(index, slotData.src) : undefined}
        />
      </div>
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {renderSlot(0)}
      {renderSlot(1)}
    </div>
  );
}
