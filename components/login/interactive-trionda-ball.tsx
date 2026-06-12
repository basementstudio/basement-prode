'use client'

import { TRIONDA_BALL_SCALE } from '@/lib/login-assets'
import { InteractiveSceneProp } from './interactive-scene-prop'
import { TriondaBallModel } from './trionda-ball-model'

interface InteractiveTriondaBallProps {
  position: [number, number, number]
  scale?: number
  animate?: boolean
}

export function InteractiveTriondaBall({
  position,
  scale = TRIONDA_BALL_SCALE,
  animate = true,
}: InteractiveTriondaBallProps) {
  return (
    <InteractiveSceneProp
      position={position}
      scale={scale}
      animate={animate}
      hitGeometry={<sphereGeometry args={[1.75, 24, 24]} />}
    >
      {({ hovered, dragging }) => (
        <TriondaBallModel hovered={hovered} dragging={dragging} />
      )}
    </InteractiveSceneProp>
  )
}
