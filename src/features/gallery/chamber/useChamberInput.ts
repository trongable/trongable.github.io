import type React from 'react'
import { useRef, useEffect } from 'react'
import { computeFovMetrics } from '@/features/gallery/data/galleryData'
import type { GalleryChamberParams } from '@/features/gallery/data/galleryTunerConfig'

interface UseChamberInputOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  isDimmed: boolean
  params: GalleryChamberParams
  onClearHover: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * Coordinates pointer drag/fling inertia, non-passive trackpad/wheel panning,
 * and keyboard WASD/Arrow navigation for `CerebroChamber`.
 */
export function useChamberInput({
  containerRef,
  isDimmed,
  params,
  onClearHover,
}: UseChamberInputOptions) {
  const isDraggingRef = useRef(false)
  const isPointerDownRef = useRef(false)
  const startPointerPos = useRef({ x: 0, y: 0 })
  const lastPointerPos = useRef({ x: 0, y: 0 })
  const dragDeltaRef = useRef({ x: 0, y: 0 })
  const wheelDeltaRef = useRef({ x: 0, y: 0 })
  const releaseVelocityRef = useRef({ vx: 0, vy: 0 })
  const lastMoveTimeRef = useRef(0)
  const pointerVelocityRef = useRef({ vx: 0, vy: 0 })
  const activeKeysRef = useRef({ left: false, right: false, up: false, down: false })

  const isDimmedRef = useRef(isDimmed)
  const paramsRef = useRef(params)
  const onClearHoverRef = useRef(onClearHover)
  isDimmedRef.current = isDimmed
  paramsRef.current = params
  onClearHoverRef.current = onClearHover

  // Clear held keyboard spin keys whenever overlay dims the chamber
  useEffect(() => {
    if (isDimmed) {
      activeKeysRef.current.left = false
      activeKeysRef.current.right = false
      activeKeysRef.current.up = false
      activeKeysRef.current.down = false
    }
  }, [isDimmed])

  // Window-level pointer move/up/cancel + keyboard Arrow/WASD spin & pitch
  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return

      const totalDist = Math.hypot(
        e.clientX - startPointerPos.current.x,
        e.clientY - startPointerPos.current.y
      )

      // 4px threshold separates intentional pans from stationary clicks
      if (totalDist > 4 && !isDraggingRef.current) {
        isDraggingRef.current = true
        onClearHoverRef.current()
      }

      if (!isDraggingRef.current) return

      const now = performance.now()
      const dt = Math.max((now - lastMoveTimeRef.current) / 1000, 0.008)
      lastMoveTimeRef.current = now

      const dx = e.clientX - lastPointerPos.current.x
      const dy = e.clientY - lastPointerPos.current.y

      const w = window.innerWidth || 1280
      const h = window.innerHeight || 800
      const { fovY, horizontalFov } = computeFovMetrics(w, h)

      const activeParams = paramsRef.current
      const sensitivity = activeParams.panSensitivity * activeParams.dragMultiplier
      const deltaYaw = -(dx / w) * horizontalFov * sensitivity
      const deltaPitch = (dy / h) * fovY * sensitivity

      dragDeltaRef.current.x += deltaYaw
      dragDeltaRef.current.y += deltaPitch

      const instVx = deltaYaw / dt
      const instVy = deltaPitch / dt
      pointerVelocityRef.current.vx = pointerVelocityRef.current.vx * 0.35 + instVx * 0.65
      pointerVelocityRef.current.vy = pointerVelocityRef.current.vy * 0.35 + instVy * 0.65

      lastPointerPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleWindowPointerUp = () => {
      if (!isPointerDownRef.current) return
      if (isDraggingRef.current) {
        const now = performance.now()
        const activeParams = paramsRef.current
        // Commit fling velocity if lifted within 80ms of motion
        if (now - lastMoveTimeRef.current < 80 && activeParams.flingInertia > 0) {
          releaseVelocityRef.current = {
            vx: pointerVelocityRef.current.vx * activeParams.flingInertia,
            vy: pointerVelocityRef.current.vy * activeParams.flingInertia,
          }
        } else {
          releaseVelocityRef.current = { vx: 0, vy: 0 }
        }
      }
      pointerVelocityRef.current = { vx: 0, vy: 0 }
      isPointerDownRef.current = false
      isDraggingRef.current = false
    }

    const setDirectionKey = (key: string, pressed: boolean, e?: KeyboardEvent) => {
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (pressed) e?.preventDefault()
        activeKeysRef.current.left = pressed
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (pressed) e?.preventDefault()
        activeKeysRef.current.right = pressed
      } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        if (pressed) e?.preventDefault()
        activeKeysRef.current.up = pressed
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        if (pressed) e?.preventDefault()
        activeKeysRef.current.down = pressed
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDimmedRef.current || e.metaKey || e.ctrlKey || e.altKey || isEditableTarget(e.target)) {
        return
      }
      setDirectionKey(e.key, true, e)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setDirectionKey(e.key, false)
    }

    const handleWindowBlur = () => {
      activeKeysRef.current.left = false
      activeKeysRef.current.right = false
      activeKeysRef.current.up = false
      activeKeysRef.current.down = false
      handleWindowPointerUp()
    }

    window.addEventListener('pointermove', handleWindowPointerMove)
    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
      window.removeEventListener('pointercancel', handleWindowPointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [])

  // Non-passive native wheel listener consumes 2-finger trackpad swipes so Chrome never triggers Back/Forward nav
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleNativeWheel = (e: WheelEvent) => {
      if (isDimmedRef.current) return
      e.preventDefault()

      const w = window.innerWidth || 1280
      const h = window.innerHeight || 800
      const { fovY, horizontalFov } = computeFovMetrics(w, h)

      // Normalize deltaMode: 0 = pixels, 1 = lines (~16px), 2 = pages (~h px)
      const deltaModeMult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? h : 1
      const dx = e.deltaX * deltaModeMult
      const dy = e.deltaY * deltaModeMult

      const activeParams = paramsRef.current
      wheelDeltaRef.current.x += (dx / w) * horizontalFov * activeParams.panSensitivity
      wheelDeltaRef.current.y += -(dy / h) * fovY * activeParams.panSensitivity
    }

    container.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleNativeWheel)
  }, [containerRef])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    isPointerDownRef.current = true
    isDraggingRef.current = false
    startPointerPos.current = { x: e.clientX, y: e.clientY }
    lastPointerPos.current = { x: e.clientX, y: e.clientY }
    lastMoveTimeRef.current = performance.now()
    pointerVelocityRef.current = { vx: 0, vy: 0 }
    releaseVelocityRef.current = { vx: 0, vy: 0 }
  }

  return {
    isDraggingRef,
    dragDeltaRef,
    releaseVelocityRef,
    wheelDeltaRef,
    activeKeysRef,
    handlePointerDown,
  }
}
