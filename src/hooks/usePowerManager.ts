import { useState, useEffect, useCallback } from 'react'

export type PowerMode = 'auto' | 'eco' | 'uncapped'

export interface BatteryManagerLike {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
}

export interface PowerState {
  isDocumentVisible: boolean
  isBattery: boolean
  powerMode: PowerMode
  setPowerMode: (mode: PowerMode) => void
  targetFps: number | null // null means uncapped (native refresh rate e.g. 120Hz/144Hz)
  targetDpr: number | [number, number]
  isSleeping: boolean
}

const STORAGE_KEY = 'trongngyn_power_mode'

export function getStoredPowerMode(): PowerMode {
  if (typeof window === 'undefined') return 'auto'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'eco' || stored === 'uncapped' || stored === 'auto') {
      return stored
    }
  } catch {
    // Ignore localStorage access errors
  }
  return 'auto'
}

export function usePowerManager(): PowerState {
  const [isDocumentVisible, setIsDocumentVisible] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true
    return document.visibilityState === 'visible'
  })

  const [isBattery, setIsBattery] = useState<boolean>(false)
  const [powerMode, setPowerModeState] = useState<PowerMode>(() => getStoredPowerMode())

  // Page Visibility API
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Battery Status API (Chromium / Edge / Chrome)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return

    let isMounted = true
    let batteryInstance: BatteryManagerLike | null = null
    const updateCharging = () => {
      if (batteryInstance && isMounted) {
        setIsBattery(!batteryInstance.charging)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(navigator as any).getBattery().then((battery: BatteryManagerLike) => {
      if (!isMounted) return
      batteryInstance = battery
      setIsBattery(!battery.charging)
      battery.addEventListener('chargingchange', updateCharging)
    }).catch(() => {
      // getBattery rejected or blocked by permissions policy
    })

    return () => {
      isMounted = false
      if (batteryInstance) {
        batteryInstance.removeEventListener('chargingchange', updateCharging)
      }
    }
  }, [])

  const setPowerMode = useCallback((mode: PowerMode) => {
    setPowerModeState(mode)
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Derive target FPS and DPR based on mode, battery, and visibility
  const isSleeping = !isDocumentVisible

  let targetFps: number | null = null // null = uncapped native display refresh rate (120Hz/144Hz)
  let targetDpr: number | [number, number] = [1, 2]

  if (isSleeping) {
    targetFps = 0
    targetDpr = 1.0
  } else if (powerMode === 'uncapped') {
    targetFps = null // Uncapped native refresh rate
    targetDpr = [1, 2] // Full resolution even on battery
  } else if (powerMode === 'eco') {
    targetFps = null // Uncapped native refresh rate
    targetDpr = 1.0 // Reduced DPR (75% pixel workload reduction)
  } else {
    // 'auto' (default): allows uncapped FPS, manages DPR based on battery state
    targetFps = null
    targetDpr = isBattery ? 1.0 : [1, 2]
  }

  return {
    isDocumentVisible,
    isBattery,
    powerMode,
    setPowerMode,
    targetFps,
    targetDpr,
    isSleeping,
  }
}
