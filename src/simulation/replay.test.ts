import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  createReplayState,
  recordPose,
  startPlayback,
  startRecording,
  stopPlayback,
  stopRecording,
  getGhostPose,
} from './replay'

const poseA = { position: [0, 0, 0] as [number, number, number], heading: 0 }
const poseB = { position: [1, 0, 0] as [number, number, number], heading: Math.PI / 2 }

describe('replay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(performance, 'now').mockReturnValue(0)
    localStorage.clear()
  })

  it('records samples and persists them', () => {
    const state = createReplayState()
    startRecording(state)
    recordPose(state, poseA)
    vi.advanceTimersByTime(100)
    recordPose(state, poseB)
    stopRecording(state)
    expect(state.samples.length).toBe(2)
    const stored = localStorage.getItem('rover-replay')
    expect(stored).toBeTruthy()
  })

  it('plays back saved samples and returns ghost pose', () => {
    const state = createReplayState()
    startRecording(state)
    recordPose(state, poseA)
    vi.advanceTimersByTime(100)
    recordPose(state, poseB)
    stopRecording(state)

    startPlayback(state)
    vi.advanceTimersByTime(50)
    const ghost = getGhostPose(state)
    expect(ghost).not.toBeNull()
    stopPlayback(state)
  })

  it('returns null when not playing', () => {
    const state = createReplayState()
    expect(getGhostPose(state)).toBeNull()
  })
})

