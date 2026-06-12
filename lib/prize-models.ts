import type { PrizeId } from '@/lib/prizes'

export interface PrizeModelConfig {
  path: string
  logoPath: string
  logoAspect: number
  logoPosition: [number, number, number]
  logoWidth: number
  logoDepth?: number
  /** Extra Z rotation (radians) after Decal auto-orientation */
  logoRotation?: number
  /** Mirror logo horizontally — fixes reversed text on some meshes */
  logoFlipU?: boolean
  /** Flip texture vertically — SVG Y axis is inverted in WebGL */
  logoFlipV?: boolean
  cameraZ: number
  shadowY: number
  shadowScale: number
}

export const PRIZE_MODELS: Record<PrizeId, PrizeModelConfig> = {
  hoodie: {
    path: '/models/hoddie.glb',
    logoPath: '/logo-b.svg',
    logoAspect: 1,
    logoPosition: [0.11, 0.20, 0.14],
    logoWidth: 0.16,
    logoFlipV: true,
    cameraZ: 2.35,
    shadowY: -0.52,
    shadowScale: 2.4,
  },
  cap: {
    path: '/models/bottle.glb',
    logoPath: '/logo-b.svg',
    logoAspect: 1,
    logoPosition: [0, 0.07, 0.15],
    logoWidth: 0.085,
    logoFlipV: true,
    cameraZ: 1.55,
    shadowY: -0.38,
    shadowScale: 1.4,
  },
  tee: {
    path: '/models/remera-2.glb',
    logoPath: '/logo.svg',
    logoAspect: 960 / 320,
    logoPosition: [0.13, 0.25, 0.15],
    logoWidth: 0.18,
    logoDepth: 0.22,
    logoFlipV: true,
    cameraZ: 2.35,
    shadowY: -0.52,
    shadowScale: 2.4,
  },
}

export const PRIZE_MODEL_PATHS = Object.values(PRIZE_MODELS).map(config => config.path)
