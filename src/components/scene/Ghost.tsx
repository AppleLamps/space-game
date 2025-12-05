import { memo, useEffect, useMemo } from 'react'
import { BoxGeometry, CylinderGeometry, InstancedMesh, Matrix4, MeshStandardMaterial } from 'three'
import type { RoverPose } from '../../types/rover'

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

const Ghost = memo(function Ghost({ pose }: GhostProps) {
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

  return (
    <group position={pose.position} rotation={[0, pose.heading, 0]}>
      <mesh geometry={bodyGeometry} material={ghostMaterial} />
      <mesh geometry={mastGeometry} position={[0, 0.7, -1]} material={ghostMaterial} />
      <mesh geometry={headGeometry} position={[0, 1.15, -1.1]} material={ghostMaterial} />
      <primitive object={wheelMesh} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={baseGeometry} position={[0, -0.4, 0]} material={ghostMaterial} />
    </group>
  )
})

export default Ghost

