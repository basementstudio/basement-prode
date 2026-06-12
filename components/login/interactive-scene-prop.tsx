'use client'

import { Float } from '@react-three/drei'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Group,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'
import { LOGIN_PROP_HOME_IDLE_SEC } from '@/lib/login-assets'

type InteractionMode = 'move' | 'rotate'

interface InteractiveScenePropProps {
  position: [number, number, number]
  scale?: number
  animate?: boolean
  hitGeometry: ReactNode
  children: (state: { hovered: boolean; dragging: boolean }) => ReactNode
}

function pointerFromEvent(
  clientX: number,
  clientY: number,
  domElement: HTMLCanvasElement,
  target: Vector2,
) {
  const rect = domElement.getBoundingClientRect()
  target.x = ((clientX - rect.left) / rect.width) * 2 - 1
  target.y = -((clientY - rect.top) / rect.height) * 2 + 1
}

export function InteractiveSceneProp({
  position: initialPosition,
  scale = 1,
  animate = true,
  hitGeometry,
  children,
}: InteractiveScenePropProps) {
  const rootRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const { camera, gl } = useThree()
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [awayFromHome, setAwayFromHome] = useState(false)
  const visualScale = useRef(scale)

  const draggingRef = useRef(false)
  const hoveredRef = useRef(false)
  const modeRef = useRef<InteractionMode>('move')
  const lastInteractionRef = useRef(performance.now())
  const homePosition = useMemo(() => new Vector3(...initialPosition), [initialPosition])
  const position = useRef(new Vector3(...initialPosition))
  const velocity = useRef(new Vector3())
  const spinVelocity = useRef(new Vector2())
  const dragPlane = useMemo(() => new Plane(), [])
  const intersection = useMemo(() => new Vector3(), [])
  const grabOffset = useMemo(() => new Vector3(), [])
  const raycaster = useMemo(() => new Raycaster(), [])
  const pointer = useMemo(() => new Vector2(), [])
  const planeNormal = useMemo(() => new Vector3(), [])

  function touchInteraction() {
    lastInteractionRef.current = performance.now()
  }

  useEffect(() => {
    hoveredRef.current = hovered
  }, [hovered])

  function syncDragPlane() {
    camera.getWorldDirection(planeNormal).negate()
    dragPlane.setFromNormalAndCoplanarPoint(planeNormal, position.current)
  }

  function moveToPointer(clientX: number, clientY: number) {
    if (!rootRef.current) return
    pointerFromEvent(clientX, clientY, gl.domElement, pointer)
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(dragPlane, intersection)) return
    position.current.copy(intersection).add(grabOffset)
    rootRef.current.position.copy(position.current)
  }

  function beginInteraction(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    if (e.button !== 0 && e.button !== 2) return

    touchInteraction()

    const rotate = e.button === 2 || e.shiftKey
    modeRef.current = rotate ? 'rotate' : 'move'
    draggingRef.current = true
    setDragging(true)
    gl.domElement.setPointerCapture(e.pointerId)
    gl.domElement.style.cursor = rotate ? 'crosshair' : 'grabbing'

    if (!rotate) {
      syncDragPlane()
      pointerFromEvent(e.clientX, e.clientY, gl.domElement, pointer)
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        grabOffset.copy(position.current).sub(intersection)
      } else {
        grabOffset.set(0, 0, 0)
      }
      velocity.current.set(0, 0, 0)
    }

    spinVelocity.current.set(0, 0)
  }

  function endInteraction() {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    touchInteraction()
    gl.domElement.style.cursor = hoveredRef.current ? 'grab' : ''
  }

  useEffect(() => {
    const dom = gl.domElement

    const preventContextMenu = (event: Event) => event.preventDefault()
    dom.addEventListener('contextmenu', preventContextMenu)

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current || !spinRef.current) return
      touchInteraction()

      if (modeRef.current === 'rotate') {
        spinRef.current.rotation.y += event.movementX * 0.02
        spinRef.current.rotation.x += event.movementY * 0.02
        spinVelocity.current.set(event.movementX * 0.03, event.movementY * 0.03)
        return
      }

      moveToPointer(event.clientX, event.clientY)
      spinRef.current.rotation.y += event.movementX * 0.016
      spinRef.current.rotation.x += event.movementY * 0.016
      velocity.current.set(event.movementX * 0.005, -event.movementY * 0.005, 0)
      spinVelocity.current.set(event.movementX * 0.028, event.movementY * 0.028)
    }

    const onPointerUp = () => endInteraction()

    const onWheel = (event: WheelEvent) => {
      if (!hoveredRef.current || !spinRef.current) return
      event.preventDefault()
      touchInteraction()
      spinRef.current.rotation.y += event.deltaY * 0.003
      spinRef.current.rotation.x += event.deltaX * 0.003
      spinVelocity.current.set(event.deltaX * 0.004, event.deltaY * 0.004)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    dom.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      dom.removeEventListener('contextmenu', preventContextMenu)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      dom.removeEventListener('wheel', onWheel)
    }
  }, [camera, dragPlane, gl, grabOffset, intersection, planeNormal, pointer, raycaster])

  useFrame((_, delta) => {
    if (!rootRef.current || !spinRef.current) return

    const targetScale = hovered || dragging ? scale * 1.08 : scale
    visualScale.current += (targetScale - visualScale.current) * Math.min(1, delta * 12)
    spinRef.current.scale.setScalar(visualScale.current)

    const distFromHome = position.current.distanceTo(homePosition)
    const rotOffset = Math.hypot(spinRef.current.rotation.x, spinRef.current.rotation.y)
    const isAtHome = distFromHome < 0.015 && rotOffset < 0.03

    if (isAtHome) {
      if (awayFromHome) setAwayFromHome(false)
    } else if (!awayFromHome && distFromHome > 0.05) {
      setAwayFromHome(true)
    }

    const idleMs = performance.now() - lastInteractionRef.current
    const shouldReturnHome =
      animate &&
      !draggingRef.current &&
      !hoveredRef.current &&
      idleMs > LOGIN_PROP_HOME_IDLE_SEC * 1000 &&
      !isAtHome

    if (shouldReturnHome) {
      velocity.current.set(0, 0, 0)
      spinVelocity.current.set(0, 0)

      const ease = 1 - Math.exp(-4.2 * delta)
      position.current.lerp(homePosition, ease)
      rootRef.current.position.copy(position.current)

      spinRef.current.rotation.x *= 1 - ease
      spinRef.current.rotation.y *= 1 - ease
      spinRef.current.rotation.z *= 1 - ease

      if (position.current.distanceTo(homePosition) < 0.012 && Math.hypot(
        spinRef.current.rotation.x,
        spinRef.current.rotation.y,
      ) < 0.025) {
        position.current.copy(homePosition)
        rootRef.current.position.copy(homePosition)
        spinRef.current.rotation.set(0, 0, 0)
      }
      return
    }

    if (draggingRef.current || !animate) return

    position.current.x += velocity.current.x * delta * 60
    position.current.y += velocity.current.y * delta * 60
    velocity.current.multiplyScalar(0.965)

    spinRef.current.rotation.y += spinVelocity.current.x * delta
    spinRef.current.rotation.x += spinVelocity.current.y * delta
    spinVelocity.current.multiplyScalar(0.94)

    if (velocity.current.lengthSq() < 0.0002) {
      spinRef.current.rotation.y += delta * 0.22
    }

    const bounds = { x: 4.2, y: 3.2 }
    if (position.current.x > bounds.x || position.current.x < -bounds.x) {
      position.current.x = Math.max(-bounds.x, Math.min(bounds.x, position.current.x))
      velocity.current.x *= -0.55
    }
    if (position.current.y > bounds.y || position.current.y < -bounds.y) {
      position.current.y = Math.max(-bounds.y, Math.min(bounds.y, position.current.y))
      velocity.current.y *= -0.55
    }

    rootRef.current.position.copy(position.current)
  })

  const floatEnabled = animate && !dragging && !hovered && !awayFromHome

  const pointerHandlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setHovered(true)
      gl.domElement.style.cursor = 'grab'
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setHovered(false)
      if (!draggingRef.current) gl.domElement.style.cursor = ''
    },
    onPointerDown: beginInteraction,
    onPointerUp: endInteraction,
    onPointerCancel: endInteraction,
  }

  return (
    <group ref={rootRef} position={initialPosition}>
      <Float
        speed={1.3}
        rotationIntensity={0.18}
        floatIntensity={0.3}
        enabled={floatEnabled}
      >
        <group ref={spinRef} scale={scale} {...pointerHandlers}>
          <mesh visible={false}>
            {hitGeometry}
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {children({ hovered, dragging })}
        </group>
      </Float>
    </group>
  )
}
