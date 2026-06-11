'use client'

import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

export const PrizeShaderMaterial = shaderMaterial(
  {
    uTexture: null as THREE.Texture | null,
    uTime: 0,
    uAccent: new THREE.Color('#ff4d00'),
    uRimIntensity: 0.4,
    uBend: 0.12,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform float uBend;

    void main() {
      vUv = uv;
      vec3 pos = position;

      float curve = (uv.x - 0.5) * (uv.x - 0.5);
      pos.z += curve * uBend;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  /* glsl */ `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec3 uAccent;
    uniform float uRimIntensity;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec4 tex = texture2D(uTexture, vUv);
      float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      float alpha = smoothstep(0.035, 0.11, lum);

      if (alpha < 0.01) discard;

      vec3 color = tex.rgb;

      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.2);
      color += uAccent * fresnel * uRimIntensity;

      float sweep = sin((vUv.x + vUv.y) * 6.0 - uTime * 0.6) * 0.5 + 0.5;
      color += vec3(1.0) * sweep * fresnel * 0.06;

      float glow = 0.04 + 0.02 * sin(uTime * 0.5);
      color += uAccent * glow * fresnel;

      gl_FragColor = vec4(color, alpha);
    }
  `,
)

extend({ PrizeShaderMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    prizeShaderMaterial: THREE.ShaderMaterial & {
      uTexture?: THREE.Texture | null
      uTime?: number
      uAccent?: THREE.Color
      uRimIntensity?: number
      uBend?: number
    }
  }
}
