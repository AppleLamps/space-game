import { memo, useEffect, useMemo, useRef } from 'react'
import { BoxGeometry, CylinderGeometry, Group, InstancedMesh, MathUtils, Matrix4, MeshStandardMaterial, Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import type { RoverPose } from '../../types/rover'
import { CAMERA_HEADING_DEADBAND_DEG } from '../../constants/camera'

interface GhostProps {
  pose: RoverPose
}

const wheelOffsets: [number, number, number][] = [
  [1.1, -0.4, 1.1],
  [1.1, -0.4, 0],
  [1.1, -0.4, -1.1],
  [-1.1, -0.4, 1.1],
  [-1.1, -0.4, 0],
  [-1.1, -0.4, -1.1],
]

const headingDeadband = MathUtils.degToRad(CAMERA_HEADING_DEADBAND_DEG)

const Ghost = memo(function Ghost({ pose }: GhostProps) {
  const groupRef = useRef<Group>(null)
  const displayPosition = useRef(new Vector3(...pose.position))
  const targetPosition = useRef(new Vector3(...pose.position))
  const displayHeading = useRef(pose.heading)
  const targetHeading = useRef(pose.heading)

  const bodyGeometry = useMemo(() => new BoxGeometry(2.4, 0.6, 3), [])
  const mastGeometry = useMemo(() => new BoxGeometry(0.3, 0.8, 0.3), [])
  const headGeometry = useMemo(() => new BoxGeometry(0.9, 0.35, 0.35), [])
  const wheelGeometry = useMemo(() => new CylinderGeometry(0.35, 0.35, 0.35, 14), [])
  const baseGeometry = useMemo(() => new BoxGeometry(2.6, 0.2, 3.1), [])

  const ghostMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#a78bfa',
        emissive: '#a78bfa',
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.55,
        roughness: 0.6,
      }),
    [],
  )

  const wheelMesh = useMemo(() => {
    const instanced = new InstancedMesh(wheelGeometry, ghostMaterial, wheelOffsets.length)
    const matrix = new Matrix4()
    wheelOffsets.forEach((offset, index) => {
      matrix.setPosition(offset[0], offset[1], offset[2])
      instanced.setMatrixAt(index, matrix)
    })
    instanced.instanceMatrix.needsUpdate = true
    return instanced
  }, [ghostMaterial, wheelGeometry])

  useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      mastGeometry.dispose()
      headGeometry.dispose()
      wheelGeometry.dispose()
      baseGeometry.dispose()
      ghostMaterial.dispose()
      wheelMesh.dispose()
    }
  }, [baseGeometry, bodyGeometry, ghostMaterial, headGeometry, mastGeometry, wheelGeometry, wheelMesh])

  useEffect(() => {
    targetPosition.current.set(...pose.position)
    targetHeading.current = pose.heading
  }, [pose.heading, pose.position])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const lerpFactor = 1 - Math.exp(-8 * delta)
    displayPosition.current.lerp(targetPosition.current, lerpFactor)

    const diff = Math.atan2(Math.sin(targetHeading.current - displayHeading.current), Math.cos(targetHeading.current - displayHeading.current))
    const effectiveDiff = Math.abs(diff) < headingDeadband ? 0 : diff
    const headingStep = effectiveDiff * (1 - Math.exp(-10 * delta))
    displayHeading.current += headingStep

    group.position.copy(displayPosition.current)
    group.rotation.y = displayHeading.current
  })

  return (
    <group ref={groupRef} position={pose.position} rotation={[0, pose.heading, 0]}>
      <mesh geometry={bodyGeometry} material={ghostMaterial} />
      <mesh geometry={mastGeometry} position={[0, 0.7, -1]} material={ghostMaterial} />
      <mesh geometry={headGeometry} position={[0, 1.15, -1.1]} material={ghostMaterial} />
      <primitive object={wheelMesh} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={baseGeometry} position={[0, -0.4, 0]} material={ghostMaterial} />
    </group>
  )
})

export default Ghost

