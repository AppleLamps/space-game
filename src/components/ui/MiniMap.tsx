import { OrthographicCamera, View } from '@react-three/drei'
import type { MutableRefObject } from 'react'
import { useEffect, useMemo } from 'react'
import {
  CatmullRomCurve3,
  MeshBasicMaterial,
  TubeGeometry,
  Vector3,
} from 'three'
import type { RoverPose } from '../../types/rover'

interface MiniMapProps {
  pose: RoverPose
  ghostPose?: RoverPose | null
  zoom?: number
  trail: [number, number, number][]
  trackRef: MutableRefObject<HTMLDivElement | null>
}

interface MiniMapViewProps extends Omit<MiniMapProps, 'trackRef'> {
  track: MutableRefObject<HTMLDivElement | null>
}

const buildTrailGeometry = (trail: [number, number, number][]) => {
  if (trail.length < 2) return null
  const points = trail.map((p) => new Vector3(p[0], 0.05, p[2]))
  const curve = new CatmullRomCurve3(points, false, 'centripetal')
  const segments = Math.max(points.length * 2, 12)
  return new TubeGeometry(curve, segments, 0.05, 6, false)
}

export const MiniMapView = ({ track, pose, ghostPose, trail, zoom = 18 }: MiniMapViewProps) => {
  const trailMaterial = useMemo(
    () => new MeshBasicMaterial({ color: '#f97316', transparent: true, opacity: 0.9 }),
    [],
  )

  const trailGeometry = useMemo(() => buildTrailGeometry(trail), [trail])

  useEffect(() => () => {
    trailGeometry?.dispose()
  }, [trailGeometry])

  return (
    <View track={track} id="minimap-view">
      <OrthographicCamera
        makeDefault={false}
        position={[0, 30, 0]}
        up={[0, 0, -1]}
        zoom={zoom}
      />

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

      <mesh geometry={trailGeometry ?? undefined} visible={!!trailGeometry} material={trailMaterial} />
    </View>
  )
}

const MiniMap = ({ trackRef, zoom, trail }: MiniMapProps) => (
  <div
    ref={trackRef}
    className="pointer-events-auto h-52 w-52 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/80 shadow-2xl backdrop-blur sm:h-64 sm:w-64"
    role="img"
    aria-label="Top-down minimap showing rover trail"
    aria-live="polite"
    data-zoom={zoom}
    data-trail-size={trail.length}
  />
)

export default MiniMap

