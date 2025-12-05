import { Canvas } from '@react-three/fiber'
import { OrbitControls, StatsGl } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lighting from './components/scene/Lighting'
import Rover from './components/scene/Rover'
import Terrain from './components/scene/Terrain'
import MiniMap from './components/ui/MiniMap'
import ControlsPanel from './components/ui/ControlsPanel'
import HudOverlay from './components/ui/HudOverlay'
import { useRoverControls } from './hooks/useRoverControls'
import type { RoverPose } from './types/rover'
import {
  CAMERA_DEFAULT_POSITION,
  CAMERA_DEFAULT_TARGET,
  ROVER_RESET_Y,
  TRACTION,
} from './constants/simulation'
import {
  createReplayState,
  getGhostPose,
  recordPose,
  startPlayback,
  startRecording,
  stopPlayback,
  stopRecording,
} from './simulation/replay'
import Ghost from './components/scene/Ghost'
import { biomes, defaultBiomeId, type BiomeId } from './simulation/biomes'
import BreadcrumbToggle from './components/ui/BreadcrumbToggle'
import { BREADCRUMB_LIMIT, MINIMAP_DEFAULT_ZOOM, MINIMAP_ZOOM_RANGE } from './constants/simulation'

function App() {
  const controls = useRoverControls()
  const [pose, setPose] = useState<RoverPose>({ position: [0, ROVER_RESET_Y, 0], heading: 0 })
  const [ghostPose, setGhostPose] = useState<RoverPose | null>(null)
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const replay = useMemo(() => createReplayState(), [])
  const [replayVersion, setReplayVersion] = useState(0)
  const [biomeId, setBiomeId] = useState<BiomeId>(defaultBiomeId)
  const biome = biomes[biomeId]
  const [rocks, setRocks] = useState<{ position: Vector3; radius: number }[]>([])
  const [trailEnabled, setTrailEnabled] = useState(true)
  const [trail, setTrail] = useState<[number, number, number][]>([])
  const [minimapZoom, setMinimapZoom] = useState(MINIMAP_DEFAULT_ZOOM)
  const [rpm, setRpm] = useState(0)
  const [slipping, setSlipping] = useState(false)
  const [fps, setFps] = useState(0)
  const [traction, setTraction] = useState(TRACTION)

  const handlePoseChange = useCallback(
    (nextPose: RoverPose) => {
      setPose(nextPose)
      recordPose(replay, nextPose)
      if (trailEnabled) {
        setTrail((prev) => {
          const next = [...prev, nextPose.position]
          if (next.length > BREADCRUMB_LIMIT) next.shift()
          return next
        })
      }
    },
    [replay, trailEnabled],
  )

  const handleResetCamera = useCallback(() => {
    const ctl = orbitRef.current
    if (!ctl) return
    ctl.target.set(...CAMERA_DEFAULT_TARGET)
    ctl.object.position.set(...CAMERA_DEFAULT_POSITION)
    ctl.object.lookAt(...CAMERA_DEFAULT_TARGET)
    ctl.update()
  }, [])

  const handlePresetCamera = useCallback(
    (preset: 'default' | 'top' | 'chase') => {
      const ctl = orbitRef.current
      if (!ctl) return
      if (preset === 'default') {
        ctl.target.set(...CAMERA_DEFAULT_TARGET)
        ctl.object.position.set(...CAMERA_DEFAULT_POSITION)
      } else if (preset === 'top') {
        ctl.target.set(0, 0, 0)
        ctl.object.position.set(0, 30, 0.0001)
      } else if (preset === 'chase') {
        ctl.target.set(...pose.position)
        ctl.object.position.set(pose.position[0] + 6, pose.position[1] + 4, pose.position[2] + 8)
      }
      ctl.object.lookAt(ctl.target)
      ctl.update()
    },
    [pose],
  )

  const handleStartRecording = useCallback(() => {
    startRecording(replay)
    setReplayVersion((v) => v + 1)
  }, [])

  const handleStopRecording = useCallback(() => {
    stopRecording(replay)
    setReplayVersion((v) => v + 1)
  }, [])

  const handleStartPlayback = useCallback(() => {
    startPlayback(replay)
    setReplayVersion((v) => v + 1)
  }, [])

  const handleStopPlayback = useCallback(() => {
    stopPlayback(replay)
    setGhostPose(null)
    setReplayVersion((v) => v + 1)
  }, [])

  const handleChangeBiome = useCallback((id: string) => {
    if (biomes[id as BiomeId]) {
      setBiomeId(id as BiomeId)
      setTrail([])
    }
  }, [])

  useEffect(() => {
    let frameId: number
    const loop = () => {
      const now = performance.now()
      const dt = now - (loop as any).prev || 16
      ;(loop as any).prev = now
      setFps((prev) => Math.max(1, MathUtils.lerp(prev || 60, 1000 / dt, 0.15)))
      const next = getGhostPose(replay)
      setGhostPose(next)
      if (replay.isPlaying) {
        frameId = requestAnimationFrame(loop)
      }
    }
    if (replay.isPlaying) {
      frameId = requestAnimationFrame(loop)
    }
    return () => cancelAnimationFrame(frameId)
  }, [replay.isPlaying, replayVersion, replay])

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: CAMERA_DEFAULT_POSITION, fov: 50 }}>
          <color attach="background" args={['#080f1f']} />
          <fog attach="fog" args={[biome.fogColor, ...biome.fogRange]} />
          <Lighting biome={biome} />
          <Terrain biome={biome} onRocksReady={setRocks} />
          <Rover
            controls={controls}
            onPoseChange={handlePoseChange}
            biome={biome}
            rocks={rocks.map((p) => ({ position: p.position, radius: 1.2 }))}
            onTelemetry={({ rpm, slipping }) => {
              setRpm(rpm)
              setSlipping(slipping)
            }}
          />
          {ghostPose && <Ghost pose={ghostPose} />}
          <OrbitControls
            ref={orbitRef}
            enableDamping
            dampingFactor={0.08}
            target={CAMERA_DEFAULT_TARGET}
            maxPolarAngle={Math.PI / 2.2}
            maxDistance={80}
            minDistance={5}
          />
          {import.meta.env.DEV && <StatsGl className="!top-auto !bottom-2 !left-2 !right-auto" />}
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto m-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <ControlsPanel
            controls={controls}
            pose={pose}
            onResetCamera={handleResetCamera}
            onPresetCamera={handlePresetCamera}
            onStartRecord={handleStartRecording}
            onStopRecord={handleStopRecording}
            isRecording={replay.isRecording}
            onStartPlayback={handleStartPlayback}
            onStopPlayback={handleStopPlayback}
            isPlaying={replay.isPlaying}
            hasRecording={replay.samples.length > 0}
            biomeId={biomeId}
            biomes={Object.values(biomes).map(({ id, name }) => ({ id, name }))}
            onChangeBiome={handleChangeBiome}
            traction={traction}
            onChangeTraction={setTraction}
          />
          <div className="flex flex-col items-end gap-3 sm:items-start">
            <HudOverlay
              pose={pose}
              speed={controls.speed}
              driveEnabled={controls.driveEnabled}
              isRecording={replay.isRecording}
              isPlaying={replay.isPlaying}
              rpm={rpm}
              fps={fps}
              traction={traction}
              slipping={slipping}
            />
            <div className="self-end sm:self-auto">
              <div className="mb-2 flex items-center justify-end gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() =>
                    setMinimapZoom((z) => Math.min(MINIMAP_ZOOM_RANGE[1], z + 1))
                  }
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMinimapZoom((z) => Math.max(MINIMAP_ZOOM_RANGE[0], z - 1))
                  }
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
                >
                  -
                </button>
                <BreadcrumbToggle enabled={trailEnabled} onToggle={() => setTrailEnabled((v) => !v)} />
              </div>
              <MiniMap pose={pose} ghostPose={ghostPose} zoom={minimapZoom} trail={trail} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
