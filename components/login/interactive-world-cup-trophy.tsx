'use client'

import { WORLD_CUP_TROPHY_SCALE } from '@/lib/login-assets'
import { InteractiveSceneProp } from './interactive-scene-prop'
import { WorldCupTrophyModel } from './world-cup-trophy-model'

interface InteractiveWorldCupTrophyProps {
  position: [number, number, number]
  scale?: number
  animate?: boolean
}

export function InteractiveWorldCupTrophy({
  position,
  scale = WORLD_CUP_TROPHY_SCALE,
  animate = true,
}: InteractiveWorldCupTrophyProps) {
  return (
    <InteractiveSceneProp
      position={position}
      scale={scale}
      animate={animate}
      hitGeometry={<boxGeometry args={[1.15, 2.55, 1.15]} />}
    >
      {({ hovered, dragging }) => (
        <group position={[0, -1.24, 0]}>
          <WorldCupTrophyModel hovered={hovered} dragging={dragging} />
        </group>
      )}
    </InteractiveSceneProp>
  )
}
