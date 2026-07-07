"use client";

/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useMemo, useEffect } from 'react';
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

  const positions = useMemo(() => {
     const pos = [];
     for(let i=0; i<count; i++) pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  // Simulation parameters — constants, so read them once instead of per-particle.
  const { scale, spin, accretion, warp } = { scale: 52.4, spin: 6.908, accretion: 2, warp: 2.79 };

  // Per-instance colors depend only on radius (a function of the index), not on
  // time — so compute them once at mount rather than every frame for 20k items.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      const radius = scale * (0.08 + 1.9 * u * u);
      const heat = 1.0 - Math.min(1.0, radius / (scale * 2.0));
      // Luxury Sapphire Blue & Electric Cyan color mapping
      color.setHSL(0.52 + 0.12 * heat, 0.9 + 0.1 * heat, 0.2 + 0.5 * Math.pow(heat, 1.5));
      mesh.setColorAt(i, color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [scale]);

  // R3F only auto-disposes JSX-declared objects; these useMemo'd GPU resources
  // must be released manually or they leak on every navigation.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const time = state.clock.getElapsedTime() * speedMult;

    for (let i = 0; i < count; i++) {
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

        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
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
          autoRotateSpeed={0.5}
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
