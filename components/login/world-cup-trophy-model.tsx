'use client'

import { Center, useTexture } from '@react-three/drei'
import { useLoader } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { Mesh, MeshStandardMaterial, SRGBColorSpace, type Texture } from 'three'
import {
  WORLD_CUP_TROPHY_OBJ_PATH,
  WORLD_CUP_TROPHY_TEXTURE_LQ_BASE,
} from '@/lib/login-assets'

useLoader.preload(OBJLoader, WORLD_CUP_TROPHY_OBJ_PATH)

type TrophyMaterialName = 'Copa' | 'Base_1' | 'Base_2' | 'Letras'

interface TrophyMaterialProps {
  hovered?: boolean
  dragging?: boolean
}

function configureColorMap(texture: Texture) {
  texture.colorSpace = SRGBColorSpace
  texture.generateMipmaps = true
}

function buildMaterial(map: Texture, emissiveBoost: number) {
  configureColorMap(map)
  return new MeshStandardMaterial({
    map,
    metalness: 0.85,
    roughness: 0.38,
    envMapIntensity: 0.6,
    emissive: '#ff4d00',
    emissiveIntensity: emissiveBoost,
  })
}

export function WorldCupTrophyModel({ hovered = false, dragging = false }: TrophyMaterialProps) {
  const obj = useLoader(OBJLoader, WORLD_CUP_TROPHY_OBJ_PATH)
  const model = useMemo(() => obj.clone(true), [obj])
  const emissiveBoost = dragging ? 0.16 : hovered ? 0.09 : 0.03

  const copaMap = useTexture(`${WORLD_CUP_TROPHY_TEXTURE_LQ_BASE}/Copa_BaseColor.jpg`)
  const base1Map = useTexture(`${WORLD_CUP_TROPHY_TEXTURE_LQ_BASE}/Base_1_BaseColor.jpg`)
  const base2Map = useTexture(`${WORLD_CUP_TROPHY_TEXTURE_LQ_BASE}/Base_2_BaseColor.jpg`)
  const letrasMap = useTexture(`${WORLD_CUP_TROPHY_TEXTURE_LQ_BASE}/Letras_BaseColor.jpg`)

  const materials = useMemo(
    () =>
      ({
        Copa: buildMaterial(copaMap, emissiveBoost),
        Base_1: buildMaterial(base1Map, emissiveBoost * 0.65),
        Base_2: buildMaterial(base2Map, emissiveBoost * 0.65),
        Letras: buildMaterial(letrasMap, emissiveBoost * 0.8),
      }) satisfies Record<TrophyMaterialName, MeshStandardMaterial>,
    [base1Map, base2Map, copaMap, emissiveBoost, letrasMap],
  )

  useLayoutEffect(() => {
    model.traverse(child => {
      if (!(child instanceof Mesh)) return
      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material]
      child.material = sourceMaterials.map(src => {
        const name = src.name as TrophyMaterialName
        return materials[name] ?? materials.Copa
      })
    })
  }, [materials, model])

  return (
    <Center disableY>
      <primitive object={model} />
    </Center>
  )
}
