import type { RoverPose } from '../../types/rover'

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
}: HudOverlayProps) => {
  const headingDeg = (pose.heading * 180) / Math.PI
  return (
    <div className="pointer-events-none flex flex-wrap gap-3 text-sm text-slate-100">
      <div className="pointer-events-auto rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur">
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
          <div>
            <p className="text-xs text-slate-400">RPM</p>
            <p className="text-lg font-semibold">{rpm.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">FPS</p>
            <p className="text-lg font-semibold">{fps.toFixed(0)}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span
            className={`rounded-full px-2 py-1 font-semibold ${
              slipping ? 'bg-yellow-500/20 text-yellow-200' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {slipping ? 'Slip' : 'Grip'}
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-1 font-semibold text-slate-300">
            Traction {(traction * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span
            className={`rounded-full px-2 py-1 font-semibold ${
              isRecording ? 'bg-red-500/20 text-red-200' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Rec {isRecording ? '●' : '○'}
          </span>
          <span
            className={`rounded-full px-2 py-1 font-semibold ${
              isPlaying ? 'bg-purple-500/20 text-purple-200' : 'bg-slate-800 text-slate-300'
            }`}
          >
            Playback {isPlaying ? '●' : '○'}
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-1 font-semibold text-slate-300">
            Drive {driveEnabled ? 'On' : 'Off'}
          </span>
        </div>
      </div>
      <div className="pointer-events-auto rounded-xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-300/80">Position</p>
        <p className="mt-1 font-semibold">{pose.position.map((v) => v.toFixed(1)).join(', ')}</p>
      </div>
    </div>
  )
}

export default HudOverlay

