'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  kind: 'spark' | 'bokeh' | 'confetti'
  hue: 'white' | 'orange' | 'green'
}

function particleColor(p: Particle): string {
  if (p.hue === 'orange') return `rgba(255, 77, 0, ${p.alpha})`
  if (p.hue === 'green') return `rgba(80, 200, 120, ${p.alpha * 0.7})`
  return `rgba(235, 235, 235, ${p.alpha})`
}

export function LoginParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const context = el.getContext('2d')
    if (!context) return

    const canvas: HTMLCanvasElement = el
    const ctx: CanvasRenderingContext2D = context

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let frameId = 0
    let particles: Particle[] = []
    let visible = !document.hidden

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function seed() {
      const hues: Particle['hue'][] = ['white', 'orange', 'green']
      particles = Array.from({ length: reducedMotion ? 24 : 64 }, (_, i) => {
        const kind: Particle['kind'] =
          i % 9 === 0 ? 'bokeh' : i % 13 === 0 ? 'confetti' : 'spark'
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (reducedMotion ? 0 : 0.22),
          vy: (Math.random() - 0.5) * (reducedMotion ? 0 : 0.18) - 0.04,
          r: kind === 'bokeh' ? 2.5 + Math.random() * 2 : kind === 'confetti' ? 1.2 + Math.random() : 0.9 + Math.random() * 1.1,
          alpha: kind === 'bokeh' ? 0.35 + Math.random() * 0.25 : 0.18 + Math.random() * 0.22,
          kind,
          hue: hues[i % hues.length]!,
        }
      })
    }

    function tick() {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < -12) p.x = width + 12
          if (p.x > width + 12) p.x = -12
          if (p.y < -12) p.y = height + 12
          if (p.y > height + 12) p.y = -12
        }

        if (p.kind === 'bokeh') {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5)
          grad.addColorStop(0, particleColor(p))
          grad.addColorStop(0.4, particleColor({ ...p, alpha: p.alpha * 0.4 }))
          grad.addColorStop(1, 'rgba(255, 77, 0, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === 'confetti') {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.x * 0.01)
          ctx.fillStyle = particleColor(p)
          ctx.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8)
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = particleColor(p)
          ctx.fill()
        }
      }

      if (visible) frameId = requestAnimationFrame(tick)
    }

    const onVisibility = () => {
      visible = !document.hidden
      if (visible && !frameId) frameId = requestAnimationFrame(tick)
    }

    const onResize = () => {
      resize()
      seed()
    }

    resize()
    seed()
    frameId = requestAnimationFrame(tick)

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="login-ambience-particles" aria-hidden />
}
