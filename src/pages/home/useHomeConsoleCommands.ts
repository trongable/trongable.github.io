import type React from 'react'
import { useEffect } from 'react'
import type { PowerMode } from '@/hooks/usePowerManager'
import type { CameraAngles } from '@/components/canvas/SceneContainer'
import { GEOMETRY_MODES, isValidGeometryMode } from '@/components/canvas/geometries/geometryConfig'
import {
  SONNY_CONTAINER_STYLES,
  SonnyContainerStyle,
  isValidSonnyContainer,
} from '@/context/SonnyContainerContext'
import type {
  DistanceMetric,
  CoordFrame,
  CameraElevation,
} from '@/context/DebugDistanceContext'
import type { ThemeId } from '@/context/ThemeContext'

interface UseHomeConsoleCommandsOptions {
  setIsTunerVisible: React.Dispatch<React.SetStateAction<boolean>>
  setIsAnimationPaused: React.Dispatch<React.SetStateAction<boolean>>
  isAnimationPausedRef: React.MutableRefObject<boolean>
  handleModeChange: (mode: (typeof GEOMETRY_MODES)[number]['id']) => void
  setSonnyContainer: (style: SonnyContainerStyle) => void
  toggleDistance: () => void
  setShowDistance: (show: boolean) => void
  setDistanceMetric: (metric: DistanceMetric) => void
  toggleDistanceMetric: () => void
  distanceMetric: DistanceMetric
  toggleCoordinates: () => void
  setShowCoordinates: (show: boolean) => void
  setCoordFrame: (frame: CoordFrame) => void
  toggleCoordFrame: () => void
  coordFrame: CoordFrame
  setCameraElevation: (elevation: CameraElevation) => void
  toggleCameraElevation: () => void
  cameraElevation: CameraElevation
  setCameraAngles: React.Dispatch<React.SetStateAction<CameraAngles>>
  cameraAnglesRef: React.MutableRefObject<CameraAngles>
  handleResetCameraAngles: () => void
  handleTriggerGlitchBurst: () => void
  setTheme: (id: ThemeId) => void
  setCustomColor: (hex: string, highlight?: string) => void
  setIsThemeLocked: React.Dispatch<React.SetStateAction<boolean>>
  setGlitchImageRate: (rate: number) => void
  setGlitchInterval: (seconds: number) => void
  setPowerMode: (mode: PowerMode) => void
  powerMode: PowerMode
  isBattery: boolean
  targetFps: number | null
  targetDpr: number | [number, number]
  isSleeping: boolean
}

/**
 * Registers secret developer console commands on `window` (`tuner()`, `pause()`,
 * `setGeo()`, `setSonnyContainer()`, etc.) and cleans them up on unmount.
 */
export function useHomeConsoleCommands(opts: UseHomeConsoleCommandsOptions): void {
  const {
    setIsTunerVisible,
    setIsAnimationPaused,
    isAnimationPausedRef,
    handleModeChange,
    setSonnyContainer,
    toggleDistance,
    setShowDistance,
    setDistanceMetric,
    toggleDistanceMetric,
    distanceMetric,
    toggleCoordinates,
    setShowCoordinates,
    setCoordFrame,
    toggleCoordFrame,
    coordFrame,
    setCameraElevation,
    toggleCameraElevation,
    cameraElevation,
    setCameraAngles,
    cameraAnglesRef,
    handleResetCameraAngles,
    handleTriggerGlitchBurst,
    setTheme,
    setCustomColor,
    setIsThemeLocked,
    setGlitchImageRate,
    setGlitchInterval,
    setPowerMode,
    powerMode,
    isBattery,
    targetFps,
    targetDpr,
    isSleeping,
  } = opts

  useEffect(() => {
    const toggleTuner = (show?: boolean) => {
      setIsTunerVisible((prev) => {
        const next = typeof show === 'boolean' ? show : !prev
        try {
          if (next) {
            window.localStorage.setItem('trongngyn_tuner_visible', 'true')
            window.localStorage.removeItem('antigravity_tuner_visible')
          } else {
            window.localStorage.removeItem('trongngyn_tuner_visible')
            window.localStorage.removeItem('antigravity_tuner_visible')
          }
        } catch {
          // ignore localStorage errors
        }
        if (next) {
          console.log(
            '%c[TOPOLOGY TUNER] UNLOCKED',
            'color: #39ff14; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'
          )
          console.log(
            'Animation menu is now visible in the bottom-right HUD.\nCommands:\n  tuner()                  - Toggle visibility\n  pause(boolean?)          - Pause or resume animation engine\n  togglePause()            - Toggle animation pause\n  isPaused()               - Check animation pause status\n  setGeo(mode)             - Switch topology\n  geoList()                - List all topologies\n  setSonnyContainer(style) - Switch Sonny 3D container\n  sonnyContainers()        - List all Sonny containers\n  toggleDistance()         - Toggle distance debug labels\n  showDistance(boolean)    - Set distance debug labels\n  setCameraElevation(elev) - Switch camera elevation (\'elevated\', \'eye-level\')\n  toggleCameraElevation()  - Toggle camera elevation\n  hideTuner()              - Hide HUD tuner'
          )
        } else {
          console.log(
            '%c[TOPOLOGY TUNER] HIDDEN',
            'color: #ff007f; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'
          )
        }
        return next
      })
    }

    const pauseCmd = (paused?: boolean) => {
      const next = typeof paused === 'boolean' ? paused : true
      setIsAnimationPaused(next)
      console.log(
        `%c[ANIMATION ENGINE] ${next ? 'PAUSED' : 'RESUMED'}`,
        'color: #39ff14; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'
      )
    }

    const togglePauseCmd = () => {
      setIsAnimationPaused((prev) => {
        const next = !prev
        console.log(
          `%c[ANIMATION ENGINE] ${next ? 'PAUSED' : 'RESUMED'}`,
          'color: #39ff14; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'
        )
        return next
      })
    }

    const setGeo = (mode: string) => {
      if (isValidGeometryMode(mode)) {
        handleModeChange(mode)
        console.log(`%c[TOPOLOGY] Switched to '${mode}'`, 'color: #39ff14')
      } else {
        console.warn(`[TOPOLOGY] Invalid mode '${mode}'. Available:`, GEOMETRY_MODES.map((m) => m.id))
      }
    }

    const geoList = () => {
      console.table(GEOMETRY_MODES.map((m) => ({ id: m.id, name: m.name, description: m.description })))
    }

    const setSonnyContainerCmd = (style: string) => {
      if (isValidSonnyContainer(style)) {
        setSonnyContainer(style)
        console.log(`%c[SONNY CONTAINER] Switched to '${style}'`, 'color: #39ff14')
      } else {
        console.warn(
          `[SONNY CONTAINER] Invalid container '${style}'. Available:`,
          SONNY_CONTAINER_STYLES.map((s) => s.id)
        )
      }
    }

    const sonnyContainers = () => {
      console.table(
        SONNY_CONTAINER_STYLES.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
        }))
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    win.tuner = toggleTuner
    win.showTuner = () => toggleTuner(true)
    win.hideTuner = () => toggleTuner(false)
    win.pause = pauseCmd
    win.togglePause = togglePauseCmd
    win.isPaused = () => isAnimationPausedRef.current
    win.setGeo = setGeo
    win.geoList = geoList
    win.setSonnyContainer = setSonnyContainerCmd
    win.sonnyContainer = setSonnyContainerCmd
    win.sonnyContainers = sonnyContainers
    win.toggleDistance = toggleDistance
    win.showDistance = (show?: boolean) => setShowDistance(typeof show === 'boolean' ? show : true)
    win.setDistanceMetric = (metric: string) => {
      if (metric === 'depth' || metric === 'euclid') {
        setDistanceMetric(metric)
        console.log(`%c[DISTANCE METRIC] Switched to '${metric}'`, 'color: #39ff14')
      } else {
        console.warn(`[DISTANCE METRIC] Invalid metric '${metric}'. Available: 'euclid', 'depth'`)
      }
    }
    win.toggleDistanceMetric = () => {
      toggleDistanceMetric()
      console.log('%c[DISTANCE METRIC] Toggled metric', 'color: #39ff14')
    }
    win.distanceMetric = () => distanceMetric
    win.toggleCoords = toggleCoordinates
    win.showCoords = (show?: boolean) => setShowCoordinates(typeof show === 'boolean' ? show : true)
    win.setCoordFrame = (frame: string) => {
      if (frame === 'view' || frame === 'world') {
        setCoordFrame(frame)
        console.log(`%c[COORD FRAME] Switched to '${frame}'`, 'color: #39ff14')
      } else {
        console.warn(`[COORD FRAME] Invalid frame '${frame}'. Available: 'view', 'world'`)
      }
    }
    win.toggleCoordFrame = () => {
      toggleCoordFrame()
      console.log('%c[COORD FRAME] Toggled coordinate frame', 'color: #39ff14')
    }
    win.coordFrame = () => coordFrame
    win.setCameraElevation = (elev: string) => {
      if (elev === 'eye-level' || elev === 'elevated') {
        setCameraElevation(elev)
        console.log(`%c[CAMERA ELEVATION] Switched to '${elev}'`, 'color: #39ff14')
      } else {
        console.warn(`[CAMERA ELEVATION] Invalid elevation '${elev}'. Available: 'elevated', 'eye-level'`)
      }
    }
    win.toggleCameraElevation = () => {
      toggleCameraElevation()
      console.log('%c[CAMERA ELEVATION] Toggled camera elevation', 'color: #39ff14')
    }
    win.cameraElevation = () => cameraElevation
    win.setInspectYaw = (deg: number) => {
      setCameraAngles((prev) => ({ ...prev, yaw: deg }))
      console.log(`%c[CAMERA INSPECT] Yaw set to ${deg}°`, 'color: #39ff14')
    }
    win.setInspectPitch = (deg: number) => {
      setCameraAngles((prev) => ({ ...prev, pitch: deg }))
      console.log(`%c[CAMERA INSPECT] Pitch set to ${deg}°`, 'color: #39ff14')
    }
    win.setInspectDistance = (dist: number) => {
      setCameraAngles((prev) => ({ ...prev, distance: dist }))
      console.log(`%c[CAMERA INSPECT] Distance set to ${dist}`, 'color: #39ff14')
    }
    win.resetCameraAngles = () => {
      handleResetCameraAngles()
      console.log('%c[CAMERA INSPECT] Reset camera angles to default view', 'color: #39ff14')
    }
    win.cameraAngles = () => cameraAnglesRef.current
    win.glitch = handleTriggerGlitchBurst
    win.triggerGlitch = handleTriggerGlitchBurst
    win.setTheme = setTheme
    win.setColor = (hex: string, highlight?: string) => setCustomColor(hex, highlight)
    win.setCustomColor = (hex: string, highlight?: string) => setCustomColor(hex, highlight)
    win.lockTheme = (locked?: boolean) =>
      setIsThemeLocked((prev: boolean) => (typeof locked === 'boolean' ? locked : !prev))
    win.setImageRate = (r: number) => setGlitchImageRate(Math.max(0, Math.min(1, r)))
    win.setGlitchInterval = (s: number) => setGlitchInterval(Math.max(1, s))
    win.setPowerMode = (mode: PowerMode) => setPowerMode(mode)
    win.powerMode = () => {
      console.log(
        `%c[POWER MODE] ${powerMode.toUpperCase()}`,
        'color: #39ff14; font-weight: bold;',
        `\nSource: ${isBattery ? 'Battery' : 'AC Power'}\nTarget FPS: ${targetFps ? `${targetFps} FPS` : 'Uncapped (Native)'}\nTarget DPR: ${Array.isArray(targetDpr) ? targetDpr.join('-') : targetDpr}\nStatus: ${isSleeping ? 'Sleeping (Background Tab)' : 'Active'}`
      )
    }

    return () => {
      const keys = [
        'tuner',
        'showTuner',
        'hideTuner',
        'pause',
        'togglePause',
        'isPaused',
        'setGeo',
        'geoList',
        'setSonnyContainer',
        'sonnyContainer',
        'sonnyContainers',
        'toggleDistance',
        'showDistance',
        'setDistanceMetric',
        'toggleDistanceMetric',
        'distanceMetric',
        'toggleCoords',
        'showCoords',
        'setCoordFrame',
        'toggleCoordFrame',
        'coordFrame',
        'setCameraElevation',
        'toggleCameraElevation',
        'cameraElevation',
        'setInspectYaw',
        'setInspectPitch',
        'setInspectDistance',
        'resetCameraAngles',
        'cameraAngles',
        'glitch',
        'triggerGlitch',
        'setTheme',
        'setColor',
        'setCustomColor',
        'lockTheme',
        'setImageRate',
        'setGlitchInterval',
        'setPowerMode',
        'powerMode',
      ]
      keys.forEach((k) => delete win[k])
    }
  }, [
    setIsTunerVisible,
    setIsAnimationPaused,
    isAnimationPausedRef,
    handleModeChange,
    setSonnyContainer,
    toggleDistance,
    setShowDistance,
    setDistanceMetric,
    toggleDistanceMetric,
    distanceMetric,
    setShowCoordinates,
    toggleCoordinates,
    setCoordFrame,
    toggleCoordFrame,
    coordFrame,
    setCameraElevation,
    toggleCameraElevation,
    cameraElevation,
    setCameraAngles,
    cameraAnglesRef,
    handleResetCameraAngles,
    handleTriggerGlitchBurst,
    setTheme,
    setCustomColor,
    setIsThemeLocked,
    setGlitchImageRate,
    setGlitchInterval,
    setPowerMode,
    powerMode,
    isBattery,
    targetFps,
    targetDpr,
    isSleeping,
  ])
}
