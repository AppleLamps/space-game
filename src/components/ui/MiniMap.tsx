import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { RoverPose } from '../../types/rover'

interface MiniMapProps {
  pose: RoverPose
  ghostPose?: RoverPose | null
  zoom?: number
  trail: [number, number, number][]
}

const MiniMapScene = ({ pose, ghostPose, trail }: MiniMapProps) => {
  const { invalidate } = useThree()
  const lineMesh = useRef<THREE.Mesh>(null)
  const trailMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.9 }),
    [],
  )

  useEffect(() => {
    if (!lineMesh.current) {
      invalidate()
      return
    }
    const points = trail.map((p) => new THREE.Vector3(p[0], 0.05, p[2]))
    if (points.length < 2) {
      lineMesh.current.visible = false
      invalidate()
      return
    }
    const curve = new THREE.CatmullRomCurve3(points)
    const geom = new THREE.TubeGeometry(curve, Math.max(points.length * 2, 12), 0.05, 6, false)
    const oldGeo = lineMesh.current.geometry
    lineMesh.current.geometry = geom
    lineMesh.current.visible = true
    oldGeo?.dispose()
    invalidate()
    return () => {
      geom.dispose()
    }
  }, [ghostPose, invalidate, pose, trail])

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

      <mesh ref={lineMesh} visible={false} material={trailMaterial} />
    </>
  )
}

const MiniMap = ({ pose, ghostPose, zoom, trail }: MiniMapProps) => {
  return (
    <div
      className="pointer-events-auto h-52 w-52 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur sm:h-64 sm:w-64"
      role="img"
      aria-label="Top-down minimap showing rover trail"
      aria-live="polite"
    >
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

