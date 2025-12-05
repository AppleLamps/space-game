import { Canvas } from '@react-three/fiber'
import { OrbitControls, StatsGl } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3 } from 'three'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lighting from './components/scene/Lighting'
import Rover from './components/scene/Rover'
import Terrain from './components/scene/Terrain'
import MiniMap, { MiniMapView } from './components/ui/MiniMap'
import ControlsPanel from './components/ui/ControlsPanel'
import HudOverlay from './components/ui/HudOverlay'
import { useRoverControls } from './hooks/useRoverControls'
import type { RoverPose } from './types/rover'
import { CAMERA_DEFAULT_POSITION, CAMERA_DEFAULT_TARGET } from './constants/camera'
import { ROVER_RESET_Y, TRACTION, ROVER_TUNING_PRESETS } from './constants/rover'
import { BREADCRUMB_LIMIT } from './constants/minimap'
import { useReplay } from './hooks/useReplay'
import Ghost from './components/scene/Ghost'
import { biomes, defaultBiomeId, type BiomeId } from './simulation/biomes'
import BreadcrumbToggle from './components/ui/BreadcrumbToggle'
import { useSimState } from './state/useSimState'
import { setRoverPreset, useSettings } from './hooks/useSettingsStore'
import CameraController from './components/scene/CameraController'
import { useTelemetryBridge } from './hooks/useTelemetryBridge'

function App() {
  const controls = useRoverControls()
  const sim = useSimState()
  const settings = useSettings()
  const replay = useReplay()
  const { tick } = replay
  const [pose, setPose] = useState<RoverPose>({ position: [0, ROVER_RESET_Y, 0], heading: 0 })
  const orbitRef = useRef<OrbitControlsImpl>(null)
  const [biomeId, setBiomeId] = useState<BiomeId>(defaultBiomeId)
  const biome = biomes[biomeId]
  const [rocks, setRocks] = useState<{ position: Vector3; radius: number }[]>([])
  const [trailEnabled, setTrailEnabled] = useState(true)
  const trailRef = useRef<[number, number, number][]>([])
  const [, forceTrailRender] = useState(0)
  const [minimapZoom, setMinimapZoom] = useState(() => settings.minimap.defaultZoom)
  const minimapTrackRef = useRef<HTMLDivElement>(null)
  const [traction, setTraction] = useState(TRACTION)
  const [cameraPreset, setCameraPreset] = useState<'default' | 'top' | 'chase'>('default')
  const poseRef = useRef<RoverPose>(pose)
  const { hudState, updateTelemetry } = useTelemetryBridge({ tick, isPlaying: replay.state.isPlaying })

  useEffect(() => {
    controls.setDriveEnabled(sim.allowInput)
  }, [controls, sim.allowInput])

  useEffect(() => {
    if (!replay.state.isPlaying && sim.isPlaying) {
      sim.send({ type: 'stopPlayback' })
    }
  }, [replay.state.isPlaying, sim])
  useEffect(() => {
    poseRef.current = pose
  }, [pose])

  const handlePoseChange = useCallback(
    (nextPose: RoverPose) => {
      setPose(nextPose)
      replay.recordPose(nextPose)
      if (trailEnabled) {
        const target = trailRef.current
        target.push(nextPose.position)
        if (target.length > BREADCRUMB_LIMIT) target.shift()
        forceTrailRender((value) => value + 1)
      }
    },
    [forceTrailRender, replay, trailEnabled],
  )

  const handleResetCamera = useCallback(() => {
    setCameraPreset('default')
  }, [])

  const handlePresetCamera = useCallback((preset: 'default' | 'top' | 'chase') => {
    setCameraPreset(preset)
  }, [])

  const handleStopRecording = useCallback(() => {
    sim.send({ type: 'stopRecord' })
    replay.stopRecording()
  }, [replay, sim])

  const handleStopPlayback = useCallback(() => {
    sim.send({ type: 'stopPlayback' })
    replay.stopPlayback()
  }, [replay, sim])

  const handleToggleDrive = useCallback(() => {
    if (sim.isRecording) {
      handleStopRecording()
      return
    }
    if (sim.isPlaying) {
      handleStopPlayback()
    }
    sim.send({ type: 'toggleDrive' })
  }, [handleStopPlayback, handleStopRecording, sim])

  const handleStartRecording = useCallback(() => {
    if (sim.isPlaying) {
      replay.stopPlayback()
    }
    sim.send({ type: 'startRecord' })
    replay.startRecording()
  }, [replay, sim])

  const handleStartPlayback = useCallback(() => {
    if (sim.isRecording) {
      handleStopRecording()
    }
    sim.send({ type: 'startPlayback' })
    replay.startPlayback()
  }, [handleStopRecording, replay, sim])

  const handleChangeBiome = useCallback((id: string) => {
    if (biomes[id as BiomeId]) {
      setBiomeId(id as BiomeId)
      trailRef.current = []
      forceTrailRender((value) => value + 1)
    }
  }, [forceTrailRender])

  const handleSeek = useCallback(
    (value: number) => {
      replay.seek(value)
    },
    [replay],
  )

  const handleExport = useCallback(() => {
    const data = replay.exportReplay()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rover-replay.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [replay])

  const ghostPose = replay.ghostPose
  const playhead = replay.state.playhead
  const duration = replay.state.duration

  const gatedControls = useMemo(
    () => ({
      ...controls,
      toggleDrive: handleToggleDrive,
    }),
    [controls, handleToggleDrive],
  )

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: CAMERA_DEFAULT_POSITION, fov: 50 }}>
          <color attach="background" args={['#080f1f']} />
          <fog attach="fog" args={[biome.fogColor, ...biome.fogRange]} />
          <Lighting biome={biome} />
          <Terrain biome={biome} onRocksReady={(list) => setRocks(list)} />
          <Rover
            controls={gatedControls}
            onPoseChange={handlePoseChange}
            biome={biome}
            rocks={rocks}
            traction={traction}
            tuning={settings.rover}
            onTelemetry={({ rpm: rpmReading, slipping: slipState, pitch: pitchDeg, roll: rollDeg }) => {
              updateTelemetry({
                rpm: rpmReading,
                slipping: slipState,
                pitch: pitchDeg,
                roll: rollDeg,
              })
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
          <CameraController
            orbitRef={orbitRef}
            poseRef={poseRef}
            preset={cameraPreset}
            settings={settings}
            getInputState={controls.getInputState}
          />
          <MiniMapView
            track={minimapTrackRef}
            pose={pose}
            ghostPose={ghostPose}
            zoom={minimapZoom}
            trail={trailRef.current}
          />
          {import.meta.env.DEV && <StatsGl className="top-auto bottom-2 left-2 right-auto" />}
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto m-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <ControlsPanel
            controls={gatedControls}
            pose={pose}
            onResetCamera={handleResetCamera}
            onPresetCamera={handlePresetCamera}
            onStartRecord={handleStartRecording}
            onStopRecord={handleStopRecording}
            isRecording={sim.isRecording}
            onStartPlayback={handleStartPlayback}
            onStopPlayback={handleStopPlayback}
            isPlaying={sim.isPlaying}
            hasRecording={replay.state.samples.length > 0}
            playhead={playhead}
            duration={duration}
            onSeek={handleSeek}
            onExport={handleExport}
            biomeId={biomeId}
            biomes={Object.values(biomes).map(({ id, name }) => ({ id, name }))}
            onChangeBiome={handleChangeBiome}
            traction={traction}
            onChangeTraction={setTraction}
            roverPresets={Object.keys(ROVER_TUNING_PRESETS)}
            onSelectRoverPreset={setRoverPreset}
          />
          <div className="flex flex-col items-end gap-3 sm:items-start">
            <HudOverlay
              pose={pose}
              speed={gatedControls.speed}
              driveEnabled={sim.allowInput}
              isRecording={sim.isRecording}
              isPlaying={sim.isPlaying}
              rpm={hudState.rpm}
              fps={hudState.fps}
              traction={traction}
              slipping={hudState.slipping}
              pitch={hudState.pitch}
              roll={hudState.roll}
            />
            <div className="self-end sm:self-auto">
              <div className="mb-2 flex items-center justify-end gap-2 sm:justify-start">
                <button
                  type="button"
                  onClick={() =>
                    setMinimapZoom((z) => Math.min(settings.minimap.zoomRange[1], z + 1))
                  }
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-orange-400"
                  aria-label="Zoom in minimap"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMinimapZoom((z) => Math.max(settings.minimap.zoomRange[0], z - 1))
                  }
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-orange-400"
                  aria-label="Zoom out minimap"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setMinimapZoom(settings.minimap.defaultZoom)}
                  className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-orange-400"
                  aria-label="Reset minimap zoom"
                >
                  reset
                </button>
                <BreadcrumbToggle enabled={trailEnabled} onToggle={() => setTrailEnabled((v) => !v)} />
              </div>
              <MiniMap
                trackRef={minimapTrackRef}
                pose={pose}
                ghostPose={ghostPose}
                zoom={minimapZoom}
                trail={trailRef.current}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
