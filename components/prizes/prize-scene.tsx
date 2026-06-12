'use client'

import { Center, ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import type { PrizeItem } from '@/lib/prizes'
import { Shirt } from './shirt'

interface PrizeSceneProps {
  prize: PrizeItem
  animate: boolean
}

function SceneLights({ accent }: { accent: string }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight position={[0, 1.5, 4]} intensity={1.35} color="#f5f5f5" />
      <directionalLight position={[-3.5, 2, 2]} intensity={0.45} color="#c8d4ff" />
      <directionalLight position={[3, 1, 1.5]} intensity={0.3} color="#ffe8d6" />
      <directionalLight position={[0, 2.5, -3]} intensity={0.55} color="#ffffff" />
      <spotLight
        position={[0, 2.5, 3]}
        angle={0.45}
        penumbra={0.85}
        intensity={0.5}
        color={accent}
        distance={10}
      />
    </>
  )
}

export function PrizeScene({ prize, animate }: PrizeSceneProps) {
  const { invalidate, camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0.05, 2.35)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate])

  return (
    <>
      <SceneLights accent={prize.accent} />
      <Environment preset="studio" environmentIntensity={0.4} />

      <Center disableY>
        <Shirt />
      </Center>

      <ContactShadows
        position={[0, -0.52, 0]}
        opacity={0.45}
        scale={2.4}
        blur={2.5}
        far={1.4}
        color="#000000"
      />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={0.75}
        maxDistance={5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.35}
        autoRotate={animate}
        autoRotateSpeed={1.2}
        zoomSpeed={1.1}
        rotateSpeed={0.85}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}
