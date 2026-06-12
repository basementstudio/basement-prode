'use client'

import { Center, useGLTF } from '@react-three/drei'
import { useLayoutEffect, useMemo } from 'react'
import { TRIONDA_BALL_PATH } from '@/lib/login-assets'
import { Mesh, MeshStandardMaterial } from 'three'

useGLTF.preload(TRIONDA_BALL_PATH)

interface TriondaBallModelProps {
  hovered?: boolean
  dragging?: boolean
}

function tuneMaterial(mat: MeshStandardMaterial, emissiveBoost: number) {
  mat.metalness = 0.08
  mat.roughness = 0.42
  mat.color.set('#f2f2f2')
  mat.envMapIntensity = 0.9
  mat.emissive.set('#ff4d00')
  mat.emissiveIntensity = emissiveBoost
  mat.needsUpdate = true
}

export function TriondaBallModel({ hovered = false, dragging = false }: TriondaBallModelProps) {
  const { scene } = useGLTF(TRIONDA_BALL_PATH)
  const model = useMemo(() => scene.clone(true), [scene])
  const emissiveBoost = dragging ? 0.22 : hovered ? 0.12 : 0.04

  useLayoutEffect(() => {
    model.traverse(child => {
      if (!(child instanceof Mesh)) return
      child.castShadow = true
      child.receiveShadow = true
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const src of materials) {
        const mat = src as MeshStandardMaterial
        tuneMaterial(mat, emissiveBoost)
      }
    })
  }, [model, emissiveBoost])

  return (
    <Center>
      <primitive object={model} />
    </Center>
  )
}
