export const DEFAULT_SPEED = 4
export const TURN_RATE = 1.4
export const TURN_MIN_SCALE = 0.35
export const WHEEL_ROTATION_SCALE = 1.4
export const MIN_WHEEL_SPIN = 0.4
export const POSE_EMIT_HZ = 15
export const POSITION_EPSILON = 0.01
export const HEADING_EPSILON = 0.005

export const ROVER_BASE_HEIGHT = 0.65
export const ROVER_RESET_Y = ROVER_BASE_HEIGHT

export const DRAG = 0.9
export const ACCELERATION = 14
export const MAX_SPEED = 12
export const SLIP_FACTOR = 0.35
export const TRACTION = 0.8
export const WHEEL_RADIUS = 0.35

export const SUSPENSION_STIFFNESS = 14
export const SUSPENSION_DAMPING = 7

export type RoverTuning = {
    acceleration: number
    drag: number
    maxSpeed: number
    slipFactor: number
    turnRate: number
    minTurnScale: number
    wheelRadius: number
    minWheelSpin: number
    suspension: {
        stiffness: number
        damping: number
    }
}

export const ROVER_TUNING_PRESETS: Record<string, RoverTuning> = {
    default: {
        acceleration: ACCELERATION,
        drag: DRAG,
        maxSpeed: MAX_SPEED,
        slipFactor: SLIP_FACTOR,
        turnRate: TURN_RATE,
        minTurnScale: TURN_MIN_SCALE,
        wheelRadius: WHEEL_RADIUS,
        minWheelSpin: MIN_WHEEL_SPIN,
        suspension: {
            stiffness: SUSPENSION_STIFFNESS,
            damping: SUSPENSION_DAMPING,
        },
    },
    sporty: {
        acceleration: ACCELERATION * 1.2,
        drag: DRAG,
        maxSpeed: MAX_SPEED * 1.25,
        slipFactor: SLIP_FACTOR * 1.1,
        turnRate: TURN_RATE * 1.05,
        minTurnScale: TURN_MIN_SCALE,
        wheelRadius: WHEEL_RADIUS,
        minWheelSpin: MIN_WHEEL_SPIN,
        suspension: {
            stiffness: SUSPENSION_STIFFNESS * 1.2,
            damping: SUSPENSION_DAMPING * 1.1,
        },
    },
    crawler: {
        acceleration: ACCELERATION * 0.8,
        drag: DRAG * 1.02,
        maxSpeed: MAX_SPEED * 0.7,
        slipFactor: SLIP_FACTOR * 0.8,
        turnRate: TURN_RATE * 0.8,
        minTurnScale: TURN_MIN_SCALE * 0.9,
        wheelRadius: WHEEL_RADIUS,
        minWheelSpin: MIN_WHEEL_SPIN,
        suspension: {
            stiffness: SUSPENSION_STIFFNESS * 0.9,
            damping: SUSPENSION_DAMPING * 1.1,
        },
    },
}
