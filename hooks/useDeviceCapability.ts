import { useState, useEffect } from 'react';

export type DeviceCapability = 'high' | 'low';

export function useDeviceCapability(): { capability: DeviceCapability; hasChecked: boolean } {
  const [capability, setCapability] = useState<DeviceCapability>('high'); // Default to high
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let highCount = 0;
    let lowCount = 0;

    // 1. GPU Concurrency Check (CPU cores)
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency >= 6) highCount++;
      else if (navigator.hardwareConcurrency <= 3) lowCount++;
    }

    // 2. Device Memory Check (RAM)
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      const memory = (navigator as any).deviceMemory;
      if (memory >= 4) highCount++;
      else if (memory <= 2) lowCount++;
    }

    // 3. Connection Speed Check
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn && conn.effectiveType) {
        if (conn.effectiveType === '4g' || !conn.effectiveType) highCount++;
        else if (conn.effectiveType === '2g' || conn.effectiveType === '3g') lowCount++;
      } else {
        highCount++; // Default to high if connection info unavailable but object exists
      }
    } else {
      highCount++; // Default to high if completely unsupported
    }

    // 4. Screen Resolution + Pixel Ratio
    if (typeof window !== 'undefined' && typeof screen !== 'undefined') {
      const dpr = window.devicePixelRatio || 1;
      const width = screen.width;
      if (dpr >= 2 && width >= 1280) highCount++;
      else if (width < 768 && dpr < 2) lowCount++;
    }

    // 5. Mobile GPU Check via WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          if (renderer) {
            const rendererStr = renderer.toString().toLowerCase();
            if (
              rendererStr.includes('apple m') ||
              rendererStr.includes('nvidia') ||
              rendererStr.includes('amd') ||
              rendererStr.includes('intel iris') ||
              rendererStr.includes('rtx') ||
              rendererStr.includes('gtx')
            ) {
              highCount++;
            } else if (
              rendererStr.includes('mali-g5') ||
              rendererStr.includes('adreno 5') ||
              rendererStr.includes('adreno 4') ||
              rendererStr.includes('powervr')
            ) {
              lowCount++;
            }
          }
        }
      }
    } catch (e) {
      // Ignore webgl check errors
    }

    // Final Decision Logic
    if (highCount >= 3) {
      setCapability('high');
    } else if (lowCount >= 3) {
      setCapability('low');
    } else {
      setCapability('high'); // Default to high if mixed or missing
    }

    setHasChecked(true);
  }, []);

  return { capability, hasChecked };
}
