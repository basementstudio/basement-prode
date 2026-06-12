'use client'

import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { useIsMobile } from '@/lib/use-mobile'
import { LoginBallSceneInner } from './login-ball-scene'

export function LoginBallCanvas() {
  const isMobile = useIsMobile()
  const [dpr, setDpr] = useState(isMobile ? 1.5 : 2)

  useEffect(() => {
    setDpr(isMobile ? 1.5 : 2)
  }, [isMobile])

  return (
    <Canvas
      className="login-ambience-balls"
      camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 30 }}
      dpr={[1, dpr]}
      gl={{
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
      }}
      frameloop="always"
      style={{ touchAction: 'none' }}
    >
      <PerformanceMonitor
        bounds={() => [30, 58]}
        onIncline={() => setDpr(isMobile ? 1.75 : 2.25)}
        onDecline={() => setDpr(isMobile ? 1.25 : 1.5)}
        flipflops={3}
        onFallback={() => setDpr(isMobile ? 1.25 : 1.5)}
      />
      <Suspense fallback={null}>
        <LoginBallSceneInner isMobile={isMobile} />
      </Suspense>
    </Canvas>
  )
}
