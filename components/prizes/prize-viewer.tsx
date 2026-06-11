'use client'

import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import type { PrizeItem } from '@/lib/prizes'
import { useIsMobile } from '@/lib/use-mobile'
import { PrizeScene } from './prize-scene'

interface PrizeViewerProps {
  prize: PrizeItem
  className?: string
}

function PrizeFallback() {
  return (
    <div className="prize-viewer-fallback" aria-hidden>
      <div className="prize-viewer-fallback-shimmer" />
    </div>
  )
}

export function PrizeViewer({ prize, className }: PrizeViewerProps) {
  const isMobile = useIsMobile()
  const [dpr, setDpr] = useState(1.5)
  const [animate, setAnimate] = useState(true)
  const [interactive, setInteractive] = useState(false)

  useEffect(() => {
    setDpr(isMobile ? 1.25 : 1.75)
    setInteractive(!isMobile)
  }, [isMobile])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAnimate(!media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <div className={className ?? 'prize-viewer'}>
      <Suspense fallback={<PrizeFallback />}>
        <Canvas
          className="prize-viewer-canvas"
          camera={{ position: [0, 0, 4.2], fov: 32, near: 0.1, far: 20 }}
          dpr={[1, dpr]}
          frameloop="demand"
          gl={{
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'high-performance',
          }}
          style={{ touchAction: interactive ? 'none' : 'pan-y' }}
        >
          <PerformanceMonitor
            bounds={() => [30, 58]}
            onIncline={() => setDpr(isMobile ? 1.35 : 2)}
            onDecline={() => setDpr(1)}
            flipflops={3}
            onFallback={() => setDpr(1)}
          />
          <color attach="background" args={['#000000']} />
          <Environment preset="city" environmentIntensity={0.35} />
          <PrizeScene
            prize={prize}
            interactive={interactive}
            animate={animate}
            aspect={prize.id === 'cap' ? 0.95 : prize.id === 'hoodie' ? 0.78 : 0.82}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
