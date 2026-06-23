'use client';

import { useState, useEffect } from 'react';

export function useHardwareDetect() {
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // 1. Check logical processors (cores)
    const cores = navigator.hardwareConcurrency || 4;
    
    // 2. Check device RAM (mostly supported on Android/Chrome)
    // @ts-ignore - deviceMemory is not standard in all TS lib doms
    const memory = navigator.deviceMemory || 4;

    // 3. Check for mobile network connection speed
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowNetwork = connection ? (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' || connection.effectiveType === '3g') : false;

    // 4. Check if it's a mobile device based on screen size and touch capabilities
    const isMobile = window.innerWidth < 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Heuristic: If it's a mobile device with less than 4GB RAM or < 4 cores, 
    // or the user is on a slow network/data-saver mode, fallback to static image.
    if ((isMobile && (memory < 4 || cores < 4)) || isSlowNetwork) {
      setIsLowEnd(true);
    }
    
    // 5. Advanced: WebGL unmasked renderer check for low-end GPUs
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          // Flag explicit software renderers or very old mobile GPUs
          if (renderer.includes('swiftshader') || renderer.includes('llvmpipe') || renderer.includes('mali-400')) {
             setIsLowEnd(true);
          }
        }
      }
    } catch (e) {
      // Ignore webgl errors
    }

    setHasChecked(true);
  }, []);

  return { isLowEnd, hasChecked };
}
