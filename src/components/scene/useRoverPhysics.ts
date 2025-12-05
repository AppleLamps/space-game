import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3, type Group, type Mesh } from 'three'
import type { RoverPose, RoverTelemetry } from '../../types/rover'
import type { RoverControls } from '../../hooks/useRoverControls'
import { ROVER_BASE_HEIGHT, type RoverTuning } from '../../constants/rover'
import type { Biome } from '../../simulation/biomes'
import { TERRAIN_SIZE } from '../../constants/scene'
import { generateHeight, terrainNormal } from '../../simulation/terrain'
import { shouldEmitPose } from '../../simulation/pose'

const FIXED_DT = 1 / 90
const MAX_STEPS = 8
const MAX_DELTA = 0.05

interface RoverPhysicsParams {
    controls: RoverControls
    biome: Biome
    rocks: { position: Vector3; radius: number }[]
    traction: number
    config: RoverTuning
    onPoseChange?: (pose: RoverPose) => void
    onTelemetry?: (data: RoverTelemetry) => void
}

export function useRoverPhysics({
    controls,
    biome,
    rocks,
    traction,
    config,
    onPoseChange,
    onTelemetry,
}: RoverPhysicsParams) {
    const roverRef = useRef<Group>(null)
    const wheelRefs = useRef<Mesh[]>([])

    const headingRef = useRef(0)
    const wheelRotationRef = useRef(0)
    const forwardVector = useRef(new Vector3())
    const elapsedRef = useRef(0)
    const lastPoseRef = useRef<RoverPose>({ position: [0, 0, 0], heading: 0 })
    const velocityRef = useRef(new Vector3())
    const slipRef = useRef(false)
    const rpmRef = useRef(0)
    const pitchVelRef = useRef(0)
    const rollVelRef = useRef(0)
    const accumulatorRef = useRef(0)

    const rocksRef = useRef(rocks)
    const tractionRef = useRef(traction)
    const biomeRef = useRef(biome)
    const offsetRef = useRef(new Vector3())

    useEffect(() => {
        rocksRef.current = rocks
    }, [rocks])

    useEffect(() => {
        tractionRef.current = traction
    }, [traction])

    useEffect(() => {
        biomeRef.current = biome
    }, [biome])

    const terrainLimit = (TERRAIN_SIZE * 0.5) - 1

    useEffect(() => {
        if (!roverRef.current) return
        roverRef.current.position.set(0, ROVER_BASE_HEIGHT, 0)
        roverRef.current.rotation.set(0, 0, 0)
        headingRef.current = 0
        wheelRotationRef.current = 0
        lastPoseRef.current = { position: [0, ROVER_BASE_HEIGHT, 0], heading: 0 }
        pitchVelRef.current = 0
        rollVelRef.current = 0
        velocityRef.current.set(0, 0, 0)
        onPoseChange?.(lastPoseRef.current)
    }, [controls.resetSignal, onPoseChange])

    useFrame((_, delta) => {
        if (!roverRef.current) return
        const cappedDelta = Math.min(delta, MAX_DELTA)
        accumulatorRef.current += cappedDelta

        let steps = 0
        while (accumulatorRef.current >= FIXED_DT && steps < MAX_STEPS) {
            stepPhysics(FIXED_DT)
            accumulatorRef.current -= FIXED_DT
            steps += 1
        }

        if (steps === MAX_STEPS) {
            accumulatorRef.current = 0
        }
    })

    const stepPhysics = (dt: number) => {
        if (!roverRef.current) return
        const input = controls.getInputState()
        const direction = (input.forward ? 1 : 0) + (input.backward ? -1 : 0)
        const turning = (input.left ? 1 : 0) - (input.right ? 1 : 0)

        if (turning !== 0) {
            const turnScale = Math.max(Math.abs(direction), config.minTurnScale)
            headingRef.current += turning * config.turnRate * dt * turnScale
        }

        const speedSetting = controls.driveEnabled ? controls.speed : 0
        const effectiveTraction = MathUtils.clamp(tractionRef.current, 0.2, 1.5)

        if (speedSetting > 0 && direction !== 0) {
            forwardVector.current.set(
                Math.sin(headingRef.current),
                0,
                -Math.cos(headingRef.current),
            )
            const accel = config.acceleration * direction * speedSetting * dt * effectiveTraction
            velocityRef.current.addScaledVector(forwardVector.current, accel)
        }

        const drag = Math.pow(config.drag + (1 - Math.min(effectiveTraction, 1)) * 0.05, dt * 60)
        velocityRef.current.multiplyScalar(drag)

        const lateralSlip = Math.abs(turning) > 0 && velocityRef.current.length() > speedSetting * 0.8
        const slipFactor = lateralSlip
            ? config.slipFactor * (1 - Math.min(effectiveTraction, 1) * 0.5)
            : 1
        slipRef.current = lateralSlip

        if (velocityRef.current.length() > config.maxSpeed) {
            velocityRef.current.setLength(config.maxSpeed)
        }

        roverRef.current.position.addScaledVector(velocityRef.current, slipFactor * dt)
        roverRef.current.position.x = MathUtils.clamp(
            roverRef.current.position.x,
            -terrainLimit,
            terrainLimit,
        )
        roverRef.current.position.z = MathUtils.clamp(
            roverRef.current.position.z,
            -terrainLimit,
            terrainLimit,
        )

        const distanceTraveled = velocityRef.current.length() * dt
        if (distanceTraveled !== 0) {
            const dirSign = Math.sign(velocityRef.current.dot(forwardVector.current) || direction || 1)
            const wheelDelta = Math.max(
                distanceTraveled / config.wheelRadius,
                config.minWheelSpin * dt,
            )
            wheelRotationRef.current += dirSign * wheelDelta
            rpmRef.current = (wheelDelta / (2 * Math.PI)) * 60
        }

        roverRef.current.rotation.y = headingRef.current

        const groundHeight = generateHeight(
            roverRef.current.position.x,
            roverRef.current.position.z,
            biomeRef.current,
        )
        const normal = terrainNormal(
            roverRef.current.position.x,
            roverRef.current.position.z,
            biomeRef.current,
        )
        const tiltX = Math.atan2(normal[2], normal[1])
        const tiltZ = -Math.atan2(normal[0], normal[1])
        const k = config.suspension.stiffness
        const d = config.suspension.damping

        const pitchError = tiltX - roverRef.current.rotation.x
        pitchVelRef.current += (k * pitchError - d * pitchVelRef.current) * dt
        roverRef.current.rotation.x += pitchVelRef.current * dt

        const rollError = tiltZ - roverRef.current.rotation.z
        rollVelRef.current += (k * rollError - d * rollVelRef.current) * dt
        roverRef.current.rotation.z += rollVelRef.current * dt

        const targetY = groundHeight + ROVER_BASE_HEIGHT
        roverRef.current.position.y = MathUtils.lerp(
            roverRef.current.position.y,
            targetY,
            1 - Math.exp(-8 * dt),
        )

        const rocksList = rocksRef.current
        if (rocksList.length) {
            rocksList.forEach((rock) => {
                const offset = offsetRef.current
                offset.copy(roverRef.current!.position).sub(rock.position)
                const distance = offset.length()
                const minDistance = rock.radius + 1.2
                if (distance < minDistance && distance > 0.01) {
                    const push = (minDistance - distance) * 0.4
                    roverRef.current!.position.addScaledVector(offset.normalize(), push)
                    velocityRef.current.multiplyScalar(0.7)
                }
            })
        }

        wheelRefs.current.forEach((wheel) => {
            if (!wheel) return
            wheel.rotation.x = wheelRotationRef.current
            wheel.rotation.z = roverRef.current?.rotation.z ?? 0
        })

        const { x, y, z } = roverRef.current.position
        const nextPose: RoverPose = {
            position: [x, y, z],
            heading: headingRef.current,
        }

        elapsedRef.current += dt
        if (shouldEmitPose(lastPoseRef.current, nextPose, elapsedRef.current)) {
            lastPoseRef.current = nextPose
            elapsedRef.current = 0
            onPoseChange?.(nextPose)
        }

        onTelemetry?.({
            rpm: rpmRef.current,
            slipping: slipRef.current,
            pitch: MathUtils.radToDeg(roverRef.current.rotation.x),
            roll: MathUtils.radToDeg(roverRef.current.rotation.z),
        })
    }

    return { roverRef, wheelRefs }
}
