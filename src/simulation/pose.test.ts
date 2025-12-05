import { describe, expect, it } from 'vitest'
import { shouldEmitPose } from './pose'

const basePose = { position: [0, 0, 0] as [number, number, number], heading: 0 }

describe('shouldEmitPose', () => {
  it('emits when position delta exceeds epsilon', () => {
    const next = { position: [0.02, 0, 0] as [number, number, number], heading: 0 }
    expect(shouldEmitPose(basePose, next, 0)).toBe(true)
  })

  it('emits when heading delta exceeds epsilon', () => {
    const next = { position: [0, 0, 0] as [number, number, number], heading: 0.01 }
    expect(shouldEmitPose(basePose, next, 0)).toBe(true)
  })

  it('emits when time exceeds rate even without movement', () => {
    const next = { position: [0, 0, 0] as [number, number, number], heading: 0 }
    expect(shouldEmitPose(basePose, next, 1)).toBe(true)
  })

  it('does not emit for tiny deltas before time threshold', () => {
    const next = { position: [0.001, 0, 0] as [number, number, number], heading: 0.001 }
    expect(shouldEmitPose(basePose, next, 0.01)).toBe(false)
  })
})

