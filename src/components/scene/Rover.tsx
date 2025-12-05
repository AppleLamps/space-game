import { useEffect, useMemo } from 'react'
import type { Mesh } from 'three'
import { BoxGeometry, CylinderGeometry, Vector3 } from 'three'
import type { RoverPose, RoverTelemetry } from '../../types/rover'
import type { RoverControls } from '../../hooks/useRoverControls'
import { ROVER_TUNING_PRESETS, type RoverTuning } from '../../constants/rover'
import type { Biome } from '../../simulation/biomes'
import { useRoverPhysics } from './useRoverPhysics'

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
  const { roverRef, wheelRefs } = useRoverPhysics({
    controls,
    biome,
    rocks,
    traction,
    config,
    onPoseChange,
    onTelemetry,
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

