'use client'

import { LoginParticles } from './login-particles'

export function LoginAmbience() {
  return (
    <div className="login-ambience" aria-hidden>
      <div className="login-ambience-glow" />
      <div className="login-ambience-shimmer" />
      <LoginParticles />
      <div className="login-ambience-vignette" />
    </div>
  )
}
