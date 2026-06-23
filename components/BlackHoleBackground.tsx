"use client";

/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      unrealBloomPass: any;
    }
  }
}

const ParticleSwarm = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 20000;
  const speedMult = 1;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor; 
  
  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const PARAMS: Record<string, number> = useMemo(() => ({"scale":52.4,"spin":6.908,"accretion":2,"warp":2.79}), []);
  const addControl = (id: string, l: string, min: number, max: number, val: number) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    const mat = material as any;
    if(mat.uniforms && mat.uniforms.uTime) {
         mat.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i++) {
        const scale = addControl("scale", "Event Horizon", 20, 200, 90);
        const spin = addControl("spin", "Spin", 0.2, 8.0, 3.0);
        const accretion = addControl("accretion", "Accretion Disk", 0.0, 2.0, 1.0);
        const warp = addControl("warp", "Space Warp", 0.0, 3.0, 1.2);
        
        const u = (i + 0.5) / count;
        const ga = 2.399963229728653;
        const a = i * ga;
        
        const t = time * 0.35;
        const band = u * 24.0 - 12.0;
        
        const disk = 1.0 - Math.abs(Math.sin(band * 0.5));
        const radius = scale * (0.08 + 1.9 * u * u);
        
        const swirl = a + spin * Math.log(radius + 1.0) - t * (2.0 + 3.0 * (1.0 - u));
        
        const grav = 1.0 / (1.0 + radius * 0.015);
        const bend = warp * grav * grav;
        
        const x0 = radius * Math.cos(swirl);
        const z0 = radius * Math.sin(swirl);
        
        const x = x0 + bend * z0;
        const z = z0 - bend * x0;
        
        const y = scale * 0.22 * disk * Math.sin(a * 0.17 + t * 4.0) * accretion;
        
        target.set(x, y, z);
        
        const heat = 1.0 - Math.min(1.0, radius / (scale * 2.0));
        
        // Luxury Sapphire Blue & Electric Cyan color mapping
        const hue = 0.52 + 0.12 * heat; 
        const sat = 0.9 + 0.1 * heat;
        const light = 0.2 + 0.5 * Math.pow(heat, 1.5);
        
        color.setHSL(hue, sat, light);

        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export default function BlackHoleBackground() {
  return (
    <div className="fixed inset-0 bg-black -z-20 pointer-events-none">
      {/* Elevated camera for a majestic top-down angled perspective of the vortex */}
      <Canvas camera={{ position: [0, 80, 120], fov: 60 }}>
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        {/* Interaction constraints locked to maintain the angled perspective */}
        <OrbitControls 
          autoRotate={true} 
          autoRotateSpeed={1.0} 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 3} 
        />
        <Effects disableGamma>
            <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}
