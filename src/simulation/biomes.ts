export type BiomeId = 'mars' | 'icy' | 'dunes'

export interface Biome {
  id: BiomeId
  name: string
  seed: number
  terrainColor: string
  rockColor: string
  skyColor: string
  fogColor: string
  fogRange: [number, number]
  heightParams: {
    ridgeFreq: number
    ridgeAmp: number
    duneFreq: number
    duneAmp: number
    noiseFreq: number
    noiseAmp: number
  }
}

export const biomes: Record<BiomeId, Biome> = {
  mars: {
    id: 'mars',
    name: 'Mars Plateau',
    seed: 42,
    terrainColor: '#b86b2f',
    rockColor: '#7a4f2c',
    skyColor: '#080f1f',
    fogColor: '#0b1224',
    fogRange: [30, 140],
    heightParams: {
      ridgeFreq: 0.08,
      ridgeAmp: 2.4,
      duneFreq: 0.15,
      duneAmp: 1.4,
      noiseFreq: 0.35,
      noiseAmp: 0.6,
    },
  },
  icy: {
    id: 'icy',
    name: 'Icy Plain',
    seed: 1337,
    terrainColor: '#7ca3c7',
    rockColor: '#9db4d5',
    skyColor: '#0a1220',
    fogColor: '#0d1726',
    fogRange: [20, 110],
    heightParams: {
      ridgeFreq: 0.06,
      ridgeAmp: 1.6,
      duneFreq: 0.09,
      duneAmp: 0.9,
      noiseFreq: 0.25,
      noiseAmp: 0.4,
    },
  },
  dunes: {
    id: 'dunes',
    name: 'Windy Dunes',
    seed: 31415,
    terrainColor: '#c89b5e',
    rockColor: '#a6743a',
    skyColor: '#0c0e1b',
    fogColor: '#0f1422',
    fogRange: [25, 130],
    heightParams: {
      ridgeFreq: 0.04,
      ridgeAmp: 1.8,
      duneFreq: 0.2,
      duneAmp: 1.8,
      noiseFreq: 0.3,
      noiseAmp: 0.6,
    },
  },
}

export const defaultBiomeId: BiomeId = 'mars'

