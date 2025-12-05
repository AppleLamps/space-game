# Mars Rover Simulator

An interactive 3D rover sandbox built with React, Vite, Tailwind CSS, and Three.js via React Three Fiber. Drive, replay, and explore seeded biomes with responsive HUD, accessibility affordances, and performance-focused optimizations.

## Features

- Procedural, seeded biomes with cached terrain and instanced rocks spread across the full play area; color/height params per biome.
- Rover physics: traction/slip model, rock avoidance, wheel spin, tilt from surface normals, and hard clamping to terrain bounds.
- Input + camera: drive toggle with speed/traction sliders, orbit controls with reset and presets (Default/Top/Chase) now driven by critically damped springs (2.5 Hz presets, 3 Hz chase) with soft lag clamp and sustained-input cancel guard to prevent jittery fights.
- Mini-map: top-down orthographic view, mesh-based breadcrumb trail, zoom/reset controls, and ghost during playback.
- Replay & ghost: record/playback poses, persist to `localStorage`, export JSON, timeline guarded for empty recordings with mm:ss labels; visuals stay eased (shortest-path heading with deadband and mild smoothing) while timing remains strict real-time.
- HUD & accessibility: live telemetry (speed, heading, RPM, FPS, traction, slip, drive/record/play), aria labels/live regions, focusable overlays, drive-disabled banner.
- Performance: throttled HUD/replay ticks, cached biomes/rocks to reduce GC churn.

## Prerequisites

- Node.js 18+
- npm

## Quick Start

```bash
npm install
npm run dev

# Production
npm run build
npm run preview

# Lint / Test
npm run lint
npm run test
```

Open the dev server URL printed to the console (default <http://localhost:5173>).

## Scripts

| Command | Description |
| --- | --- |
| npm run dev | Start the Vite dev server |
| npm run build | Type-check then build for production |
| npm run preview | Preview the production build |
| npm run lint | Run ESLint across the repo |
| npm run test | Run Vitest test suite |

## Controls & UI

- Drive toggle: “Driving: ON/OFF” (input ignored when off).
- Movement: W/↑ forward, S/↓ reverse, A/← turn left, D/→ turn right.
- Speed slider: adjusts base drive speed.
- Traction slider: 0.2–1.5 range to tune grip/slip (matches physics constants).
- Reset rover: snap to origin and zero heading; drive-disabled banner announces state (aria-live).
- Camera: orbit/pan/zoom; presets Default/Top/Chase; reset button. Presets glide via critically damped springs; chase follows with soft lag clamp. Preset transitions cancel only on sustained input (≈200 ms plus ~20 px mouse / 28 px touch, tunable).
- Biomes: select terrain profile; rocks/terrain reuse cached meshes per biome.
- Replay: start/stop recording; play/stop playback; timeline uses mm:ss, disables when empty; export JSON.
- Mini-map: zoom in/out/reset, mesh trail toggle, ghost shown during playback.

## Tech Stack

- React + TypeScript + Vite
- Three.js via @react-three/fiber and @react-three/drei
- Tailwind CSS (PostCSS pipeline)
- Testing with Vitest + Testing Library

## Project Structure (high level)

```
src/
  App.tsx
  main.tsx
  index.css
  components/
    scene/ (Lighting, Terrain, Rover, Ghost, CameraController)
    ui/ (ControlsPanel, MiniMap, HudOverlay, BreadcrumbToggle, tests)
  hooks/ (useRoverControls, useReplay, useSettingsStore)
  simulation/ (terrain, biomes, pose, replay, random)
  constants/ (camera, minimap, rover, scene)
  types/ (rover.ts)
  test/ (setup, shims)
```

## Notes

- Replay data persists to `localStorage` under `rover-replay`.
- HUD/replay updates are throttled to reduce render churn; Stats overlay (drei `StatsGl`) appears only in dev.
- Rocks and terrain meshes/materials are cached per biome to avoid reallocations when switching biomes.
- Rover position is clamped within the terrain bounds; collisions push away from rocks.

## Tuning (key constants)

- Camera springs: presets run at 2.5 Hz, chase at 3 Hz (critically damped) — in `src/constants/camera.ts`.
- Chase lag clamp: max trailing distance is 1.75× the nominal follow distance; excess lag gently increases corrective force.
- Preset cancel thresholds: sustained input ≈200 ms plus drag >=20 px (mouse) or >=28 px (touch); raise px first (e.g., 25/32) before nudging duration (230–250 ms).
- Visual heading smoothing: 6° deadband for indicators/ghost; timing/physics heading remains unchanged.
- Minimap: zoom range defaults from settings (12 base, clamped to 8–20 by `zoomRange`); breadcrumb trail capped at 240 points to stay performant.
- Traction tuning: UI slider clamps to 0.2–1.5 to mirror physics traction bounds.
- Pose emission: rover pose publish rate targets 15 Hz (with movement/heading epsilons); replay sampling respects the emitted cadence.
- UI cadence: HUD updates throttle to ~150 ms; replay playhead ticks at ~50 ms while preserving real-time timing.
