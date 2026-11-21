import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export const DEBUG_DISTANCE_STORAGE_KEY = 'trongngyn_debug_distance'
export const DEBUG_DISTANCE_METRIC_KEY = 'trongngyn_debug_distance_metric'
export const DEBUG_DISTANCE_COORDS_KEY = 'trongngyn_debug_distance_coords'

export type DistanceMetric = 'euclid' | 'depth'

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
})

export const DebugDistanceProvider: React.FC<{
  children: React.ReactNode
  initialShow?: boolean
  initialMetric?: DistanceMetric
  initialShowCoords?: boolean
}> = ({ children, initialShow, initialMetric, initialShowCoords }) => {
  const [showDistance, setShowDistanceState] = useState<boolean>(() => {
    if (typeof initialShow === 'boolean') {
      return initialShow
    }

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const distParam = queryParams.get('dist') ?? queryParams.get('debugDistance')
        if (distParam === 'true' || distParam === '1') {
          return true
        }

        const stored = window.localStorage.getItem(DEBUG_DISTANCE_STORAGE_KEY)
        if (stored === 'true') {
          return true
        }
      } catch {
        // Ignore localStorage / window access errors
      }
    }
    return false
  })

  const [distanceMetric, setDistanceMetricState] = useState<DistanceMetric>(() => {
    if (initialMetric === 'euclid' || initialMetric === 'depth') {
      return initialMetric
    }

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const metricParam = queryParams.get('metric') ?? queryParams.get('distMetric')
        if (metricParam === 'depth' || metricParam === 'euclid') {
          return metricParam
        }

        const stored = window.localStorage.getItem(DEBUG_DISTANCE_METRIC_KEY)
        if (stored === 'depth' || stored === 'euclid') {
          return stored
        }
      } catch {
        // Ignore localStorage / window access errors
      }
    }
    return 'euclid'
  })

  const [showCoordinates, setShowCoordinatesState] = useState<boolean>(() => {
    if (typeof initialShowCoords === 'boolean') {
      return initialShowCoords
    }

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const coordsParam = queryParams.get('coords') ?? queryParams.get('xyz')
        if (coordsParam === 'false' || coordsParam === '0') {
          return false
        }
        if (coordsParam === 'true' || coordsParam === '1') {
          return true
        }

        const stored = window.localStorage.getItem(DEBUG_DISTANCE_COORDS_KEY)
        if (stored === 'false') {
          return false
        }
        if (stored === 'true') {
          return true
        }
      } catch {
        // Ignore localStorage / window access errors
      }
    }
    return true
  })

  const setShowDistance = useCallback((show: boolean) => {
    setShowDistanceState(show)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DEBUG_DISTANCE_STORAGE_KEY, String(show))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  const toggleDistance = useCallback(() => {
    setShowDistanceState((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(DEBUG_DISTANCE_STORAGE_KEY, String(next))
        } catch {
          // Ignore localStorage errors
        }
      }
      return next
    })
  }, [])

  const setDistanceMetric = useCallback((metric: DistanceMetric) => {
    setDistanceMetricState(metric)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DEBUG_DISTANCE_METRIC_KEY, metric)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  const toggleDistanceMetric = useCallback(() => {
    setDistanceMetricState((prev) => {
      const next = prev === 'euclid' ? 'depth' : 'euclid'
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(DEBUG_DISTANCE_METRIC_KEY, next)
        } catch {
          // Ignore localStorage errors
        }
      }
      return next
    })
  }, [])

  const setShowCoordinates = useCallback((show: boolean) => {
    setShowCoordinatesState(show)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(DEBUG_DISTANCE_COORDS_KEY, String(show))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  const toggleCoordinates = useCallback(() => {
    setShowCoordinatesState((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(DEBUG_DISTANCE_COORDS_KEY, String(next))
        } catch {
          // Ignore localStorage errors
        }
      }
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
