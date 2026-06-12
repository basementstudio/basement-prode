'use client'

import dynamic from 'next/dynamic'
import { LoginParticles } from './login-particles'

const LoginBallCanvas = dynamic(
  () => import('./login-ball-canvas').then(m => m.LoginBallCanvas),
  { ssr: false },
)

export function LoginAmbience() {
  return (
    <div className="login-ambience" aria-hidden>
      <div className="login-ambience-glow" />
      <div className="login-ambience-shimmer" />
      <LoginParticles />
      <LoginBallCanvas />
      <div className="login-ambience-vignette" />
    </div>
  )
}
