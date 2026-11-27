import { useState, useEffect, useRef, useCallback } from 'react'
import type { CameraElevation } from '@/context/DebugDistanceContext'
import {
  CameraAngles,
  DEFAULT_ELEVATED_PITCH,
  DEFAULT_ELEVATED_DIST,
  DEFAULT_EYE_LEVEL_DIST,
} from '@/features/scene/CameraController'

function getElevationDefaults(elevation: CameraElevation): { pitch: number; distance: number } {
  return elevation === 'eye-level'
    ? { pitch: 0, distance: DEFAULT_EYE_LEVEL_DIST }
    : { pitch: DEFAULT_ELEVATED_PITCH, distance: DEFAULT_ELEVATED_DIST }
}

/**
 * Manages home scene camera orbit angles, URL query param hydration,
 * elevation preset synchronization, and camera angle reset.
 */
export function useHomeCamera(
  cameraElevation: CameraElevation,
  queryParams: Record<string, string>
) {
  const [cameraAngles, setCameraAngles] = useState<CameraAngles>(() => {
    const defaults = getElevationDefaults(cameraElevation)
    let yaw = 0
    let pitch = defaults.pitch
    let distance = defaults.distance

    if (queryParams.yaw) {
      const parsed = parseFloat(queryParams.yaw)
      if (!Number.isNaN(parsed)) yaw = parsed
    }
    if (queryParams.pitch) {
      const parsed = parseFloat(queryParams.pitch)
      if (!Number.isNaN(parsed)) pitch = parsed
    }
    const rawZoom = queryParams.zoom || queryParams.distance || queryParams.dist_zoom
    if (rawZoom) {
      const parsed = parseFloat(rawZoom)
      if (!Number.isNaN(parsed)) distance = parsed
    }
    return { yaw, pitch, distance }
  })

  const cameraAnglesRef = useRef(cameraAngles)
  useEffect(() => {
    cameraAnglesRef.current = cameraAngles
  }, [cameraAngles])

  const prevElevationRef = useRef(cameraElevation)
  useEffect(() => {
    if (prevElevationRef.current !== cameraElevation) {
      prevElevationRef.current = cameraElevation
      const { pitch, distance } = getElevationDefaults(cameraElevation)
      setCameraAngles((prev) => ({ ...prev, pitch, distance }))
    }
  }, [cameraElevation])

  const handleResetCameraAngles = useCallback(() => {
    const { pitch, distance } = getElevationDefaults(cameraElevation)
    setCameraAngles({ yaw: 0, pitch, distance })
  }, [cameraElevation])

  return {
    cameraAngles,
    setCameraAngles,
    cameraAnglesRef,
    handleResetCameraAngles,
  }
}
