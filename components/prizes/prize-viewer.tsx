'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Image from 'next/image'
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

  useEffect(() => {
    setDpr(isMobile ? 1.25 : 1.75)
  }, [isMobile])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAnimate(!media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  if (prize.id !== 'tee') {
    return (
      <div className={className ?? 'prize-viewer'}>
        <Image
          src={prize.image}
          alt={prize.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="prize-viewer-image"
        />
      </div>
    )
  }

  return (
    <div className={className ?? 'prize-viewer'}>
      <Suspense fallback={<PrizeFallback />}>
        <Canvas
          className="prize-viewer-canvas"
          camera={{ position: [0, 0.05, 2.35], fov: 38, near: 0.1, far: 20 }}
          dpr={[1, dpr]}
          frameloop="always"
          gl={{
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'high-performance',
          }}
          style={{ touchAction: 'none' }}
        >
          <PerformanceMonitor
            bounds={() => [30, 58]}
            onIncline={() => setDpr(isMobile ? 1.35 : 2)}
            onDecline={() => setDpr(1)}
            flipflops={3}
            onFallback={() => setDpr(1)}
          />
          <color attach="background" args={['#000000']} />
          <PrizeScene prize={prize} animate={animate} />
        </Canvas>
      </Suspense>
    </div>
  )
}
