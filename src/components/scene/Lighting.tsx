import type { Biome } from '../../simulation/biomes'

interface LightingProps {
  biome: Biome
}

const Lighting = ({ biome }: LightingProps) => {
  return (
    <>
      <hemisphereLight intensity={0.35} groundColor="#2b1b0f" />
      <directionalLight
        castShadow
        position={[25, 30, 12]}
        intensity={1.4}
        color="#ffd9a5"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
      />
      <ambientLight intensity={0.25} color={biome.fogColor} />
    </>
  )
}

export default Lighting

