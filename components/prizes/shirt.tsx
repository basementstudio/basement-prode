'use client'

import { useGLTF, useTexture, Decal } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { BufferGeometry, Mesh, MeshStandardMaterial } from 'three'

useGLTF.preload('/models/remera.glb')

export function Shirt() {
  const { nodes } = useGLTF('/models/remera.glb')
  const logo = useTexture('/logo.png')
  const meshRef = useRef<Mesh>(null)
  const [decalReady, setDecalReady] = useState(false)
  const shirt = nodes.geometry_0 as Mesh

  const geometry = useMemo(() => {
    if (!shirt?.geometry) return null
    const geo = shirt.geometry.clone() as BufferGeometry
    geo.computeVertexNormals()
    return geo
  }, [shirt?.geometry])

  const material = useMemo(() => {
    if (!shirt?.material) return null
    const src = Array.isArray(shirt.material) ? shirt.material[0] : shirt.material
    const mat = (src as MeshStandardMaterial).clone()
    mat.color.set('#0a0a0a')
    mat.roughness = 0.92
    mat.metalness = 0
    mat.envMapIntensity = 0.25
    return mat
  }, [shirt?.material])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh?.geometry.attributes.position || !mesh.geometry.attributes.normal) return
    setDecalReady(true)
  }, [geometry])

  if (!geometry || !material) return null

  return (
    <mesh ref={meshRef} geometry={geometry} material={material}>
      {decalReady && (
        <Decal
          position={[-0.13, 0.16, 0.15]}
          rotation={[0, 0, 0]}
          scale={[0.17, 0.13, 0.17]}
          map={logo}
          depthTest
          polygonOffsetFactor={-4}
        />
      )}
    </mesh>
  )
}
