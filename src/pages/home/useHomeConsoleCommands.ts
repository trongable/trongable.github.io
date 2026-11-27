import type React from 'react'
import { useEffect } from 'react'
import type { PowerMode } from '@/hooks/usePowerManager'
import type { CameraAngles } from '@/features/scene/SceneContainer'
import { GEOMETRY_MODES, isValidGeometryMode } from '@/features/topologies/config/geometryConfig'
import {
  ANGEL_CONTAINER_STYLES,
  AngelContainerStyle,
  isValidAngelContainer,
} from '@/features/angel/AngelContainerContext'
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
  setAngelContainer: (style: AngelContainerStyle) => void
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

const LOG_STYLE_OK = 'color: #39ff14'
const LOG_STYLE_BADGE =
  'color: #39ff14; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'

function persistTunerVisibility(next: boolean): void {
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
}

/**
 * Registers secret developer console commands on `window` (`tuner()`, `pause()`,
 * `setGeo()`, `setAngelContainer()`, etc.) and cleans them up on unmount.
 */
export function useHomeConsoleCommands(opts: UseHomeConsoleCommandsOptions): void {
  const {
    setIsTunerVisible,
    setIsAnimationPaused,
    isAnimationPausedRef,
    handleModeChange,
    setAngelContainer,
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
        persistTunerVisibility(next)
        if (next) {
          console.log('%c[TOPOLOGY TUNER] UNLOCKED', LOG_STYLE_BADGE)
          console.log(
            'Animation menu is now visible in the bottom-right HUD.\nCommands:\n  tuner()                  - Toggle visibility\n  pause(boolean?)          - Pause or resume animation engine\n  togglePause()            - Toggle animation pause\n  isPaused()               - Check animation pause status\n  setGeo(mode)             - Switch topology\n  geoList()                - List all topologies\n  setAngelContainer(style) - Switch Angel 3D container\n  angelContainers()        - List all Angel containers\n  toggleDistance()         - Toggle distance debug labels\n  showDistance(boolean)    - Set distance debug labels\n  setCameraElevation(elev) - Switch camera elevation (\'elevated\', \'eye-level\')\n  toggleCameraElevation()  - Toggle camera elevation\n  hideTuner()              - Hide HUD tuner'
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
      console.log(`%c[ANIMATION ENGINE] ${next ? 'PAUSED' : 'RESUMED'}`, LOG_STYLE_BADGE)
    }

    const togglePauseCmd = () => {
      setIsAnimationPaused((prev) => {
        const next = !prev
        console.log(`%c[ANIMATION ENGINE] ${next ? 'PAUSED' : 'RESUMED'}`, LOG_STYLE_BADGE)
        return next
      })
    }

    const setGeo = (mode: string) => {
      if (isValidGeometryMode(mode)) {
        handleModeChange(mode)
        console.log(`%c[TOPOLOGY] Switched to '${mode}'`, LOG_STYLE_OK)
      } else {
        console.warn(`[TOPOLOGY] Invalid mode '${mode}'. Available:`, GEOMETRY_MODES.map((m) => m.id))
      }
    }

    const setAngelContainerCmd = (style: string) => {
      if (isValidAngelContainer(style)) {
        setAngelContainer(style)
        console.log(`%c[ANGEL CONTAINER] Switched to '${style}'`, LOG_STYLE_OK)
      } else {
        console.warn(
          `[ANGEL CONTAINER] Invalid container '${style}'. Available:`,
          ANGEL_CONTAINER_STYLES.map((s) => s.id)
        )
      }
    }

    const commands: Record<string, unknown> = {
      tuner: toggleTuner,
      showTuner: () => toggleTuner(true),
      hideTuner: () => toggleTuner(false),
      pause: pauseCmd,
      togglePause: togglePauseCmd,
      isPaused: () => isAnimationPausedRef.current,
      setGeo,
      geoList: () =>
        console.table(GEOMETRY_MODES.map((m) => ({ id: m.id, name: m.name, description: m.description }))),
      setAngelContainer: setAngelContainerCmd,
      angelContainer: setAngelContainerCmd,
      angelContainers: () =>
        console.table(
          ANGEL_CONTAINER_STYLES.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
          }))
        ),
      toggleDistance,
      showDistance: (show?: boolean) => setShowDistance(typeof show === 'boolean' ? show : true),
      setDistanceMetric: (metric: string) => {
        if (metric === 'depth' || metric === 'euclid') {
          setDistanceMetric(metric)
          console.log(`%c[DISTANCE METRIC] Switched to '${metric}'`, LOG_STYLE_OK)
        } else {
          console.warn(`[DISTANCE METRIC] Invalid metric '${metric}'. Available: 'euclid', 'depth'`)
        }
      },
      toggleDistanceMetric: () => {
        toggleDistanceMetric()
        console.log('%c[DISTANCE METRIC] Toggled metric', LOG_STYLE_OK)
      },
      distanceMetric: () => distanceMetric,
      toggleCoords: toggleCoordinates,
      showCoords: (show?: boolean) => setShowCoordinates(typeof show === 'boolean' ? show : true),
      setCoordFrame: (frame: string) => {
        if (frame === 'view' || frame === 'world') {
          setCoordFrame(frame)
          console.log(`%c[COORD FRAME] Switched to '${frame}'`, LOG_STYLE_OK)
        } else {
          console.warn(`[COORD FRAME] Invalid frame '${frame}'. Available: 'view', 'world'`)
        }
      },
      toggleCoordFrame: () => {
        toggleCoordFrame()
        console.log('%c[COORD FRAME] Toggled coordinate frame', LOG_STYLE_OK)
      },
      coordFrame: () => coordFrame,
      setCameraElevation: (elev: string) => {
        if (elev === 'eye-level' || elev === 'elevated') {
          setCameraElevation(elev)
          console.log(`%c[CAMERA ELEVATION] Switched to '${elev}'`, LOG_STYLE_OK)
        } else {
          console.warn(`[CAMERA ELEVATION] Invalid elevation '${elev}'. Available: 'elevated', 'eye-level'`)
        }
      },
      toggleCameraElevation: () => {
        toggleCameraElevation()
        console.log('%c[CAMERA ELEVATION] Toggled camera elevation', LOG_STYLE_OK)
      },
      cameraElevation: () => cameraElevation,
      setInspectYaw: (deg: number) => {
        setCameraAngles((prev) => ({ ...prev, yaw: deg }))
        console.log(`%c[CAMERA INSPECT] Yaw set to ${deg}°`, LOG_STYLE_OK)
      },
      setInspectPitch: (deg: number) => {
        setCameraAngles((prev) => ({ ...prev, pitch: deg }))
        console.log(`%c[CAMERA INSPECT] Pitch set to ${deg}°`, LOG_STYLE_OK)
      },
      setInspectDistance: (dist: number) => {
        setCameraAngles((prev) => ({ ...prev, distance: dist }))
        console.log(`%c[CAMERA INSPECT] Distance set to ${dist}`, LOG_STYLE_OK)
      },
      resetCameraAngles: () => {
        handleResetCameraAngles()
        console.log('%c[CAMERA INSPECT] Reset camera angles to default view', LOG_STYLE_OK)
      },
      cameraAngles: () => cameraAnglesRef.current,
      glitch: handleTriggerGlitchBurst,
      triggerGlitch: handleTriggerGlitchBurst,
      setTheme,
      setColor: (hex: string, highlight?: string) => setCustomColor(hex, highlight),
      setCustomColor: (hex: string, highlight?: string) => setCustomColor(hex, highlight),
      lockTheme: (locked?: boolean) =>
        setIsThemeLocked((prev: boolean) => (typeof locked === 'boolean' ? locked : !prev)),
      setImageRate: (r: number) => setGlitchImageRate(Math.max(0, Math.min(1, r))),
      setGlitchInterval: (s: number) => setGlitchInterval(Math.max(1, s)),
      setPowerMode: (mode: PowerMode) => setPowerMode(mode),
      powerMode: () => {
        console.log(
          `%c[POWER MODE] ${powerMode.toUpperCase()}`,
          'color: #39ff14; font-weight: bold;',
          `\nSource: ${isBattery ? 'Battery' : 'AC Power'}\nTarget FPS: ${targetFps ? `${targetFps} FPS` : 'Uncapped (Native)'}\nTarget DPR: ${Array.isArray(targetDpr) ? targetDpr.join('-') : targetDpr}\nStatus: ${isSleeping ? 'Sleeping (Background Tab)' : 'Active'}`
        )
      },
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    Object.assign(win, commands)

    return () => {
      Object.keys(commands).forEach((key) => {
        delete win[key]
      })
    }
  }, [
    setIsTunerVisible,
    setIsAnimationPaused,
    isAnimationPausedRef,
    handleModeChange,
    setAngelContainer,
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
