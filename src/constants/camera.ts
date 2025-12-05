export const CAMERA_DEFAULT_POSITION: [number, number, number] = [14, 9, 14]
export const CAMERA_DEFAULT_TARGET: [number, number, number] = [0, 0.8, 0]

export const CAMERA_PRESETS = {
    default: {
        position: CAMERA_DEFAULT_POSITION,
        target: CAMERA_DEFAULT_TARGET,
    },
    top: {
        position: [0, 30, 0.0001] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
    },
    chase: {
        offset: [6, 4, 8] as [number, number, number],
    },
}

// Critically damped spring tuning for camera motion
export const CAMERA_PRESET_SPRING_HZ = 2.5
export const CAMERA_CHASE_SPRING_HZ = 3

// Soft clamp to prevent extreme rubber-banding in chase mode
export const CAMERA_CHASE_LAG_MAX_MULTIPLIER = 1.75

// Cancel thresholds for preset transitions (tweak after playtesting)
export const CAMERA_PRESET_CANCEL_MS = 200
export const CAMERA_PRESET_CANCEL_MOUSE_PX = 20
export const CAMERA_PRESET_CANCEL_TOUCH_PX = 28

// Visual-only heading smoothing for indicators/ghost
export const CAMERA_HEADING_DEADBAND_DEG = 6
