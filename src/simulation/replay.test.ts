import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  createReplayState,
  exportReplay,
  getDuration,
  getGhostPoseAt,
  recordPose,
  seekPlayback,
  startPlayback,
  startRecording,
  stopPlayback,
  stopRecording,
  getGhostPose,
} from './replay'

const poseA = { position: [0, 0, 0] as [number, number, number], heading: 0 }
const poseB = { position: [1, 0, 0] as [number, number, number], heading: Math.PI / 2 }

let advanceNow: (ms: number) => void = () => { }

describe('replay', () => {
  beforeEach(() => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    advanceNow = (ms: number) => {
      now += ms
    }
    localStorage.clear()
  })

  it('records samples and persists them', () => {
    const state = createReplayState()
    startRecording(state)
    recordPose(state, poseA)
    advanceNow(100)
    recordPose(state, poseB)
    stopRecording(state)
    expect(state.samples.length).toBe(2)
    const stored = localStorage.getItem('rover-replay')
    expect(stored).toBeTruthy()
    expect(getDuration(state)).toBeGreaterThan(0)
  })

  it('plays back saved samples and returns ghost pose', () => {
    const state = createReplayState()
    startRecording(state)
    recordPose(state, poseA)
    advanceNow(100)
    recordPose(state, poseB)
    stopRecording(state)

    startPlayback(state)
    advanceNow(50)
    const ghost = getGhostPose(state)
    expect(ghost).not.toBeNull()
    expect(state.playhead).toBeGreaterThan(0)
    stopPlayback(state)
  })

  it('returns null when not playing', () => {
    const state = createReplayState()
    expect(getGhostPose(state)).toBeNull()
  })

  it('seeks and exports replays', () => {
    const state = createReplayState()
    startRecording(state)
    recordPose(state, poseA)
    advanceNow(100)
    recordPose(state, poseB)
    stopRecording(state)

    seekPlayback(state, 50)
    expect(state.playhead).toBe(50)
    const ghost = getGhostPoseAt(state, 50)
    expect(ghost).not.toBeNull()

    const exported = exportReplay(state)
    expect(exported).toContain('"heading"')
  })
})

