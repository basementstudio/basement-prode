'use client'

import { Float, PresentationControls, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PrizeItem } from '@/lib/prizes'
import './prize-shader-material'

interface PrizeSceneProps {
  prize: PrizeItem
  interactive: boolean
  animate: boolean
  aspect: number
}

function PrizeMesh({
  prize,
  animate,
  aspect,
}: {
  prize: PrizeItem
  animate: boolean
  aspect: number
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const texture = useTexture(prize.image)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
  }, [texture])

  useFrame((state, delta) => {
    if (!materialRef.current) return
    if (animate) {
      materialRef.current.uniforms.uTime.value += delta
    }
    state.invalidate()
  })

  const height = 2.4
  const width = height * aspect

  return (
    <mesh>
      <planeGeometry args={[width, height, 32, 32]} />
      <prizeShaderMaterial
        ref={materialRef}
        uTexture={texture}
        uAccent={new THREE.Color(prize.accent)}
        uRimIntensity={0.45}
        uBend={prize.id === 'cap' ? 0.18 : 0.1}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-5, 2, -3]} intensity={0.35} color="#8888ff" />
      <pointLight position={[0, -1, 2]} intensity={0.25} color={new THREE.Color('#ff4d00')} />
    </>
  )
}

export function PrizeScene({ prize, interactive, animate, aspect }: PrizeSceneProps) {
  const { invalidate } = useThree()

  useEffect(() => {
    invalidate()
  }, [invalidate, prize.id])

  const content = (
    <group>
      <SceneLights />
      <PrizeMesh prize={prize} animate={animate} aspect={aspect} />
    </group>
  )

  if (!interactive) {
    return (
      <Float
        speed={animate ? 1.2 : 0}
        rotationIntensity={animate ? 0.15 : 0}
        floatIntensity={animate ? 0.35 : 0}
        floatingRange={animate ? [-0.06, 0.06] : [0, 0]}
        autoInvalidate
      >
        {content}
      </Float>
    )
  }

  return (
    <PresentationControls
      global={false}
      cursor
      snap
      speed={1.5}
      zoom={0.9}
      polar={[Math.PI / 4, Math.PI / 1.8]}
      azimuth={[-Math.PI / 5, Math.PI / 5]}
      config={{ mass: 1, tension: 180, friction: 22 }}
    >
      <Float
        speed={animate ? 1.2 : 0}
        rotationIntensity={animate ? 0.12 : 0}
        floatIntensity={animate ? 0.3 : 0}
        floatingRange={animate ? [-0.05, 0.05] : [0, 0]}
        autoInvalidate
      >
        {content}
      </Float>
    </PresentationControls>
  )
}
