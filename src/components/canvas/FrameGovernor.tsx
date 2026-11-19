import React, { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export interface FrameGovernorProps {
  targetFps?: number | null // null = uncapped native refresh rate
  isSleeping?: boolean
}

/**
 * Regulates the WebGL render rate inside React Three Fiber.
 * When targetFps is specified (e.g. 60 FPS), drives renders on demand
 * to prevent 120Hz/144Hz high-refresh displays from overworking the GPU.
 */
export const FrameGovernor: React.FC<FrameGovernorProps> = ({
  targetFps = 60,
  isSleeping = false,
}) => {
  const { invalidate } = useThree()

  useEffect(() => {
    if (isSleeping || targetFps === null || targetFps <= 0) return

    let handle: number
    let lastRenderTime = performance.now()
    const frameInterval = 1000 / targetFps

    const tick = (now: number) => {
      handle = requestAnimationFrame(tick)
      const delta = now - lastRenderTime
      if (delta >= frameInterval - 1) {
        lastRenderTime = now - (delta % frameInterval)
        invalidate()
      }
    }

    handle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(handle)
  }, [targetFps, isSleeping, invalidate])

  return null
}
