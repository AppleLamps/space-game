import type { Biome } from './biomes'

export const generateHeight = (x: number, y: number, biome: Biome): number => {
  const { ridgeAmp, ridgeFreq, duneAmp, duneFreq, noiseAmp, noiseFreq } = biome.heightParams
  const ridge = Math.sin(x * ridgeFreq) * Math.cos(y * ridgeFreq * 0.625) * ridgeAmp
  const dunes = Math.sin((x + y) * duneFreq) * duneAmp
  const noise = Math.sin(x * noiseFreq + y * noiseFreq * 0.63) * noiseAmp
  return ridge + dunes + noise
}

export const terrainNormal = (x: number, y: number, biome: Biome): [number, number, number] => {
  // Approximate gradient via central differences
  const epsilon = 0.1
  const hL = generateHeight(x - epsilon, y, biome)
  const hR = generateHeight(x + epsilon, y, biome)
  const hD = generateHeight(x, y - epsilon, biome)
  const hU = generateHeight(x, y + epsilon, biome)
  const normalX = hL - hR
  const normalY = 2 * epsilon
  const normalZ = hD - hU
  const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ) || 1
  return [normalX / length, normalY / length, normalZ / length]
}

