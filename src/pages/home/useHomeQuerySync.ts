import type React from 'react'
import { useEffect } from 'react'
import type { CameraElevation } from '@/context/DebugDistanceContext'
import {
  AngelContainerStyle,
  isValidAngelContainer,
} from '@/features/angel/AngelContainerContext'

interface UseHomeQuerySyncOptions {
  queryParams: Record<string, string>
  isPauseParam: boolean
  isHaloParam: boolean
  setIsAnimationPaused: React.Dispatch<React.SetStateAction<boolean>>
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  setIsTouchHovered: React.Dispatch<React.SetStateAction<boolean>>
  setWelcomeDisplay: React.Dispatch<React.SetStateAction<string>>
  setAngelContainer: (style: AngelContainerStyle) => void
  setShowDistance: (show: boolean) => void
  setCameraElevation: (elevation: CameraElevation) => void
}

/**
 * Synchronizes URL query flags (`paused`, `halo`/`expanded`, `container`,
 * `dist`/`debugDistance`, `elevation`/`camera`) and Escape-key collapse on `HomePage`.
 */
export function useHomeQuerySync({
  queryParams,
  isPauseParam,
  isHaloParam,
  setIsAnimationPaused,
  setIsExpanded,
  setIsTouchHovered,
  setWelcomeDisplay,
  setAngelContainer,
  setShowDistance,
  setCameraElevation,
}: UseHomeQuerySyncOptions): void {
  useEffect(() => {
    if (isPauseParam) setIsAnimationPaused(true)
  }, [isPauseParam, setIsAnimationPaused])

  useEffect(() => {
    if (isHaloParam) setIsExpanded(true)
  }, [isHaloParam, setIsExpanded])

  useEffect(() => {
    if (queryParams.container && isValidAngelContainer(queryParams.container)) {
      setAngelContainer(queryParams.container)
      setIsExpanded(true)
    }
  }, [queryParams.container, setAngelContainer, setIsExpanded])

  useEffect(() => {
    const isDistParam =
      queryParams.dist === 'true' ||
      queryParams.dist === '1' ||
      queryParams.debugDistance === 'true' ||
      queryParams.debugDistance === '1'
    if (isDistParam) {
      setShowDistance(true)
      setIsExpanded(true)
    }
  }, [queryParams.dist, queryParams.debugDistance, setShowDistance, setIsExpanded])

  useEffect(() => {
    const elev = queryParams.elevation ?? queryParams.camera
    if (elev === 'eye-level' || elev === 'elevated') {
      setCameraElevation(elev)
    }
  }, [queryParams.elevation, queryParams.camera, setCameraElevation])

  // Escape key collapses the topology menu and restores the "welcome" trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false)
        setIsTouchHovered(false)
        setWelcomeDisplay('welcome')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setIsExpanded, setIsTouchHovered, setWelcomeDisplay])
}
