import { useMemo } from 'react'
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
  ROCK_COUNT_FAR,
  ROCK_COUNT_NEAR,
  ROCK_RADIUS_RANGE,
  TERRAIN_SEGMENTS,
  TERRAIN_SIZE,
} from '../../constants/scene'
import { createSeededRng } from '../../simulation/random'
import { generateHeight } from '../../simulation/terrain'
import type { Biome } from '../../simulation/biomes'

const terrainCache = new Map<string, { geometry: PlaneGeometry; material: MeshStandardMaterial }>()
const rockCache = new Map<
  string,
  {
    near: { mesh: InstancedMesh; list: { position: Vector3; radius: number }[] }
    far: { mesh: InstancedMesh; list: { position: Vector3; radius: number }[] }
    material: MeshStandardMaterial
  }
>()

interface TerrainProps {
  biome: Biome
  onRocksReady?: (rocks: { position: Vector3; radius: number }[]) => void
}

const Terrain = ({ biome, onRocksReady }: TerrainProps) => {
  const geometry = useMemo(() => {
    const cached = terrainCache.get(biome.id)
    if (cached) return cached.geometry
    const plane = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    plane.rotateX(-Math.PI / 2)
    terrainCache.set(biome.id, { geometry: plane, material: new MeshStandardMaterial() })
    return plane
  }, [biome.id])

  const terrainMaterial = useMemo(() => {
    const cached = terrainCache.get(biome.id)?.material
    if (cached) {
      cached.color = new Color(biome.terrainColor)
      return cached
    }

    const material = new MeshStandardMaterial({
      color: new Color(biome.terrainColor),
      roughness: 0.95,
      metalness: 0.05,
    })

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uRidgeFreq = { value: biome.heightParams.ridgeFreq }
      shader.uniforms.uRidgeAmp = { value: biome.heightParams.ridgeAmp }
      shader.uniforms.uDuneFreq = { value: biome.heightParams.duneFreq }
      shader.uniforms.uDuneAmp = { value: biome.heightParams.duneAmp }
      shader.uniforms.uNoiseFreq = { value: biome.heightParams.noiseFreq }
      shader.uniforms.uNoiseAmp = { value: biome.heightParams.noiseAmp }

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform float uRidgeFreq;
        uniform float uRidgeAmp;
        uniform float uDuneFreq;
        uniform float uDuneAmp;
        uniform float uNoiseFreq;
        uniform float uNoiseAmp;

        float getHeight(vec2 p) {
          float ridge = sin(p.x * uRidgeFreq) * cos(p.y * uRidgeFreq * 0.625) * uRidgeAmp;
          float dunes = sin((p.x + p.y) * uDuneFreq) * uDuneAmp;
          float noise = sin(p.x * uNoiseFreq + p.y * uNoiseFreq * 0.63) * uNoiseAmp;
          return ridge + dunes + noise;
        }
        `,
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float h = getHeight(transformed.xz);
         transformed.y += h;
        `,
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `float centerH = getHeight(transformed.xz);
         float dHx = getHeight(transformed.xz + vec2(0.05, 0.0)) - centerH;
         float dHz = getHeight(transformed.xz + vec2(0.0, 0.05)) - centerH;
         vec3 displacedNormal = normalize(cross(vec3(0.0, dHz, 0.05), vec3(0.05, dHx, 0.0)));
         vec3 objectNormal = displacedNormal;
         vec3 transformedNormal = objectNormal;
        `,
      )
    }

    terrainCache.set(biome.id, { geometry, material })
    return material
  }, [biome, geometry])

  const { rocksNear, rocksFar } = useMemo(() => {
    const cached = rockCache.get(biome.id)
    if (cached) {
      cached.material.color.set(biome.rockColor)
      if (onRocksReady) onRocksReady([...cached.near.list, ...cached.far.list])
      return { rocksNear: cached.near, rocksFar: cached.far }
    }

    const rng = createSeededRng(biome.seed)
    const material = new MeshStandardMaterial({
      color: new Color(biome.rockColor),
      roughness: 0.95,
      metalness: 0.05,
    })

    const buildRocks = (count: number, detail: number) => {
      const geo = new IcosahedronGeometry(1, detail)
      const instanced = new InstancedMesh(geo, material, count)
      const tempMatrix = new Matrix4()
      const tempQuaternion = new Quaternion()
      const list: { position: Vector3; radius: number }[] = []

      for (let i = 0; i < count; i += 1) {
        const radius = ROCK_RADIUS_RANGE[0] + rng() * (ROCK_RADIUS_RANGE[1] - ROCK_RADIUS_RANGE[0])
        const spread = TERRAIN_SIZE * 0.95
        const position = new Vector3(
          (rng() - 0.5) * spread,
          0,
          (rng() - 0.5) * spread,
        )
        position.y = generateHeight(position.x, position.z, biome) + radius * 0.4
        list.push({ position: position.clone(), radius })

        tempQuaternion.setFromEuler(new Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI))
        tempMatrix.compose(position, tempQuaternion, new Vector3(radius, radius, radius))
        instanced.setMatrixAt(i, tempMatrix)
      }
      instanced.instanceMatrix.needsUpdate = true
      instanced.castShadow = true
      instanced.receiveShadow = true
      return { mesh: instanced, list, geo }
    }

    const near = buildRocks(ROCK_COUNT_NEAR, 1)
    const far = buildRocks(ROCK_COUNT_FAR, 0)
    const combined = [...near.list, ...far.list]
    rockCache.set(biome.id, { near, far, material })
    if (onRocksReady) onRocksReady(combined)

    return { rocksNear: near, rocksFar: far }
  }, [biome, onRocksReady])

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow material={terrainMaterial} />
      <primitive object={rocksFar.mesh} castShadow receiveShadow />
      <primitive object={rocksNear.mesh} castShadow receiveShadow />
    </group>
  )
}

export default Terrain
