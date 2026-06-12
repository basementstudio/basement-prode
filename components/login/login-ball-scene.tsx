'use client'

import { useEffect, useState } from 'react'
import { InteractiveTriondaBall } from './interactive-trionda-ball'
import { InteractiveWorldCupTrophy } from './interactive-world-cup-trophy'

interface LoginBallSceneContentProps {
  animate: boolean
  isMobile: boolean
}

const BALL_POSITION_DESKTOP: [number, number, number] = [-2.8, -0.2, 0]
const TROPHY_POSITION_DESKTOP: [number, number, number] = [2.8, 0.1, 0.15]
const BALL_POSITION_MOBILE: [number, number, number] = [-2.2, -0.1, 0]
const TROPHY_POSITION_MOBILE: [number, number, number] = [2.2, 0.2, 0.1]

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.95} />
      <hemisphereLight args={['#ffffff', '#1a1a1a', 0.55]} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-5, 2, 4]} intensity={0.55} color="#ffd6c2" />
      <pointLight position={[0, 0, 4]} intensity={0.35} color="#ff4d00" distance={12} />
    </>
  )
}

function LoginBallSceneContent({ animate, isMobile }: LoginBallSceneContentProps) {
  const ballPosition = isMobile ? BALL_POSITION_MOBILE : BALL_POSITION_DESKTOP
  const trophyPosition = isMobile ? TROPHY_POSITION_MOBILE : TROPHY_POSITION_DESKTOP

  return (
    <>
      <SceneLights />
      <InteractiveTriondaBall position={ballPosition} animate={animate} />
      <InteractiveWorldCupTrophy position={trophyPosition} animate={animate} />
    </>
  )
}

interface LoginBallSceneInnerProps {
  isMobile: boolean
}

export function LoginBallSceneInner({ isMobile }: LoginBallSceneInnerProps) {
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAnimate(!media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return <LoginBallSceneContent animate={animate} isMobile={isMobile} />
}
