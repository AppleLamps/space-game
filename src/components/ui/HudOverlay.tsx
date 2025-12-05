import type { RoverPose } from '../../types/rover'

interface HudOverlayProps {
  pose: RoverPose
  speed: number
  driveEnabled: boolean
  isRecording: boolean
  isPlaying: boolean
  rpm: number
  fps: number
  traction: number
  slipping: boolean
  pitch: number
  roll: number
}

const HudOverlay = ({
  pose,
  speed,
  driveEnabled,
  isRecording,
  isPlaying,
  rpm,
  fps,
  traction,
  slipping,
  pitch,
  roll,
}: HudOverlayProps) => {
  const headingDeg = (pose.heading * 180) / Math.PI
  const slipLabel = slipping ? 'Slip' : 'Grip'
  const slipClass = slipping ? 'bg-yellow-500/20 text-yellow-200' : 'bg-slate-800 text-slate-300'

  return (
    <div className="pointer-events-none flex flex-wrap gap-3 text-sm text-slate-100">
      <div
        className="pointer-events-auto rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur"
        role="region"
        aria-label="Rover telemetry"
        tabIndex={0}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80">Telemetry</p>
        <div className="mt-1 flex items-center gap-3">
          <div>
            <p className="text-xs text-slate-400">Speed</p>
            <p className="text-lg font-semibold">{speed.toFixed(1)} m/s</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Heading</p>
            <p className="text-lg font-semibold">{headingDeg.toFixed(0)}°</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs" role="status" aria-live="polite">
          <span
            className={`rounded-full px-2 py-1 font-semibold ${slipClass}`}
            aria-label={`Traction state: ${slipLabel}`}
          >
            {slipLabel}
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-1 font-semibold text-slate-300">
            Traction {(traction * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span
            className={`rounded-full px-2 py-1 font-semibold ${isRecording ? 'bg-red-500/20 text-red-200' : 'bg-slate-800 text-slate-300'
              }`}
          >
            Rec {isRecording ? '●' : '○'}
          </span>
          <span
            className={`rounded-full px-2 py-1 font-semibold ${isPlaying ? 'bg-purple-500/20 text-purple-200' : 'bg-slate-800 text-slate-300'
              }`}
          >
            Playback {isPlaying ? '●' : '○'}
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-1 font-semibold text-slate-300">
            Drive {driveEnabled ? 'On' : 'Off'}
          </span>
        </div>
      </div>
      <div
        className="pointer-events-auto rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur"
        role="region"
        aria-label="Rover position"
        tabIndex={0}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80">Position</p>
        <p className="mt-1 font-semibold">{pose.position.map((v) => v.toFixed(1)).join(', ')}</p>
      </div>
      <div
        className="pointer-events-auto rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur"
        tabIndex={0}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80">Sensors</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Traction</p>
            <p className="text-sm font-semibold text-slate-100">{(traction * 100).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Slip</p>
            <p className={`text-sm font-semibold ${slipping ? 'text-yellow-200' : 'text-slate-200'}`}>
              {slipLabel}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">RPM</p>
            <p className="text-sm font-semibold text-slate-100">{rpm.toFixed(0)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">FPS</p>
            <p className="text-sm font-semibold text-slate-100">{fps.toFixed(0)}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Pitch</p>
            <p className="text-sm font-semibold text-slate-100">{pitch.toFixed(1)}°</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/40 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Roll</p>
            <p className="text-sm font-semibold text-slate-100">{roll.toFixed(1)}°</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HudOverlay

