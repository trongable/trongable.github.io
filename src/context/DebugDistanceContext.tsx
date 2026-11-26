import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  DEBUG_DISTANCE_STORAGE_KEY,
  DEBUG_DISTANCE_METRIC_KEY,
  DEBUG_DISTANCE_COORDS_KEY,
  DEBUG_DISTANCE_FRAME_KEY,
  DEBUG_DISTANCE_ELEVATION_KEY,
  DistanceMetric,
  CoordFrame,
  CameraElevation,
  readStoredBoolean,
  readStoredEnum,
  writeStoredSetting,
} from './debugDistanceStorage'

export {
  DEBUG_DISTANCE_STORAGE_KEY,
  DEBUG_DISTANCE_METRIC_KEY,
  DEBUG_DISTANCE_COORDS_KEY,
  DEBUG_DISTANCE_FRAME_KEY,
  DEBUG_DISTANCE_ELEVATION_KEY,
}
export type { DistanceMetric, CoordFrame, CameraElevation }

export interface DebugDistanceContextValue {
  showDistance: boolean
  setShowDistance: (show: boolean) => void
  toggleDistance: () => void
  distanceMetric: DistanceMetric
  setDistanceMetric: (metric: DistanceMetric) => void
  toggleDistanceMetric: () => void
  showCoordinates: boolean
  setShowCoordinates: (show: boolean) => void
  toggleCoordinates: () => void
  coordFrame: CoordFrame
  setCoordFrame: (frame: CoordFrame) => void
  toggleCoordFrame: () => void
  cameraElevation: CameraElevation
  setCameraElevation: (elevation: CameraElevation) => void
  toggleCameraElevation: () => void
}

const DebugDistanceContext = createContext<DebugDistanceContextValue>({
  showDistance: false,
  setShowDistance: () => {},
  toggleDistance: () => {},
  distanceMetric: 'euclid',
  setDistanceMetric: () => {},
  toggleDistanceMetric: () => {},
  showCoordinates: true,
  setShowCoordinates: () => {},
  toggleCoordinates: () => {},
  coordFrame: 'view',
  setCoordFrame: () => {},
  toggleCoordFrame: () => {},
  cameraElevation: 'elevated',
  setCameraElevation: () => {},
  toggleCameraElevation: () => {},
})

export const DebugDistanceProvider: React.FC<{
  children: React.ReactNode
  initialShow?: boolean
  initialMetric?: DistanceMetric
  initialShowCoords?: boolean
  initialFrame?: CoordFrame
  initialElevation?: CameraElevation
}> = ({
  children,
  initialShow,
  initialMetric,
  initialShowCoords,
  initialFrame,
  initialElevation,
}) => {
  const [showDistance, setShowDistanceState] = useState<boolean>(() =>
    readStoredBoolean(initialShow, ['dist', 'debugDistance'], DEBUG_DISTANCE_STORAGE_KEY, false)
  )

  const [distanceMetric, setDistanceMetricState] = useState<DistanceMetric>(() =>
    readStoredEnum(initialMetric, ['euclid', 'depth'], ['metric', 'distMetric'], DEBUG_DISTANCE_METRIC_KEY, 'euclid')
  )

  const [showCoordinates, setShowCoordinatesState] = useState<boolean>(() =>
    readStoredBoolean(initialShowCoords, ['coords', 'xyz'], DEBUG_DISTANCE_COORDS_KEY, true)
  )

  const [coordFrame, setCoordFrameState] = useState<CoordFrame>(() =>
    readStoredEnum(initialFrame, ['view', 'world'], ['frame', 'coordFrame'], DEBUG_DISTANCE_FRAME_KEY, 'view')
  )

  const [cameraElevation, setCameraElevationState] = useState<CameraElevation>(() =>
    readStoredEnum(initialElevation, ['elevated', 'eye-level'], ['elevation', 'camera'], DEBUG_DISTANCE_ELEVATION_KEY, 'elevated')
  )

  const setShowDistance = useCallback((show: boolean) => {
    setShowDistanceState(show)
    writeStoredSetting(DEBUG_DISTANCE_STORAGE_KEY, String(show))
  }, [])

  const toggleDistance = useCallback(() => {
    setShowDistanceState((prev) => {
      const next = !prev
      writeStoredSetting(DEBUG_DISTANCE_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const setDistanceMetric = useCallback((metric: DistanceMetric) => {
    setDistanceMetricState(metric)
    writeStoredSetting(DEBUG_DISTANCE_METRIC_KEY, metric)
  }, [])

  const toggleDistanceMetric = useCallback(() => {
    setDistanceMetricState((prev) => {
      const next = prev === 'euclid' ? 'depth' : 'euclid'
      writeStoredSetting(DEBUG_DISTANCE_METRIC_KEY, next)
      return next
    })
  }, [])

  const setShowCoordinates = useCallback((show: boolean) => {
    setShowCoordinatesState(show)
    writeStoredSetting(DEBUG_DISTANCE_COORDS_KEY, String(show))
  }, [])

  const toggleCoordinates = useCallback(() => {
    setShowCoordinatesState((prev) => {
      const next = !prev
      writeStoredSetting(DEBUG_DISTANCE_COORDS_KEY, String(next))
      return next
    })
  }, [])

  const setCoordFrame = useCallback((frame: CoordFrame) => {
    setCoordFrameState(frame)
    writeStoredSetting(DEBUG_DISTANCE_FRAME_KEY, frame)
  }, [])

  const toggleCoordFrame = useCallback(() => {
    setCoordFrameState((prev) => {
      const next = prev === 'view' ? 'world' : 'view'
      writeStoredSetting(DEBUG_DISTANCE_FRAME_KEY, next)
      return next
    })
  }, [])

  const setCameraElevation = useCallback((elevation: CameraElevation) => {
    setCameraElevationState(elevation)
    writeStoredSetting(DEBUG_DISTANCE_ELEVATION_KEY, elevation)
  }, [])

  const toggleCameraElevation = useCallback(() => {
    setCameraElevationState((prev) => {
      const next = prev === 'elevated' ? 'eye-level' : 'elevated'
      writeStoredSetting(DEBUG_DISTANCE_ELEVATION_KEY, next)
      return next
    })
  }, [])

  // Keep in sync with storage across tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === DEBUG_DISTANCE_STORAGE_KEY && e.newValue !== null) {
        setShowDistanceState(e.newValue === 'true')
      }
      if (e.key === DEBUG_DISTANCE_METRIC_KEY && (e.newValue === 'euclid' || e.newValue === 'depth')) {
        setDistanceMetricState(e.newValue)
      }
      if (e.key === DEBUG_DISTANCE_COORDS_KEY && e.newValue !== null) {
        setShowCoordinatesState(e.newValue === 'true')
      }
      if (e.key === DEBUG_DISTANCE_FRAME_KEY && (e.newValue === 'view' || e.newValue === 'world')) {
        setCoordFrameState(e.newValue)
      }
      if (e.key === DEBUG_DISTANCE_ELEVATION_KEY && (e.newValue === 'elevated' || e.newValue === 'eye-level')) {
        setCameraElevationState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const value = useMemo(
    () => ({
      showDistance,
      setShowDistance,
      toggleDistance,
      distanceMetric,
      setDistanceMetric,
      toggleDistanceMetric,
      showCoordinates,
      setShowCoordinates,
      toggleCoordinates,
      coordFrame,
      setCoordFrame,
      toggleCoordFrame,
      cameraElevation,
      setCameraElevation,
      toggleCameraElevation,
    }),
    [
      showDistance,
      setShowDistance,
      toggleDistance,
      distanceMetric,
      setDistanceMetric,
      toggleDistanceMetric,
      showCoordinates,
      setShowCoordinates,
      toggleCoordinates,
      coordFrame,
      setCoordFrame,
      toggleCoordFrame,
      cameraElevation,
      setCameraElevation,
      toggleCameraElevation,
    ]
  )

  return (
    <DebugDistanceContext.Provider value={value}>
      {children}
    </DebugDistanceContext.Provider>
  )
}

export const useDebugDistance = (): DebugDistanceContextValue => {
  return useContext(DebugDistanceContext)
}
