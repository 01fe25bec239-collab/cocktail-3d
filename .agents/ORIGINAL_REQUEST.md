# Original User Request

## Initial Request — 2026-06-22T02:02:19Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Refactor the WebGL rendering pipeline to cinematic quality by implementing advanced Physically Based Rendering (PBR) glass materials, volumetric liquid absorption, Image-Based Lighting (IBL), and a tighter cinematic camera FOV.

Working directory: /Users/omkar/Documents/cocktail_3d..

## Requirements

### R1. Cinematic Glass Materials
Locate the glass meshes in the 3D models and replace their materials with `@react-three/drei`'s `<MeshTransmissionMaterial />`. Ensure it has high transmission (1.0), low roughness (0.05), accurate IOR (1.52), thickness (1.5-2.0), and clearcoat (1.0) for a highly polished surface.

### R2. Volumetric Liquids
Locate the liquid meshes and implement a `MeshPhysicalMaterial` featuring volumetric absorption using `attenuationColor` and `attenuationDistance`. Set transmission to 0.9 and roughness to 0.1 to create depth.

### R3. Image-Based Lighting (IBL)
Inject a studio HDRI environment using `<Environment preset="studio" background={false} />` from `@react-three/drei` inside the `<Canvas>`. Add a directional light with shadow casting for rim highlights.

### R4. Camera Composition
Adjust the `<Canvas>` camera's FOV to a tighter focal length (e.g., 35 or 45) to prevent distortion. Isolate the `<Canvas>` wrapper if necessary to prevent UI overlap.

## Acceptance Criteria

### Verification Checks
- [ ] Source Code Verification: `ThreeCocktailScene.tsx` contains `<MeshTransmissionMaterial>` with `ior={1.52}`.
- [ ] Source Code Verification: Liquid materials use `attenuationColor` and `attenuationDistance`.
- [ ] Source Code Verification: `GlobalCanvas.tsx` imports and renders `<Environment preset="studio" />`.
- [ ] Source Code Verification: Camera FOV is updated to `35` or `45`.
