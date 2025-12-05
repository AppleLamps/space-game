import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { RoverPose } from '../../types/rover'

interface MiniMapProps {
  pose: RoverPose
  ghostPose?: RoverPose | null
  zoom: number
  trail: [number, number, number][]
}

const MiniMapScene = ({ pose, ghostPose, trail }: MiniMapProps) => {
  const { invalidate } = useThree()

  useEffect(() => {
    invalidate()
  }, [pose, ghostPose, trail, invalidate])

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[12, 20, 8]} intensity={0.6} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>

      <gridHelper args={[40, 20, '#374151', '#1f2937']} position={[0, 0.01, 0]} />

      <group position={pose.position}>
        <mesh rotation={[-Math.PI / 2, 0, pose.heading]}>
          <coneGeometry args={[0.7, 1.5, 12]} />
          <meshStandardMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <circleGeometry args={[1, 20]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.2} />
        </mesh>
      </group>

      {ghostPose && (
        <group position={ghostPose.position}>
          <mesh rotation={[-Math.PI / 2, 0, ghostPose.heading]}>
            <coneGeometry args={[0.6, 1.2, 12]} />
            <meshStandardMaterial color="#a78bfa" opacity={0.8} transparent />
          </mesh>
        </group>
      )}

      {trail.length > 1 && (
        <line>
          <bufferGeometry
            attach="geometry"
            setFromPoints={trail.map((p) => new THREE.Vector3(p[0], 0.05, p[2]))}
          />
          <lineBasicMaterial color="#f97316" linewidth={2} />
        </line>
      )}
    </>
  )
}

const MiniMap = ({ pose, ghostPose, zoom, trail }: MiniMapProps) => {
  return (
    <div className="pointer-events-auto h-52 w-52 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur sm:h-64 sm:w-64">
      <Canvas
        orthographic
        frameloop="demand"
        camera={{ position: [0, 30, 0], up: [0, 0, -1], zoom }}
      >
        <MiniMapScene pose={pose} ghostPose={ghostPose} trail={trail} />
      </Canvas>
    </div>
  )
}

export default MiniMap

