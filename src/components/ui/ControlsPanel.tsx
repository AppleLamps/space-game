  biomeId: string
  biomes: { id: string; name: string }[]
  onChangeBiome: (id: string) => void
  onPresetCamera: (preset: 'default' | 'top' | 'chase') => void
  traction: number
  onChangeTraction: (value: number) => void
import type { RoverPose } from '../../types/rover'
import type { RoverControls } from '../../hooks/useRoverControls'

interface ControlsPanelProps {
  controls: RoverControls
  pose: RoverPose
  onResetCamera: () => void
  onPresetCamera: (preset: 'default' | 'top' | 'chase') => void
  onStartRecord: () => void
  onStopRecord: () => void
  isRecording: boolean
  onStartPlayback: () => void
  onStopPlayback: () => void
  isPlaying: boolean
  hasRecording: boolean
  biomeId: string
  biomes: { id: string; name: string }[]
  onChangeBiome: (id: string) => void
  traction: number
  onChangeTraction: (value: number) => void
}

const formatPosition = (position: [number, number, number]) =>
  position.map((axis) => axis.toFixed(1)).join(', ')

const ControlsPanel = ({
  controls,
  pose,
  onResetCamera,
  onPresetCamera,
  onStartRecord,
  onStopRecord,
  isRecording,
  onStartPlayback,
  onStopPlayback,
  isPlaying,
  hasRecording,
  biomeId,
  biomes,
  onChangeBiome,
  traction,
  onChangeTraction,
}: ControlsPanelProps) => {
  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-800/70 bg-slate-900/80 p-4 shadow-xl backdrop-blur">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-300/80">Mars Rover</p>
          <h1 className="text-xl font-semibold text-slate-100">Interactive Lab</h1>
        </div>
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-200">
          Live
        </span>
      </header>

      <div className="relative">
        {!controls.driveEnabled && (
          <div className="pointer-events-none absolute -top-3 right-0 rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200 shadow">
            Drive disabled
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          aria-pressed={controls.driveEnabled}
          onClick={controls.toggleDrive}
          className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${
            controls.driveEnabled
              ? 'bg-orange-500 text-white hover:bg-orange-400'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {controls.driveEnabled ? 'Driving: ON' : 'Driving: OFF'}
        </button>

        <button
          type="button"
          onClick={controls.reset}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
        >
          Reset Rover
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onResetCamera}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
          >
            Reset Camera
          </button>
          <button
            type="button"
            onClick={() => onPresetCamera('top')}
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
          >
            Top
          </button>
          <button
            type="button"
            onClick={() => onPresetCamera('chase')}
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
          >
            Chase
          </button>
          <button
            type="button"
            onClick={() => onPresetCamera('default')}
            className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-100 shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
          >
            Default
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Speed: <span className="font-semibold text-orange-300">{controls.speed.toFixed(1)} m/s</span>
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={controls.speed}
          onChange={(event) => controls.setSpeed(Number(event.target.value))}
          className="w-full accent-orange-500"
        />
        <label className="mt-3 mb-2 block text-sm font-medium text-slate-200">
          Traction: <span className="font-semibold text-orange-300">{traction.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={traction}
          onChange={(event) => onChangeTraction(Number(event.target.value))}
          className="w-full accent-orange-500"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
        <div className="rounded-lg border border-slate-800/60 bg-slate-800/30 p-2">
          <p className="font-semibold text-orange-300">Controls</p>
          <p className="mt-1">W / Up: Forward</p>
          <p>A / Left: Turn Left</p>
          <p>S / Down: Reverse</p>
          <p>D / Right: Turn Right</p>
        </div>
        <div className="rounded-lg border border-slate-800/60 bg-slate-800/30 p-2">
          <p className="font-semibold text-orange-300">Status</p>
          <p>Drive: {controls.driveEnabled ? 'Engaged' : 'Idle'}</p>
          <p>Position: {formatPosition(pose.position)}</p>
          <p>Heading: {(pose.heading * (180 / Math.PI)).toFixed(0)}°</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
        <button
          type="button"
          onClick={isRecording ? onStopRecord : onStartRecord}
          className={`rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-400'
              : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
          }`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          type="button"
          onClick={isPlaying ? onStopPlayback : onStartPlayback}
          disabled={!hasRecording && !isPlaying}
          className={`rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 ${
            isPlaying
              ? 'bg-purple-500 text-white hover:bg-purple-400'
              : 'bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-50'
          }`}
        >
          {isPlaying ? 'Stop Playback' : 'Play Recording'}
        </button>
      </div>

      <div className="mt-3">
        <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="biome">
          Terrain Profile
        </label>
        <select
          id="biome"
          value={biomeId}
          onChange={(event) => onChangeBiome(event.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400"
        >
          {biomes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}

export default ControlsPanel

