# Detailed Refactoring Analysis: Cinematic WebGL Rendering Pipeline

This document analyzes the current WebGL rendering pipeline in `components/ThreeCocktailScene.tsx` and `components/GlobalCanvas.tsx` and provides a comprehensive strategy for refactoring it to cinematic quality.

---

## 1. Glass Meshes Refactoring Strategy

### Current Implementation
- **Location**: `components/ThreeCocktailScene.tsx`, Lines 72–128 (`Glass` component) and Lines 50–69 (`GLBLoader` component).
- **Code Snippet (Current `Glass` Material)**:
```typescript
75:   // Custom transparent glass material
76:   const glassMaterial = useRef(
77:     new THREE.MeshPhysicalMaterial({
78:       transmission: 0.98,
79:       roughness: 0.02,
80:       thickness: 1.5,
81:       ior: 1.52,
82:       color: '#ffffff',
83:       transparent: true,
84:       opacity: 1,
85:       side: THREE.DoubleSide,
86:       depthWrite: false, // Prevents transparency sorting bugs
87:     })
88:   );
```
- **Limitations**:
  - `THREE.MeshPhysicalMaterial` is instantiated imperatively, which makes it harder to manage React-based state and clean-up.
  - It does not natively support advanced refraction and dispersion features (like chromatic aberration, backside refraction depth, and temporal distortion) that `@react-three/drei`'s `<MeshTransmissionMaterial />` implements via custom shader code.
  - Setting `depthWrite: false` prevents sorting bugs but can result in incorrect occlusion with internal objects (like liquid and ice).

### Refactoring Strategy
1. **Import `MeshTransmissionMaterial`**:
   Import `<MeshTransmissionMaterial />` from `@react-three/drei` in `components/ThreeCocktailScene.tsx`.
2. **Implement `GlassLoader` Component**:
   Replace the imperative material assignment in `GLBLoader` with a declarative approach. We will extract the meshes from the loaded GLTF model and render them inside JSX as `<mesh>` elements, applying `<MeshTransmissionMaterial />` as a child. This preserves the individual transforms of the imported meshes while dynamically applying the transmission shader.
3. **Configure Material Settings**:
   - `transmission={1.0}`: Full transparency.
   - `roughness={0.02}`: Clean, polished glass.
   - `thickness={1.5}`: Realistic thickness for refraction.
   - `ior={1.52}`: Refractive index of standard crown glass.
   - `chromaticAberration={0.05}`: Subtle rainbow color dispersion at the glass edges.
   - `anisotropy={0.1}`: Reduce blur stretching.
   - `clearcoat={1.0}`: Smooth glossy outer reflection.
   - `backside={true}`: Render back faces for double-sided refraction.
   - `backsideThickness={1.0}`: Thickness for the light path exiting the glass.

### Proposed Code Change
```tsx
import { useGLTF, OrbitControls, Instances, Instance, MeshTransmissionMaterial } from '@react-three/drei';

function GlassLoader({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: ModelProps) {
  const { scene } = useGLTF(url);
  
  const meshes: THREE.Mesh[] = [];
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.computeBoundingSphere();
      meshes.push(mesh);
    }
  });

  const scaleArr: [number, number, number] = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group position={position} rotation={rotation} scale={scaleArr}>
      {meshes.map((mesh, index) => (
        <mesh
          key={index}
          geometry={mesh.geometry}
          position={mesh.position}
          rotation={mesh.rotation}
          scale={mesh.scale}
          castShadow
          receiveShadow
        >
          <MeshTransmissionMaterial
            backside
            backsideThickness={1.0}
            thickness={1.5}
            ior={1.52}
            roughness={0.02}
            transmission={1.0}
            chromaticAberration={0.05}
            anisotropy={0.1}
            distortion={0.0}
            distortionScale={0.0}
            temporalDistortion={0.0}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            attenuationDistance={0.5}
            attenuationColor="#ffffff"
            color="#ffffff"
          />
        </mesh>
      ))}
    </group>
  );
}

// In the Glass component:
function Glass({ type }: { type: keyof typeof MODELS.glasses }) {
  const glassUrl = MODELS.glasses[type] || MODELS.glasses.highball;
  // Position offsets code remains the same...
  return <GlassLoader url={glassUrl} position={offset} scale={scale} />;
}
```

---

## 2. Liquid Meshes Refactoring Strategy

### Current Implementation
- **Location**: `components/ThreeCocktailScene.tsx`, Lines 386–417 (`Liquid` component).
- **Code Snippet (Current `Liquid` Material)**:
```typescript
393:   const liquidMaterial = useRef(
394:     new THREE.MeshPhysicalMaterial({
395:       transmission: 0.6,
396:       roughness: 0.1,
397:       thickness: 1.0,
398:       ior: 1.33,
409:       color: parsedColor,
400:       transparent: true,
401:       opacity: 0.9,
402:       depthWrite: true,
403:     })
404:   );
```
- **Limitations**:
  - The liquid color is applied directly to the base `color` property. Combined with `transmission: 0.6` and `opacity: 0.9`, it acts like solid, semi-translucent colored plastic rather than fluid.
  - There is no volumetric absorption. Realistic liquids are clearer in thin regions (near edges) and darker/more saturated in thick regions (in the center).
  - The falling stream mesh (Lines 534–541) shares the same material, which means if the main liquid properties are adjusted, the thin stream will render incorrectly.

### Refactoring Strategy
1. **Volumetric Absorption Settings**:
   - Set base `color` to `#ffffff` (pure white).
   - Set `attenuationColor` to `parsedColor` (the actual cocktail color).
   - Set `attenuationDistance` to `0.8`. This means light is absorbed and takes on the cocktail's color as it penetrates deeper into the liquid volume, giving thin edges a realistic bright glow and thick centers a rich, deep hue.
2. **Increase Transmissiveness**:
   - Set `transmission` to `0.95` and `roughness` to `0.05` for clean, high-clarity fluid.
   - Set `ior` to `1.333` (the physical index of refraction for water/alcohol).
   - Set `thickness` to `2.0` (matching the physical dimensions of the cylinder meshes).
3. **Separate Stream Material**:
   Create a dedicated `streamMaterial` for the falling pour stream. Since the stream is extremely thin (radius `0.08`), volumetric absorption would render it almost invisible. The stream material should use a standard transmissive setup with the base color set directly to `parsedColor`.

### Proposed Code Change
```tsx
function Liquid({ glassType, color, pourActive }: LiquidProps) {
  const liquidRef = useRef<THREE.Mesh>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const parsedColor = color || '#f59e0b';

  // Realistic liquid material using volumetric absorption
  const liquidMaterial = useRef(
    new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      roughness: 0.05,
      thickness: 2.0,
      ior: 1.333,
      color: '#ffffff', // Base color must be white for attenuation to work properly
      attenuationColor: parsedColor,
      attenuationDistance: 0.8,
      transparent: true,
      opacity: 1.0,
      depthWrite: true,
    })
  );

  // Dedicated stream material for visibility of the thin falling stream
  const streamMaterial = useRef(
    new THREE.MeshPhysicalMaterial({
      transmission: 0.6,
      roughness: 0.2,
      thickness: 0.2,
      ior: 1.333,
      color: parsedColor, // Apply color directly to base color
      transparent: true,
      opacity: 0.9,
    })
  );

  useEffect(() => {
    const matLiquid = liquidMaterial.current;
    const matStream = streamMaterial.current;
    return () => {
      matLiquid.dispose();
      matStream.dispose();
    };
  }, []);

  // Update colors dynamically
  useEffect(() => {
    liquidMaterial.current.attenuationColor.set(parsedColor);
    streamMaterial.current.color.set(parsedColor);
  }, [parsedColor]);

  // Cylinder dimensions code remains the same...

  return (
    <group>
      {/* Liquid inside the glass */}
      <mesh
        ref={liquidRef}
        position={[0, posY, 0]}
        material={liquidMaterial.current}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radTop, radBottom, height, 32]} />
      </mesh>

      {/* Falling pour stream */}
      <mesh
        ref={streamRef}
        position={[0, streamY, 0]}
        material={streamMaterial.current}
        visible={false}
        castShadow
      >
        <cylinderGeometry args={[0.08, 0.08, streamHeight, 8]} />
      </mesh>
    </group>
  );
}
```

---

## 3. Lighting Setup Refactoring Strategy

### Current Implementation
- **Location**: `components/ThreeCocktailScene.tsx`, Lines 720–736.
- **Code Snippet**:
```typescript
720:           <ambientLight intensity={0.5} />
721:           
722:           <directionalLight
723:             position={[5, 10, 5]}
724:             intensity={1.2}
725:             color={themeColorPrimary}
726:           />
727:           <directionalLight
728:             position={[-5, 5, -5]}
729:             intensity={0.6}
730:             color={themeColorSecondary}
731:           />
732:           <pointLight
733:             position={[0, 4, 2]}
734:             intensity={0.8}
735:             color={liquidColor}
736:           />
```
- **Limitations**:
  - The scene relies on generic directional and point lights, which results in flat reflections on curved glass.
  - There is no Environment map (HDRI). Transparent, refractive glass requires a rich surrounding environment to reflect/refract; otherwise, it renders black, grey, or completely flat.
  - No shadows are enabled in either `GlobalCanvas.tsx` or the directional lights, leading to a floating/disconnected look.

### Refactoring Strategy
1. **Enable Shadows Globally**:
   Add the `shadows` prop to the `<Canvas>` component in `components/GlobalCanvas.tsx`.
2. **Inject Image-Based Lighting (IBL)**:
   Add `<Environment preset="studio" background={false} />` from `@react-three/drei` inside `<Canvas>` in `components/GlobalCanvas.tsx`. This provides realistic studio light reflections across all glass models.
3. **Configure Shadow Casting Light**:
   Modify the main directional light in `ThreeCocktailScene.tsx` to enable shadow casting, optimize shadow map resolution (`2048x2048`), adjust camera boundaries to fit the cocktail glass tightly, and apply a negative shadow bias (`-0.0001`) to prevent shadow acne.
4. **Add Shadow Receiver Plane**:
   Place a transparent shadow-receiving plane at the base of the cocktail glass (around `y = -2.2` in local space) using `<shadowMaterial opacity={0.3} />`. This projects soft shadows onto the page background without rendering a solid floor.

### Proposed Code Changes
#### In `components/GlobalCanvas.tsx`:
```tsx
import { Canvas } from '@react-three/fiber';
import { View, Preload, PerformanceMonitor, Environment } from '@react-three/drei';
import { useEffect, useState, Suspense } from 'react';

// In the return statement:
return (
  <Canvas
    shadows
    dpr={dpr}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      touchAction: 'none',
      zIndex: 10,
    }}
    eventSource={eventSource}
    camera={{ position: [0, 1.2, 5.5], fov: 35 }} // Adjusted default FOV
    gl={{ 
      antialias: true, 
      alpha: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      outputColorSpace: THREE.SRGBColorSpace,
      logarithmicDepthBuffer: true
    }}
    // ...
  >
    <Suspense fallback={null}>
      <Environment preset="studio" background={false} />
    </Suspense>
    <PerformanceMonitor ...>
      <View.Port />
      <Preload all />
    </PerformanceMonitor>
  </Canvas>
);
```

#### In `components/ThreeCocktailScene.tsx` (Lighting Block):
```tsx
{/* High-fidelity studio lighting with shadow casting */}
<ambientLight intensity={0.2} /> {/* Reduced ambient to enhance HDRI and shadows */}

<directionalLight
  castShadow
  position={[5, 10, 5]}
  intensity={1.5}
  color={themeColorPrimary}
  shadow-mapSize={[2048, 2048]}
  shadow-bias={-0.0001}
  shadow-camera-far={20}
  shadow-camera-left={-3}
  shadow-camera-right={3}
  shadow-camera-top={3}
  shadow-camera-bottom={-3}
/>

<directionalLight
  position={[-5, 5, -5]}
  intensity={0.4}
  color={themeColorSecondary}
/>

<pointLight
  position={[0, 4, 2]}
  intensity={0.6}
  color={liquidColor}
/>

{/* Ground shadow plane receiver */}
<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
  <planeGeometry args={[20, 20]} />
  <shadowMaterial opacity={0.3} />
</mesh>
```

---

## 4. Canvas Camera Settings & Responsive Layouts

### Current Implementation
- **Location**: `components/GlobalCanvas.tsx`, Line 61 (`camera={{ position: [0, 1.2, 5.5], fov: 45 }}`).
- **Limitations**:
  - A wider FOV of `45` at close range (`Z = 5.5`) causes perspective distortion, making the cocktail glass rims appear overly elliptical.
  - A fixed camera setup does not adjust for portrait mobile screens, resulting in the top or bottom of the glass clipping on narrow viewports.

### Refactoring Strategy
1. **Reduce FOV to 35**:
   A vertical field of view of `35` functions like a portrait/macro lens. This flattens perspective lines and presents the cocktail glass with clean, vertical contours.
2. **Reposition Z coordinate**:
   To compensate for the tighter zoom of `fov={35}`, push the camera back from `Z = 5.5` to `Z = 6.5` or `Z = 7.0` to maintain the object's relative scale in the viewport.
3. **Responsive Camera Controller**:
   Add a `<CameraController />` helper component inside the `<View>` block of `ThreeCocktailScene.tsx` using the `useThree` hook. This dynamically changes the camera's FOV and position based on viewport aspect ratio, preventing clipping on mobile.

### Proposed Code Change
Insert this helper component inside `components/ThreeCocktailScene.tsx`:
```tsx
import { useThree } from '@react-three/fiber';

function CameraController() {
  const { camera, size } = useThree();

  useEffect(() => {
    const isMobile = size.width < 768;
    camera.fov = isMobile ? 42 : 35; // Slightly wider on mobile to prevent clipping
    camera.position.set(0, isMobile ? 1.0 : 0.8, isMobile ? 6.5 : 7.2);
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);

  return null;
}
```
And mount it inside `<Suspense>` within the `<View>` block:
```tsx
<View className="absolute inset-0 z-10 w-full h-full">
  <Suspense fallback={null}>
    <CameraController />
    <RotatingScene>
       ...
```
