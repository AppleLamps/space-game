# Mars Rover Simulator (React + Three.js + Tailwind)

An interactive 3D Mars rover playground built with React, Vite, Tailwind CSS, and Three.js (via React Three Fiber). Drive a rover across procedurally generated terrain with orbit/pan/zoom camera controls, animated wheels, and a synchronized mini-map.

## Features

- Three.js scene via React Three Fiber + drei helpers
- Procedural seeded terrains (biome selector: Mars, Icy, Windy Dunes) with instanced rocks
- Boxy rover with animated wheels, tilt over terrain, traction/slip model, and basic rock avoidance
- Keyboard driving (WASD or arrows) with drive toggle, speed, and traction sliders
- Orbit/pan/zoom camera with reset and presets (Default/Top/Chase)
- Mini-map (top-down orthographic) with zoom controls, ghost marker, and breadcrumb trail toggle
- HUD telemetry: speed, heading, RPM, FPS, traction, slip/grip, drive/record/play states
- Replay/ghost: record poses, persist to localStorage, playback with scene + minimap ghost

## Prerequisites

- Node.js 18+
- npm

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Open the dev server URL shown in the console (default <http://localhost:5173>).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check then build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint across the repo |

## Controls

- Toggle drive: click “Driving: ON/OFF” (input ignored while off)
- Move: W / ↑ (forward), S / ↓ (reverse), A / ← (turn left), D / → (turn right)
- Speed: adjust with the speed slider
- Traction: adjust grip/slip with the traction slider
- Reset rover: snaps to origin/zero heading
- Camera: orbit/pan/zoom with mouse/scroll; presets (Default/Top/Chase); Reset Camera button
- Biomes: select terrain profile from the dropdown
- Replay: Start/Stop Recording; Play/Stop Playback (persists across refresh)
- Minimap: zoom +/- buttons; toggle trail; shows ghost during playback

## Tech Stack

- React + TypeScript + Vite
- Three.js via @react-three/fiber and @react-three/drei
- Tailwind CSS (utility-first styling)

## Notes

- All geometry is generated in code (no external assets required).
- Tailwind is configured via PostCSS (`postcss.config.js`) and `tailwind.config.js`. Styles live in `src/index.css` using `@import "tailwindcss";`.
- Rover input is cleared when the tab loses focus to avoid “stuck key” movement on return.
- Rover pose updates are throttled; replay samples persist to `localStorage` under `rover-replay`.
- Development-only: the stats overlay appears in dev builds; it is hidden in production.

## Project Structure (high level)

```
src/
  components/
    scene/ (Lighting, Terrain, Rover, Ghost)
    ui/ (ControlsPanel, MiniMap, HudOverlay, BreadcrumbToggle)
  hooks/ (useRoverControls)
  simulation/ (terrain, biomes, pose, replay, random)
  constants/ (simulation.ts)
  types/ (rover.ts)
  App.tsx
  main.tsx
  index.css
```

## Future Extensions

- Camera feeds and richer HUD overlays (e.g., sensor panels)
- Telemetry export/playback timeline
- Additional obstacles/biomes and more accurate collision
- Improved physics (wheel suspension + traction curves)
