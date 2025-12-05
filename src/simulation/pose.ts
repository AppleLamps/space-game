import type { RoverPose } from '../types/rover'
import { HEADING_EPSILON, POSITION_EPSILON, POSE_EMIT_HZ } from '../constants/simulation'

export const shouldEmitPose = (current: RoverPose, next: RoverPose, elapsed: number): boolean => {
  const positionDelta =
    Math.abs(next.position[0] - current.position[0]) +
    Math.abs(next.position[1] - current.position[1]) +
    Math.abs(next.position[2] - current.position[2])
  const headingDelta = Math.abs(next.heading - current.heading)

  const movedEnough = positionDelta > POSITION_EPSILON || headingDelta > HEADING_EPSILON
  const timedOut = elapsed >= 1 / POSE_EMIT_HZ
  return movedEnough || timedOut
}

