import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { InputState, RoverPose } from '../../types/rover'
import {
    CAMERA_CHASE_LAG_MAX_MULTIPLIER,
    CAMERA_CHASE_SPRING_HZ,
    CAMERA_DEFAULT_TARGET,
    CAMERA_PRESET_CANCEL_MOUSE_PX,
    CAMERA_PRESET_CANCEL_MS,
    CAMERA_PRESET_CANCEL_TOUCH_PX,
    CAMERA_PRESET_SPRING_HZ,
    CAMERA_PRESETS,
} from '../../constants/camera'
import type { SettingsState } from '../../hooks/useSettingsStore'

interface CameraControllerProps {
    orbitRef: React.RefObject<OrbitControlsImpl | null>
    poseRef: React.RefObject<RoverPose>
    preset: 'default' | 'top' | 'chase'
    settings: SettingsState
    getInputState?: () => InputState
}

const TWO_PI = Math.PI * 2
const springStep = (
    current: Vector3,
    velocity: Vector3,
    target: Vector3,
    dt: number,
    hz: number,
) => {
    const w = TWO_PI * hz
    const w2 = w * w
    const damping = 2 * w // critical damping

    // a = w^2 (target - x) - 2 w v
    temp.copy(target).sub(current).multiplyScalar(w2)
    temp.addScaledVector(velocity, -damping)

    velocity.addScaledVector(temp, dt)
    current.addScaledVector(velocity, dt)
}

// Temporary vector to avoid allocations inside springStep
const temp = new Vector3()

const distance2D = (a: Vector3, b: Vector3) => {
    temp.copy(a).sub(b)
    temp.y = 0
    return temp.length()
}

const CameraController = ({ orbitRef, poseRef, preset, settings, getInputState }: CameraControllerProps) => {
    const desiredTarget = useMemo(() => new Vector3(...CAMERA_DEFAULT_TARGET), [])
    const desiredPosition = useMemo(() => new Vector3(...CAMERA_PRESETS.default.position), [])
    const targetVelocity = useMemo(() => new Vector3(), [])
    const positionVelocity = useMemo(() => new Vector3(), [])
    const manualOverrideRef = useRef(false)
    const transitioningRef = useRef(false)
    const lockAppliedRef = useRef(false)
    const keyHoldMsRef = useRef(0)
    const pointerState = useRef({
        active: false,
        startX: 0,
        startY: 0,
        moved: 0,
        startedAt: 0,
        pointerType: 'mouse' as PointerEvent['pointerType'],
    })

    const setControlsLocked = (locked: boolean) => {
        const ctl = orbitRef.current
        if (!ctl) return
        if (lockAppliedRef.current === locked) return
        lockAppliedRef.current = locked
        ctl.enableRotate = !locked
        ctl.enablePan = !locked
    }

    const resetSpring = () => {
        targetVelocity.setScalar(0)
        positionVelocity.setScalar(0)
    }

    useEffect(() => {
        manualOverrideRef.current = false
        transitioningRef.current = preset === 'default' || preset === 'top'
        resetSpring()
        // Unlock controls when changing presets so the lock logic below can re-apply as needed
        setControlsLocked(false)
    }, [preset])

    useEffect(() => {
        const ctl = orbitRef.current
        if (!ctl) return undefined
        const el = ctl.domElement
        if (!el) return undefined

        const handlePointerDown = (event: PointerEvent) => {
            pointerState.current = {
                active: true,
                startX: event.clientX,
                startY: event.clientY,
                moved: 0,
                startedAt: performance.now(),
                pointerType: event.pointerType,
            }
        }

        const handlePointerMove = (event: PointerEvent) => {
            if (!pointerState.current.active) return
            const dx = event.clientX - pointerState.current.startX
            const dy = event.clientY - pointerState.current.startY
            pointerState.current.moved = Math.hypot(dx, dy)
        }

        const handlePointerUp = () => {
            pointerState.current = { ...pointerState.current, active: false, moved: 0 }
        }

        el.addEventListener('pointerdown', handlePointerDown)
        el.addEventListener('pointermove', handlePointerMove)
        el.addEventListener('pointerup', handlePointerUp)
        el.addEventListener('pointercancel', handlePointerUp)

        return () => {
            el.removeEventListener('pointerdown', handlePointerDown)
            el.removeEventListener('pointermove', handlePointerMove)
            el.removeEventListener('pointerup', handlePointerUp)
            el.removeEventListener('pointercancel', handlePointerUp)
        }
    }, [orbitRef])

    const maybeCancelPreset = (dtMs: number) => {
        if (preset === 'chase') return false
        if (manualOverrideRef.current) return false

        const now = performance.now()

        // Key input sustain detection
        const input = getInputState?.()
        const hasKeys = input ? input.forward || input.backward || input.left || input.right : false
        if (hasKeys) {
            keyHoldMsRef.current += dtMs
        } else {
            keyHoldMsRef.current = 0
        }

        const pointer = pointerState.current
        const pointerThreshold = pointer.pointerType === 'touch'
            ? CAMERA_PRESET_CANCEL_TOUCH_PX
            : CAMERA_PRESET_CANCEL_MOUSE_PX

        const pointerSustainMet = pointer.active
            && pointer.moved >= pointerThreshold
            && now - pointer.startedAt >= CAMERA_PRESET_CANCEL_MS

        const keySustainMet = hasKeys && keyHoldMsRef.current >= CAMERA_PRESET_CANCEL_MS

        if (pointerSustainMet || keySustainMet) {
            manualOverrideRef.current = true
            transitioningRef.current = false
            setControlsLocked(false)
            return true
        }
        return false
    }

    useFrame((_, delta) => {
        const ctl = orbitRef.current
        if (!ctl) return
        const dt = Math.max(delta, 0.001)

        const isPresetSpring = preset === 'default' || preset === 'top'
        const isChase = preset === 'chase'

        const pose = poseRef.current

        if (preset === 'default') {
            desiredTarget.set(...CAMERA_PRESETS.default.target)
            desiredPosition.set(...CAMERA_PRESETS.default.position)
        } else if (preset === 'top') {
            desiredTarget.set(0, 0, 0)
            desiredPosition.set(0, settings.camera.topHeight, 0.0001)
        } else {
            const [px, py, pz] = pose.position
            desiredTarget.set(px, py, pz)
            desiredPosition.set(
                px + settings.camera.chaseOffset[0],
                py + settings.camera.chaseOffset[1],
                pz + settings.camera.chaseOffset[2],
            )
        }

        maybeCancelPreset(dt * 1000)

        const shouldLock = isPresetSpring && !manualOverrideRef.current && transitioningRef.current
        setControlsLocked(shouldLock)

        const applySpring = isChase || (isPresetSpring && !manualOverrideRef.current)
        if (!applySpring) return

        let freq = isChase ? CAMERA_CHASE_SPRING_HZ : CAMERA_PRESET_SPRING_HZ

        if (isChase) {
            // Soft lag clamp: if camera trails too far, gently increase corrective force
            const followDistance = new Vector3(...settings.camera.chaseOffset).length()
            const lagDistance = distance2D(ctl.object.position, desiredPosition)
            const maxLag = followDistance * CAMERA_CHASE_LAG_MAX_MULTIPLIER
            if (lagDistance > maxLag && followDistance > 0) {
                const excess = Math.min((lagDistance - maxLag) / maxLag, 1)
                freq = CAMERA_CHASE_SPRING_HZ * (1 + excess) // up to 2x
            }
        }

        springStep(ctl.target, targetVelocity, desiredTarget, dt, freq)
        springStep(ctl.object.position, positionVelocity, desiredPosition, dt, freq)

        ctl.object.lookAt(ctl.target)
        ctl.update()

        if (isPresetSpring && !manualOverrideRef.current) {
            const posErr = ctl.object.position.distanceTo(desiredPosition)
            const tgtErr = ctl.target.distanceTo(desiredTarget)
            const posVel = positionVelocity.length()
            const tgtVel = targetVelocity.length()
            if (transitioningRef.current && posErr < 0.02 && tgtErr < 0.02 && posVel < 0.01 && tgtVel < 0.01) {
                transitioningRef.current = false
                setControlsLocked(false)
            }
        }
    })

    return null
}

export default CameraController
