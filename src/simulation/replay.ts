import type { RoverPose } from '../types/rover'

export interface PoseSample {
  time: number
  pose: RoverPose
}

export interface ReplayState {
  isRecording: boolean
  isPlaying: boolean
  samples: PoseSample[]
  startedAt: number
  lastSavedAt: number
}

export const createReplayState = (): ReplayState => ({
  isRecording: false,
  isPlaying: false,
  samples: [],
  startedAt: 0,
  lastSavedAt: 0,
})

const STORAGE_KEY = 'rover-replay'

const safeLoad = (): PoseSample[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PoseSample[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (error) {
    console.warn('Failed to load replay', error)
    return []
  }
}

const safeSave = (samples: PoseSample[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples))
  } catch (error) {
    console.warn('Failed to save replay', error)
  }
}

export const startRecording = (state: ReplayState) => {
  state.isRecording = true
  state.startedAt = performance.now()
  state.samples = []
}

export const stopRecording = (state: ReplayState) => {
  state.isRecording = false
  state.lastSavedAt = performance.now()
  if (state.samples.length) {
    safeSave(state.samples)
  }
}

export const recordPose = (state: ReplayState, pose: RoverPose) => {
  if (!state.isRecording) return
  const time = performance.now() - state.startedAt
  state.samples.push({ time, pose })
}

export const startPlayback = (state: ReplayState) => {
  if (!state.samples.length) {
    state.samples = safeLoad()
  }
  if (!state.samples.length) return
  state.isPlaying = true
  state.startedAt = performance.now()
}

export const stopPlayback = (state: ReplayState) => {
  state.isPlaying = false
}

export const getGhostPose = (state: ReplayState): RoverPose | null => {
  if (!state.isPlaying || state.samples.length === 0) return null

  const elapsed = performance.now() - state.startedAt
  const total = state.samples[state.samples.length - 1]?.time ?? 0
  if (elapsed >= total) {
    return state.samples[state.samples.length - 1].pose
  }

  // find nearest samples for interpolation
  let nextIndex = state.samples.findIndex((s) => s.time >= elapsed)
  if (nextIndex <= 0) {
    nextIndex = 1
  }
  const prev = state.samples[nextIndex - 1]
  const next = state.samples[nextIndex]
  if (!prev || !next) return null

  const alpha = (elapsed - prev.time) / Math.max(next.time - prev.time, 1)
  const lerp = (a: number, b: number) => a + (b - a) * alpha

  return {
    position: [
      lerp(prev.pose.position[0], next.pose.position[0]),
      lerp(prev.pose.position[1], next.pose.position[1]),
      lerp(prev.pose.position[2], next.pose.position[2]),
    ],
    heading: lerp(prev.pose.heading, next.pose.heading),
  }
}

