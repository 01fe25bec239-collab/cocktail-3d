# Project: Cinematic WebGL Rendering Pipeline

## Architecture
- React Three Fiber (R3F) application using custom Three.js mesh loaders and component rendering.
- `components/GlobalCanvas.tsx` houses the Canvas setup, and `components/ThreeCocktailScene.tsx` renders the scene elements (Glass, Liquid, Ice, Garnishes, and lights).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Planning | Investigation of codebase and target files | none | DONE |
| 2 | Refactoring Implementation | Apply the refactoring changes to ThreeCocktailScene.tsx and GlobalCanvas.tsx | M1 | DONE |
| 3 | Build & Verification | Compile the project and run verification tests | M2 | DONE |
| 4 | Integrity Audit | Run Forensic Auditor checks on the implemented code | M3 | DONE |

## Interface Contracts
### GlobalCanvas ↔ ThreeCocktailScene
- Canvas settings (fov: 35, shadows enabled, Environment preset="studio" loaded) must be compatible with ThreeCocktailScene's camera and lighting expectations.
- MeshTransmissionMaterial for glass meshes, MeshPhysicalMaterial with volumetric absorption for liquid meshes.

## Code Layout
- `components/GlobalCanvas.tsx` - Canvas configuration
- `components/ThreeCocktailScene.tsx` - Main scene logic, meshes, lighting
