import { useEffect, useMemo, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { BoxGeometry, CylinderGeometry, MathUtils, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import type { RoverPose, RoverTelemetry } from '../../types/rover'
import type { RoverControls } from '../../hooks/useRoverControls'
import {
  ROVER_BASE_HEIGHT,
  ROVER_TUNING_PRESETS,
  type RoverTuning,
} from '../../constants/rover'
import { generateHeight, terrainNormal } from '../../simulation/terrain'
import { shouldEmitPose } from '../../simulation/pose'
import type { Biome } from '../../simulation/biomes'
import { TERRAIN_SIZE } from '../../constants/scene'

interface RoverProps {
  controls: RoverControls
  onPoseChange?: (pose: RoverPose) => void
  biome: Biome
  rocks?: { position: Vector3; radius: number }[]
  traction?: number
  tuning?: RoverTuning
  onTelemetry?: (data: RoverTelemetry) => void
}

const wheelOffsets: [number, number, number][] = [
  [1.1, -0.4, 1.1],
  [1.1, -0.4, 0],
  [1.1, -0.4, -1.1],
  [-1.1, -0.4, 1.1],
  [-1.1, -0.4, 0],
  [-1.1, -0.4, -1.1],
]

const Rover = ({
  controls,
  onPoseChange,
  biome,
  rocks = [],
  traction = 1,
  tuning,
  onTelemetry,
}: RoverProps) => {
  const config = tuning ?? ROVER_TUNING_PRESETS.default
  const roverRef = useRef<Group>(null)
  const wheelRefs = useRef<Mesh[]>([])
  const headingRef = useRef(0)
  const wheelRotationRef = useRef(0)
  const forwardVector = useRef(new Vector3())
  const elapsedRef = useRef(0)
  const lastPoseRef = useRef<RoverPose>({
    position: [0, 0, 0],
    heading: 0,
  })
  const velocityRef = useRef(new Vector3())
  const slipRef = useRef(false)
  const rpmRef = useRef(0)
  const pitchVelRef = useRef(0)
  const rollVelRef = useRef(0)
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
    onPoseChange?.(lastPoseRef.current)
  }, [controls.resetSignal, onPoseChange])

  useFrame((_, delta) => {
    if (!roverRef.current) return
    const input = controls.getInputState()
    const direction = (input.forward ? 1 : 0) + (input.backward ? -1 : 0)
    const turning = (input.left ? 1 : 0) - (input.right ? 1 : 0)

    if (turning !== 0) {
      const turnScale = Math.max(Math.abs(direction), config.minTurnScale)
      headingRef.current += turning * config.turnRate * delta * turnScale
    }

    const speedSetting = controls.driveEnabled ? controls.speed : 0
    const effectiveTraction = MathUtils.clamp(traction, 0.2, 1.5)

    if (speedSetting > 0 && direction !== 0) {
      forwardVector.current.set(
        Math.sin(headingRef.current),
        0,
        -Math.cos(headingRef.current),
      )
      const accel = config.acceleration * direction * speedSetting * delta * effectiveTraction
      velocityRef.current.addScaledVector(forwardVector.current, accel)
    }

    // Apply simple drag
    const drag = Math.pow(config.drag + (1 - Math.min(effectiveTraction, 1)) * 0.05, delta * 60)
    velocityRef.current.multiplyScalar(drag)

    // Slip when turning hard at higher speed
    const lateralSlip = Math.abs(turning) > 0 && velocityRef.current.length() > speedSetting * 0.8
    const slipFactor = lateralSlip
      ? config.slipFactor * (1 - Math.min(effectiveTraction, 1) * 0.5)
      : 1
    slipRef.current = lateralSlip

    // Clamp speed
    if (velocityRef.current.length() > config.maxSpeed) {
      velocityRef.current.setLength(config.maxSpeed)
    }

    roverRef.current.position.addScaledVector(velocityRef.current, slipFactor * delta)
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

    // Wheel rotation from distance traveled
    const distanceTraveled = velocityRef.current.length() * delta
    if (distanceTraveled !== 0) {
      const dirSign = Math.sign(velocityRef.current.dot(forwardVector.current) || direction || 1)
      const wheelDelta = Math.max(
        distanceTraveled / config.wheelRadius,
        config.minWheelSpin * delta,
      )
      wheelRotationRef.current += dirSign * wheelDelta
      rpmRef.current = (wheelDelta / (2 * Math.PI)) * 60
    }

    roverRef.current.rotation.y = headingRef.current

    // Grounding and tilt: keep rover at terrain height with smoothing to simulate suspension
    const groundHeight = generateHeight(roverRef.current.position.x, roverRef.current.position.z, biome)
    const normal = terrainNormal(roverRef.current.position.x, roverRef.current.position.z, biome)
    const tiltX = Math.atan2(normal[2], normal[1]) // pitch
    const tiltZ = -Math.atan2(normal[0], normal[1]) // roll
    const k = config.suspension.stiffness
    const d = config.suspension.damping

    const pitchError = tiltX - roverRef.current.rotation.x
    pitchVelRef.current += (k * pitchError - d * pitchVelRef.current) * delta
    roverRef.current.rotation.x += pitchVelRef.current * delta

    const rollError = tiltZ - roverRef.current.rotation.z
    rollVelRef.current += (k * rollError - d * rollVelRef.current) * delta
    roverRef.current.rotation.z += rollVelRef.current * delta

    const targetY = groundHeight + ROVER_BASE_HEIGHT
    roverRef.current.position.y = MathUtils.lerp(
      roverRef.current.position.y,
      targetY,
      1 - Math.exp(-8 * delta),
    )

    // Simple collision/repulsion from rocks
    if (rocks.length) {
      rocks.forEach((rock) => {
        const offset = roverRef.current!.position.clone().sub(rock.position)
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
      // align wheels slightly with chassis tilt for visual coherence
      wheel.rotation.z = roverRef.current?.rotation.z ?? 0
    })

    const { x, y, z } = roverRef.current.position
    const nextPose: RoverPose = {
      position: [x, y, z],
      heading: headingRef.current,
    }

    elapsedRef.current += delta
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
  })

  const bodyGeometry = useMemo(() => new BoxGeometry(2.4, 0.6, 3), [])
  const mastGeometry = useMemo(() => new BoxGeometry(0.3, 0.8, 0.3), [])
  const headGeometry = useMemo(() => new BoxGeometry(0.9, 0.35, 0.35), [])
  const wheelGeometry = useMemo(
    () => new CylinderGeometry(config.wheelRadius, config.wheelRadius, 0.35, 18),
    [config.wheelRadius],
  )

  useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      mastGeometry.dispose()
      headGeometry.dispose()
      wheelGeometry.dispose()
    }
  }, [bodyGeometry, mastGeometry, headGeometry, wheelGeometry])

  return (
    <group ref={roverRef} castShadow>
      <mesh geometry={bodyGeometry} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d9d9d9" metalness={0.1} roughness={0.6} />
      </mesh>

      <mesh geometry={mastGeometry} position={[0, 0.7, -1]} castShadow>
        <meshStandardMaterial color="#c6c6c6" />
      </mesh>
      <mesh geometry={headGeometry} position={[0, 1.15, -1.1]} castShadow>
        <meshStandardMaterial color="#9ac7ff" emissive="#4fa7ff" emissiveIntensity={0.15} />
      </mesh>

      {wheelOffsets.map((pos, index) => (
        <mesh
          key={index}
          ref={(el) => {
            if (el) wheelRefs.current[index] = el
          }}
          geometry={wheelGeometry}
          position={pos}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
      ))}

      <mesh position={[0, -0.4, 0]} castShadow>
        <boxGeometry args={[2.6, 0.2, 3.1]} />
        <meshStandardMaterial color="#7c6f6f" metalness={0.05} roughness={0.9} />
      </mesh>
    </group>
  )
}

export default Rover

