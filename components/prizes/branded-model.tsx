'use client'

import { Decal, useGLTF, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { PRIZE_MODEL_PATHS, type PrizeModelConfig } from '@/lib/prize-models'
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type BufferGeometry,
  type Mesh,
  type MeshStandardMaterial,
} from 'three'

for (const path of PRIZE_MODEL_PATHS) {
  useGLTF.preload(path)
}

interface BrandedModelProps {
  config: PrizeModelConfig
}

export function BrandedModel({ config }: BrandedModelProps) {
  const { nodes } = useGLTF(config.path)
  const logo = useTexture(config.logoPath)
  const { gl } = useThree()
  const meshRef = useRef<Mesh>(null)
  const [decalReady, setDecalReady] = useState(false)
  const mesh = nodes.geometry_0 as Mesh

  const geometry = useMemo(() => {
    if (!mesh?.geometry) return null
    const geo = mesh.geometry.clone() as BufferGeometry
    geo.computeVertexNormals()
    return geo
  }, [mesh?.geometry])

  const material = useMemo(() => {
    if (!mesh?.material) return null
    const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const mat = (src as MeshStandardMaterial).clone()
    mat.color.set('#0a0a0a')
    mat.roughness = 0.92
    mat.metalness = 0
    mat.envMapIntensity = 0.25
    return mat
  }, [mesh?.material])

  useLayoutEffect(() => {
    logo.colorSpace = SRGBColorSpace
    logo.anisotropy = gl.capabilities.getMaxAnisotropy()
    logo.minFilter = LinearMipmapLinearFilter
    logo.magFilter = LinearFilter
    logo.generateMipmaps = true
    if (config.logoFlipU) {
      logo.wrapS = RepeatWrapping
      logo.repeat.x = -1
      logo.offset.x = 1
    }
    if (config.logoFlipV) {
      logo.wrapT = RepeatWrapping
      logo.repeat.y = -1
      logo.offset.y = 1
    }
    logo.needsUpdate = true
  }, [logo, gl, config.logoFlipU, config.logoFlipV])

  useLayoutEffect(() => {
    const parent = meshRef.current
    if (!parent?.geometry.attributes.position || !parent.geometry.attributes.normal) return
    setDecalReady(true)
  }, [geometry])

  if (!geometry || !material) return null

  const logoWidth = config.logoWidth
  const logoHeight = logoWidth / config.logoAspect
  const logoDepth = config.logoDepth ?? Math.max(logoWidth * 0.4, 0.12)
  const [logoX, logoY, logoZ] = config.logoPosition

  return (
    <mesh ref={meshRef} geometry={geometry} material={material}>
      {decalReady && (
        <Decal
          mesh={meshRef as RefObject<Mesh>}
          position={[logoX, logoY, logoZ]}
          {...(config.logoRotation !== undefined ? { rotation: config.logoRotation } : {})}
          scale={[logoWidth, logoHeight, logoDepth]}
          depthTest
          polygonOffsetFactor={-4}
        >
          <meshBasicMaterial
            map={logo}
            transparent
            toneMapped={false}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-4}
          />
        </Decal>
      )}
    </mesh>
  )
}
