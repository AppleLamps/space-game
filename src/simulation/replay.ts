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
  playhead: number
}

export const createReplayState = (): ReplayState => ({
  isRecording: false,
  isPlaying: false,
  samples: [],
  startedAt: 0,
  lastSavedAt: 0,
  playhead: 0,
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
  state.playhead = 0
}

export const stopRecording = (state: ReplayState) => {
  state.isRecording = false
  state.lastSavedAt = performance.now()
  state.playhead = state.samples[state.samples.length - 1]?.time ?? 0
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
  state.startedAt = performance.now() - state.playhead
}

export const stopPlayback = (state: ReplayState) => {
  state.isPlaying = false
  const duration = getDuration(state)
  state.playhead = Math.min(state.playhead, duration)
}

export const getDuration = (state: ReplayState): number =>
  state.samples[state.samples.length - 1]?.time ?? 0

export const seekPlayback = (state: ReplayState, time: number) => {
  const duration = getDuration(state)
  state.playhead = Math.max(0, Math.min(time, duration))
  if (state.isPlaying) {
    state.startedAt = performance.now() - state.playhead
  }
}

export const exportReplay = (state: ReplayState): string => {
  const samples = state.samples.length ? state.samples : safeLoad()
  return JSON.stringify(samples, null, 2)
}

export const getGhostPoseAt = (state: ReplayState, time: number): RoverPose | null => {
  if (state.samples.length === 0) return null
  const duration = getDuration(state)
  const clamped = Math.min(Math.max(time, 0), duration)
  if (clamped >= duration) {
    return state.samples[state.samples.length - 1].pose
  }

  let nextIndex = state.samples.findIndex((s) => s.time >= clamped)
  if (nextIndex <= 0) {
    nextIndex = 1
  }
  const prev = state.samples[nextIndex - 1]
  const next = state.samples[nextIndex]
  if (!prev || !next) return null

  const alpha = (clamped - prev.time) / Math.max(next.time - prev.time, 1)
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

export const getGhostPose = (state: ReplayState): RoverPose | null => {
  if (!state.isPlaying) return null
  const elapsed = performance.now() - state.startedAt
  state.playhead = elapsed
  return getGhostPoseAt(state, state.playhead)
}

