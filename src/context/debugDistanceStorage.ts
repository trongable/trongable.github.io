export const DEBUG_DISTANCE_STORAGE_KEY = 'trongngyn_debug_distance'
export const DEBUG_DISTANCE_METRIC_KEY = 'trongngyn_debug_distance_metric'
export const DEBUG_DISTANCE_COORDS_KEY = 'trongngyn_debug_distance_coords'
export const DEBUG_DISTANCE_FRAME_KEY = 'trongngyn_debug_distance_coord_frame'
export const DEBUG_DISTANCE_ELEVATION_KEY = 'trongngyn_camera_elevation'

export type DistanceMetric = 'euclid' | 'depth'
export type CoordFrame = 'view' | 'world'
export type CameraElevation = 'elevated' | 'eye-level'

/**
 * Reads an initial boolean preference from explicit prop, URL query params, or localStorage.
 */
export function readStoredBoolean(
  initial: boolean | undefined,
  queryKeys: string[],
  storageKey: string,
  fallback: boolean
): boolean {
  if (typeof initial === 'boolean') return initial
  if (typeof window === 'undefined') return fallback

  try {
    const queryParams = new URLSearchParams(window.location.search)
    for (const key of queryKeys) {
      const val = queryParams.get(key)
      if (val === 'true' || val === '1') return true
      if (val === 'false' || val === '0') return false
    }

    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'true') return true
    if (stored === 'false') return false
  } catch {
    // Ignore localStorage / window access errors
  }
  return fallback
}

/**
 * Reads an initial enum preference from explicit prop, URL query params, or localStorage.
 */
export function readStoredEnum<T extends string>(
  initial: T | undefined,
  validValues: readonly T[],
  queryKeys: string[],
  storageKey: string,
  fallback: T
): T {
  if (initial && validValues.includes(initial)) return initial
  if (typeof window === 'undefined') return fallback

  try {
    const queryParams = new URLSearchParams(window.location.search)
    for (const key of queryKeys) {
      const val = queryParams.get(key) as T | null
      if (val && validValues.includes(val)) return val
    }

    const stored = window.localStorage.getItem(storageKey) as T | null
    if (stored && validValues.includes(stored)) return stored
  } catch {
    // Ignore localStorage / window access errors
  }
  return fallback
}

/**
 * Persists a telemetry setting to localStorage safely.
 */
export function writeStoredSetting(storageKey: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, value)
  } catch {
    // Ignore localStorage errors
  }
}
