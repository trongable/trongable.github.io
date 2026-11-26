import { useState, useEffect, useRef, useCallback } from 'react'

interface UseGlitchSchedulerOptions {
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

  const handleTriggerGlitchBurst = useCallback(() => {
    const burstDuration = 1200
    setGlitchDuration(burstDuration)
    setIsGlitching(true)
    window.setTimeout(() => {
      setIsGlitching(false)
      if (!isThemeLockedRef.current) {
        randomizeRef.current()
      }
    }, burstDuration)
  }, [])

  // Cancel active glitch if paused
  useEffect(() => {
    if (isAnimationPaused) {
      setIsGlitching(false)
    }
  }, [isAnimationPaused])

  // Periodic fullscreen GPU artifact glitch every `glitchInterval` seconds, lasting 400ms to 3,000ms
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || !isDocumentVisible || isAnimationPaused) return

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
