import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '../routes/Router'
import { useTheme } from '../context/ThemeContext'
import { usePowerManager, PowerMode } from '../hooks/usePowerManager'
import { SceneContainer, CameraAngles } from '../components/canvas/SceneContainer'
import { GpuGlitchOverlay } from '../components/effects/GpuGlitchOverlay'
import { GeometryDispatcher } from '../components/canvas/geometries/GeometryDispatcher'
import { Tuner } from '../components/ui/Tuner'
import {
  GeometryMode,
  AllGeometryParams,
  DEFAULT_GEOMETRY_PARAMS,
  DEFAULT_GEOMETRY_MODE,
  isValidGeometryMode,
  GEOMETRY_MODES,
} from '../components/canvas/geometries/geometryConfig'
import {
  useSonnyContainer,
  isValidSonnyContainer,
  SONNY_CONTAINER_STYLES,
} from '../context/SonnyContainerContext'
import { useDebugDistance } from '../context/DebugDistanceContext'
import { useTuner } from '../context/TunerContext'
import { scrambleGlyphs } from '../utils/glyphUtils'

export const HomePage: React.FC = () => {
  const { navigate, queryParams } = useRouter()
  const {
    currentTheme,
    randomizeTheme,
    setTheme,
    setCustomColor,
    isThemeLocked,
    setIsThemeLocked,
  } = useTheme()
  const {
    isDocumentVisible,
    isBattery,
    powerMode,
    setPowerMode,
    targetFps,
    targetDpr,
    isSleeping,
  } = usePowerManager()
  const randomizeRef = useRef(randomizeTheme)
  randomizeRef.current = randomizeTheme
  const isThemeLockedRef = useRef(isThemeLocked)
  isThemeLockedRef.current = isThemeLocked

  const { containerStyle: sonnyContainer, setContainerStyle: setSonnyContainer } =
    useSonnyContainer()

  const {
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
  } = useDebugDistance()

  // Active geometry mode (defaults to 'tesseract' if not specified or invalid)
  const activeGeoMode: GeometryMode = isValidGeometryMode(queryParams.geo)
    ? queryParams.geo
    : DEFAULT_GEOMETRY_MODE

  const tunerContext = useTuner()
  const [localTunerVisible, setLocalTunerVisible] = useState<boolean>(() => {
    try {
      if (
        queryParams.tuner === 'true' ||
        queryParams.tuner === '1' ||
        queryParams.debug === 'true'
      ) {
        return true
      }
      return (
        window.localStorage.getItem('trongngyn_tuner_visible') === 'true' ||
        window.localStorage.getItem('antigravity_tuner_visible') === 'true'
      )
    } catch {
      return false
    }
  })

  const isTunerVisible = tunerContext.isStandAlone ? localTunerVisible : tunerContext.isTunerVisible
  const setIsTunerVisible = tunerContext.isStandAlone ? setLocalTunerVisible : tunerContext.setIsTunerVisible

  // Detect pause query param: ?paused=true, ?paused=1, ?pause=true, ?pause=1
  const isPauseParam =
    queryParams.paused === 'true' ||
    queryParams.paused === '1' ||
    queryParams.pause === 'true' ||
    queryParams.pause === '1'

  const [isAnimationPaused, setIsAnimationPaused] = useState<boolean>(() => isPauseParam)
  const isAnimationPausedRef = useRef(isAnimationPaused)
  isAnimationPausedRef.current = isAnimationPaused

  // Camera Orbit Inspection angles (Yaw, Pitch, Distance)
  const defaultInspectPitch = cameraElevation === 'eye-level' ? 0 : 25.07
  const defaultInspectDist = cameraElevation === 'eye-level' ? 6.0 : 6.017

  const [cameraAngles, setCameraAngles] = useState<CameraAngles>(() => {
    let initialYaw = 0
    let initialPitch = defaultInspectPitch
    let initialDist = defaultInspectDist
    if (queryParams.yaw) {
      const parsed = parseFloat(queryParams.yaw)
      if (!Number.isNaN(parsed)) initialYaw = parsed
    }
    if (queryParams.pitch) {
      const parsed = parseFloat(queryParams.pitch)
      if (!Number.isNaN(parsed)) initialPitch = parsed
    }
    if (queryParams.zoom || queryParams.distance || queryParams.dist_zoom) {
      const parsed = parseFloat(queryParams.zoom || queryParams.distance || queryParams.dist_zoom)
      if (!Number.isNaN(parsed)) initialDist = parsed
    }
    return { yaw: initialYaw, pitch: initialPitch, distance: initialDist }
  })
  const cameraAnglesRef = useRef(cameraAngles)
  useEffect(() => {
    cameraAnglesRef.current = cameraAngles
  }, [cameraAngles])

  // Sync default pitch/distance when cameraElevation changes after mount
  const prevCameraElevationRef = useRef(cameraElevation)
  useEffect(() => {
    if (prevCameraElevationRef.current !== cameraElevation) {
      prevCameraElevationRef.current = cameraElevation
      const targetPitch = cameraElevation === 'eye-level' ? 0 : 25.07
      const targetDist = cameraElevation === 'eye-level' ? 6.0 : 6.017
      setCameraAngles((prev) => ({ ...prev, pitch: targetPitch, distance: targetDist }))
    }
  }, [cameraElevation])

  const handleResetCameraAngles = () => {
    const targetPitch = cameraElevation === 'eye-level' ? 0 : 25.07
    const targetDist = cameraElevation === 'eye-level' ? 6.0 : 6.017
    setCameraAngles({ yaw: 0, pitch: targetPitch, distance: targetDist })
  }

  const [geometryParams, setGeometryParams] = useState<AllGeometryParams>(DEFAULT_GEOMETRY_PARAMS)

  const handleModeChange = (newMode: GeometryMode) => {
    // Synchronize via browser history / query params
    const params = new URLSearchParams(window.location.search)
    if (newMode === DEFAULT_GEOMETRY_MODE) {
      params.delete('geo')
    } else {
      params.set('geo', newMode)
    }
    const queryString = params.toString()
    const targetPath = queryString ? `/?${queryString}` : '/'
    navigate(targetPath)
  }

  const handleParamChange = <M extends GeometryMode, K extends keyof AllGeometryParams[M]>(
    mode: M,
    key: K,
    val: AllGeometryParams[M][K]
  ) => {
    setGeometryParams((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: val,
      },
    }))
  }

  const handleResetParams = (mode: GeometryMode) => {
    setGeometryParams((prev) => ({
      ...prev,
      [mode]: { ...DEFAULT_GEOMETRY_PARAMS[mode] },
    }))
  }

  // Detect query param to auto-expand halo: ?halo=true, ?halo=1, ?expanded=true, etc.
  const isHaloParam =
    queryParams.halo === 'true' ||
    queryParams.halo === '1' ||
    queryParams.expanded === 'true' ||
    queryParams.expanded === '1'

  const [isExpanded, setIsExpanded] = useState<boolean>(() => isHaloParam)
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchDuration, setGlitchDuration] = useState(360)
  const [glitchInterval, setGlitchInterval] = useState<number>(8)
  const [glitchImageRate, setGlitchImageRate] = useState<number>(1.0)
  const [isTouchHovered, setIsTouchHovered] = useState(false)
  const [welcomeDisplay, setWelcomeDisplay] = useState('welcome')

  const handleTriggerGlitchBurst = () => {
    const burstDuration = 1200
    setGlitchDuration(burstDuration)
    setIsGlitching(true)
    window.setTimeout(() => {
      setIsGlitching(false)
      if (!isThemeLockedRef.current) {
        randomizeRef.current()
      }
    }, burstDuration)
  }

  // Scramble glyphs while touch-hovered (press-and-hold tactile feedback on mobile)
  useEffect(() => {
    if (!isTouchHovered || isAnimationPaused) {
      setWelcomeDisplay('welcome')
      return
    }

    const interval = window.setInterval(() => {
      setWelcomeDisplay(scrambleGlyphs('welcome', Math.random() < 0.35 ? 2 : 1))
    }, 85)

    return () => window.clearInterval(interval)
  }, [isTouchHovered, isAnimationPaused])

  // Synchronize pause query param
  useEffect(() => {
    if (isPauseParam) {
      setIsAnimationPaused(true)
    }
  }, [isPauseParam])

  // Cancel active glitch if paused
  useEffect(() => {
    if (isAnimationPaused) {
      setIsGlitching(false)
    }
  }, [isAnimationPaused])

  // Synchronize if query params change
  useEffect(() => {
    if (isHaloParam) {
      setIsExpanded(true)
    }
  }, [isHaloParam])

  // Synchronize container query param
  useEffect(() => {
    if (queryParams.container && isValidSonnyContainer(queryParams.container)) {
      setSonnyContainer(queryParams.container)
      setIsExpanded(true)
    }
  }, [queryParams.container, setSonnyContainer])

  // Synchronize debug distance query param
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
  }, [queryParams.dist, queryParams.debugDistance, setShowDistance])

  // Synchronize camera elevation query param: ?elevation=eye-level or ?camera=eye-level
  useEffect(() => {
    const elev = queryParams.elevation ?? queryParams.camera
    if (elev === 'eye-level' || elev === 'elevated') {
      setCameraElevation(elev)
    }
  }, [queryParams.elevation, queryParams.camera, setCameraElevation])

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
      // Dynamic interval based on tuned glitchInterval (in seconds)
      const baseMs = glitchInterval * 1000
      const nextInterval = baseMs * 0.65 + Math.random() * (baseMs * 0.70)
      timerId = window.setTimeout(() => {
        // Glitch duration randomized up to 3.0 seconds (400ms to 3000ms)
        const burstDuration = 400 + Math.random() * 2600
        setGlitchDuration(burstDuration)
        setIsGlitching(true)
        resetId = window.setTimeout(() => {
          setIsGlitching(false)
          // Mutate to a new random neon color right after the glitch resolves (unless theme is locked)
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

  const handleSelect = (path: string) => {
    navigate(path)
  }

  // Allow Escape key to collapse the halo and bring back "welcome"
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
  }, [])

  // Secret Console Commands: unlock and toggle the geometry tuner
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

    const isPausedCmd = () => isAnimationPausedRef.current

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
    win.isPaused = isPausedCmd
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
      delete win.tuner
      delete win.showTuner
      delete win.hideTuner
      delete win.pause
      delete win.togglePause
      delete win.isPaused
      delete win.setGeo
      delete win.geoList
      delete win.setSonnyContainer
      delete win.sonnyContainer
      delete win.sonnyContainers
      delete win.toggleDistance
      delete win.showDistance
      delete win.setDistanceMetric
      delete win.toggleDistanceMetric
      delete win.distanceMetric
      delete win.toggleCoords
      delete win.showCoords
      delete win.setCoordFrame
      delete win.toggleCoordFrame
      delete win.coordFrame
      delete win.setCameraElevation
      delete win.toggleCameraElevation
      delete win.cameraElevation
      delete win.setInspectYaw
      delete win.setInspectPitch
      delete win.setInspectDistance
      delete win.resetCameraAngles
      delete win.cameraAngles
      delete win.cameraElevation
      delete win.glitch
      delete win.triggerGlitch
      delete win.setTheme
      delete win.setColor
      delete win.setCustomColor
      delete win.lockTheme
      delete win.setImageRate
      delete win.setGlitchInterval
      delete win.setPowerMode
      delete win.powerMode
    }
  }, [
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
    setTheme,
    setCustomColor,
    setIsThemeLocked,
    setPowerMode,
    powerMode,
    isBattery,
    targetFps,
    targetDpr,
    isSleeping,
  ])

  return (
    <main
      data-effects-paused={isAnimationPaused ? 'true' : undefined}
      className="relative w-full h-full min-h-dvh overflow-hidden bg-[#1c1b22] flex items-center justify-center select-none"
    >
      {/* Fullscreen Random "Graphics Card Dying" Artifact Glitch Overlay */}
      <GpuGlitchOverlay
        isActive={isGlitching}
        duration={glitchDuration}
        primaryColor={currentTheme.primary}
        imageProbability={glitchImageRate}
      />

      {/* 3D Canvas Background & Geometry Animation */}
      <SceneContainer
        isGlitching={isGlitching}
        isPaused={isAnimationPaused}
        cameraElevation={cameraElevation}
        cameraAngles={cameraAngles}
        theme={currentTheme}
        targetFps={targetFps}
        targetDpr={targetDpr}
        isSleeping={isSleeping}
        onBackgroundClick={() => {
          if (isExpanded) {
            setIsExpanded(false)
            setIsTouchHovered(false)
            setWelcomeDisplay('welcome')
          }
        }}
      >
        <GeometryDispatcher
          mode={activeGeoMode}
          params={geometryParams}
          isExpanded={isExpanded}
          onSelect={handleSelect}
          isGlitching={isGlitching}
          isPaused={isAnimationPaused}
          theme={currentTheme}
        />
      </SceneContainer>

      {/* Accessibility screen-reader navigation links */}
      <nav className="sr-only" aria-label="Direct Destinations">
        <button onClick={() => handleSelect('/about')}>about</button>
        <button onClick={() => handleSelect('/gallery')}>gallery</button>
        <button onClick={() => handleSelect('/more')}>more</button>
        <button onClick={() => handleSelect('/sonny')}>sonny</button>
        <a href="https://dc-hardcore.com" target="_blank" rel="noopener noreferrer">dchc</a>
      </nav>

      {/* Central "welcome" text - shrinks and disappears when halo appears */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <button
          type="button"
          data-testid="welcome-trigger"
          aria-label="Welcome menu trigger"
          onMouseEnter={() => setIsExpanded(true)}
          onTouchStart={() => {
            setIsTouchHovered(true)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            setIsTouchHovered(false)
            setWelcomeDisplay('welcome')
            setIsExpanded(true)
          }}
          onTouchCancel={() => {
            setIsTouchHovered(false)
            setWelcomeDisplay('welcome')
          }}
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded((prev) => !prev)
          }}
          className={`relative font-serif italic lowercase tracking-wide text-2xl md:text-3xl transition-all duration-700 ease-out px-6 py-3 rounded-full touch-manipulation after:content-[''] after:absolute after:-inset-8 md:after:inset-0 ${
            isGlitching ? 'glitch-shear-active' : ''
          } ${
            isExpanded
              ? 'scale-0 opacity-0 pointer-events-none'
              : isTouchHovered
              ? 'pointer-events-auto cursor-pointer scale-105 opacity-100 text-[var(--theme-highlight)]'
              : 'pointer-events-auto cursor-pointer scale-100 opacity-100 text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] hover:scale-105'
          }`}
        >
          {welcomeDisplay}
        </button>
      </div>

      {/* Bottom-Right HUD System Parameter Tuner (Secret: unlock via `tuner()` in console) */}
      {isTunerVisible && (
        <Tuner
          activeMode={activeGeoMode}
          onModeChange={handleModeChange}
          params={geometryParams}
          onParamChange={handleParamChange}
          onResetParams={handleResetParams}
          currentThemeId={currentTheme.id}
          currentThemePrimary={currentTheme.primary}
          currentThemeHighlight={currentTheme.highlight}
          onThemeChange={setTheme}
          onCustomColorChange={setCustomColor}
          isThemeLocked={isThemeLocked}
          onToggleThemeLock={setIsThemeLocked}
          glitchInterval={glitchInterval}
          onGlitchIntervalChange={setGlitchInterval}
          imageRate={glitchImageRate}
          onImageRateChange={setGlitchImageRate}
          onTriggerGlitch={handleTriggerGlitchBurst}
          powerMode={powerMode}
          onPowerModeChange={setPowerMode}
          isBattery={isBattery}
          targetFps={targetFps}
          targetDpr={targetDpr}
          sonnyContainer={sonnyContainer}
          onSonnyContainerChange={setSonnyContainer}
          showDistance={showDistance}
          onToggleShowDistance={setShowDistance}
          distanceMetric={distanceMetric}
          onDistanceMetricChange={setDistanceMetric}
          showCoordinates={showCoordinates}
          onToggleShowCoordinates={setShowCoordinates}
          coordFrame={coordFrame}
          onCoordFrameChange={setCoordFrame}
          cameraElevation={cameraElevation}
          onCameraElevationChange={setCameraElevation}
          cameraAngles={cameraAngles}
          onCameraAnglesChange={setCameraAngles}
          onResetCameraAngles={handleResetCameraAngles}
          isPaused={isAnimationPaused}
          onTogglePause={(paused) =>
            setIsAnimationPaused(typeof paused === 'boolean' ? paused : !isAnimationPaused)
          }
          onClose={() => {
            setIsTunerVisible(false)
            setIsAnimationPaused(false)
            try {
              window.localStorage.removeItem('trongngyn_tuner_visible')
              window.localStorage.removeItem('antigravity_tuner_visible')
            } catch {
              // ignore localStorage errors
            }
          }}
        />
      )}
    </main>
  )
}
