import { useEffect, useMemo } from 'react'
import {
  Color,
  Euler,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import {
  ROCK_COUNT,
  ROCK_RADIUS_RANGE,
  TERRAIN_SEGMENTS,
  TERRAIN_SIZE,
} from '../../constants/simulation'
import { createSeededRng } from '../../simulation/random'
import { generateHeight } from '../../simulation/terrain'
import type { Biome } from '../../simulation/biomes'

interface TerrainProps {
  biome: Biome
  onRocksReady?: (positions: Vector3[]) => void
}

const Terrain = ({ biome, onRocksReady }: TerrainProps) => {
  const geometry = useMemo(() => {
    const plane = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    const position = plane.attributes.position

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i)
      const y = position.getY(i)
      const z = generateHeight(x, y, biome)
      position.setZ(i, z)
    }

    position.needsUpdate = true
    plane.computeVertexNormals()
    plane.rotateX(-Math.PI / 2)
    return plane
  }, [])

  const { rockMesh, sharedMaterial } = useMemo(() => {
    const rng = createSeededRng(biome.seed)
    const material = new MeshStandardMaterial({
      color: new Color(biome.rockColor),
      roughness: 0.95,
      metalness: 0.05,
    })

    const instanced = new InstancedMesh(new IcosahedronGeometry(1, 1), material, ROCK_COUNT)
    const tempMatrix = new Matrix4()
    const tempQuaternion = new Quaternion()
    const rockPositions: Vector3[] = []

    for (let i = 0; i < ROCK_COUNT; i += 1) {
      const radius =
        ROCK_RADIUS_RANGE[0] + rng() * (ROCK_RADIUS_RANGE[1] - ROCK_RADIUS_RANGE[0])
      const position = new Vector3((rng() - 0.5) * 70, 0, (rng() - 0.5) * 70)
      position.y = generateHeight(position.x, position.z, biome) + radius * 0.4
      rockPositions.push(position.clone())

      tempQuaternion.setFromEuler(new Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI))
      tempMatrix.compose(position, tempQuaternion, new Vector3(radius, radius, radius))
      instanced.setMatrixAt(i, tempMatrix)
    }
    instanced.instanceMatrix.needsUpdate = true
    instanced.castShadow = true
    instanced.receiveShadow = true
    if (onRocksReady) {
      onRocksReady(rockPositions)
    }
    return { rockMesh: instanced, sharedMaterial: material }
  }, [biome, onRocksReady])

  useEffect(() => {
    return () => {
      geometry.dispose()
      sharedMaterial.dispose()
      rockMesh.geometry.dispose()
      rockMesh.dispose()
    }
  }, [geometry, rockMesh, sharedMaterial])

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color={biome.terrainColor}
          roughness={0.95}
          metalness={0.05}
          flatShading={false}
        />
      </mesh>
      <primitive object={rockMesh} castShadow receiveShadow />
    </group>
  )
}

export default Terrain
