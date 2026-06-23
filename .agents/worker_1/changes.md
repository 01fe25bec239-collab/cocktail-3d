# Refactoring Changes

This document details the changes applied to the rendering pipeline to implement the high-fidelity 3D rendering refactoring.

## 1. Modifying `components/GlobalCanvas.tsx`

- **Imports**: Added `Environment` from `@react-three/drei` and `Suspense` from `react`.
- **Canvas shadows**: Enabled shadows by adding the `shadows` prop to `<Canvas>`.
- **Camera FOV**: Changed camera default FOV from `45` to `35` for a flatter, more cinematic perspective.
- **Environment Lighting**: Added `<Environment preset="studio" background={false} />` inside a `<Suspense>` boundary inside the canvas for high-quality ambient reflections.

## 2. Modifying `components/ThreeCocktailScene.tsx`

- **Imports**: Imported `useThree` from `@react-three/fiber` and `MeshTransmissionMaterial` from `@react-three/drei`.
- **New Glass Mesh Pipeline**:
  - Implemented a `GlassLoader` helper component that traverses loaded GLB scenes, computes bounding spheres, and applies a highly realistic `MeshTransmissionMaterial` with backside thickness, refraction (IOR: 1.52), thickness, and clearcoat to achieve real glass rendering.
  - Rewrote the `Glass` component to return `<GlassLoader>` instead of using a custom basic physical material on `GLBLoader`.
- **translucent Liquid rendering**:
  - Configured `liquidMaterial` as a highly physical translucent material using standard `MeshPhysicalMaterial` options (`transmission: 0.95`, `roughness: 0.05`, `thickness: 2.0`, `ior: 1.333`, `attenuationColor`, and `attenuationDistance: 0.8`) to render volumetric juice and alcohol.
  - Implemented `streamMaterial` for the falling pour stream, using a separate set of translucent parameters (`thickness: 0.2`, `transmission: 0.6`, `ior: 1.333`) to ensure high visibility of the narrow stream.
  - Added shadow casting and shadow receiving properties (`castShadow`, `receiveShadow`) to the liquid and stream meshes.
- **Dynamic Camera Adjustment**:
  - Added `CameraController` utilizing `useThree`'s size hook to dynamically alter camera fov (42 on mobile, 35 on desktop) and position (further back/higher up on mobile) to keep the glass scaled correctly inside the frame.
  - Safe-casted `camera` to `THREE.PerspectiveCamera` to bypass Next.js build-time TypeScript compilation type checking.
  - Added `<CameraController />` inside the scene.
- **High-contrast Studio Lighting**:
  - Decreased `ambientLight` intensity to `0.2` (from `0.5`).
  - Added `castShadow` to the primary `directionalLight` along with fine-tuned shadow map size (`2048x2048`), shadow camera bounds, and a shadow bias (`-0.0001`) to eliminate shadow acne.
  - Decreased secondary `directionalLight` intensity to `0.4` and `pointLight` intensity to `0.6`.
- **Ground shadow catcher**:
  - Inserted a ground mesh plane with `receiveShadow` and `<shadowMaterial opacity={0.3} />` positioned at `[0, -2.2, 0]` to catch realistic soft shadows cast by the cocktail glass and liquid.

## 3. Build & Lint Validation

- Executed `npm run build` which compiled Next.js static and dynamic routes cleanly.
- Executed `npm run lint` which resulted in 0 ESLint warnings or errors.
