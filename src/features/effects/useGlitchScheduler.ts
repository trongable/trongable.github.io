import { useState, useEffect, useRef, useCallback } from 'react'
import { isReducedMotionEnabled } from '@/utils/mediaQueries'

export interface UseGlitchSchedulerOptions {
  isDocumentVisible: boolean
  isAnimationPaused: boolean
  isThemeLocked: boolean
  randomizeTheme: () => void
}

/**
 * Schedules periodic GPU glitch bursts while respecting `prefers-reduced-motion`,
 * document visibility sleep state, and animation pause state.
 */
export function useGlitchScheduler({
  isDocumentVisible,
  isAnimationPaused,
  isThemeLocked,
  randomizeTheme,
}: UseGlitchSchedulerOptions) {
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchDuration, setGlitchDuration] = useState(360)
  const [glitchInterval, setGlitchInterval] = useState<number>(8)
  const [glitchImageRate, setGlitchImageRate] = useState<number>(1.0)

  const randomizeRef = useRef(randomizeTheme)
  randomizeRef.current = randomizeTheme
  const isThemeLockedRef = useRef(isThemeLocked)
  isThemeLockedRef.current = isThemeLocked
  const burstTimeoutRef = useRef<number | null>(null)

  const handleTriggerGlitchBurst = useCallback(() => {
    if (isAnimationPaused || !isDocumentVisible || isReducedMotionEnabled()) return
    if (burstTimeoutRef.current !== null) {
      window.clearTimeout(burstTimeoutRef.current)
      burstTimeoutRef.current = null
    }
    const burstDuration = 1200
    setGlitchDuration(burstDuration)
    setIsGlitching(true)
    burstTimeoutRef.current = window.setTimeout(() => {
      burstTimeoutRef.current = null
      setIsGlitching(false)
      if (!isThemeLockedRef.current) {
        randomizeRef.current()
      }
    }, burstDuration)
  }, [isAnimationPaused, isDocumentVisible])

  // Cancel active glitch and any pending manual burst if paused or hidden
  useEffect(() => {
    if (isAnimationPaused || !isDocumentVisible) {
      setIsGlitching(false)
      if (burstTimeoutRef.current !== null) {
        window.clearTimeout(burstTimeoutRef.current)
        burstTimeoutRef.current = null
      }
    }
  }, [isAnimationPaused, isDocumentVisible])

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current !== null) {
        window.clearTimeout(burstTimeoutRef.current)
        burstTimeoutRef.current = null
      }
    }
  }, [])

  // Periodic fullscreen GPU artifact glitch every `glitchInterval` seconds, lasting 400ms to 3,000ms
  useEffect(() => {
    if (isReducedMotionEnabled() || !isDocumentVisible || isAnimationPaused) return

    let timerId: number
    let resetId: number

    const triggerGlitch = () => {
      const baseMs = glitchInterval * 1000
      const nextInterval = baseMs * 0.65 + Math.random() * (baseMs * 0.70)
      timerId = window.setTimeout(() => {
        const burstDuration = 400 + Math.random() * 2600
        setGlitchDuration(burstDuration)
        setIsGlitching(true)
        resetId = window.setTimeout(() => {
          setIsGlitching(false)
          if (!isThemeLockedRef.current) {
            randomizeRef.current()
          }
          triggerGlitch()
        }, burstDuration)
      }, nextInterval)
    }

    triggerGlitch()

    return () => {
      window.clearTimeout(timerId)
      window.clearTimeout(resetId)
    }
  }, [glitchInterval, isDocumentVisible, isAnimationPaused])

  return {
    isGlitching,
    glitchDuration,
    glitchInterval,
    setGlitchInterval,
    glitchImageRate,
    setGlitchImageRate,
    handleTriggerGlitchBurst,
  }
}
