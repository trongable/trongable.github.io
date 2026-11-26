import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from '@/routes/Router'
import { useTheme } from '@/context/ThemeContext'
import { usePowerManager } from '@/hooks/usePowerManager'
import { SceneContainer, CameraAngles } from '@/components/canvas/SceneContainer'
import { GpuGlitchOverlay } from '@/components/effects/GpuGlitchOverlay'
import { GeometryDispatcher } from '@/components/canvas/geometries/GeometryDispatcher'
import { Tuner } from '@/components/ui/Tuner'
import {
  GeometryMode,
  AllGeometryParams,
  DEFAULT_GEOMETRY_PARAMS,
  DEFAULT_GEOMETRY_MODE,
  isValidGeometryMode,
} from '@/components/canvas/geometries/geometryConfig'
import {
  useAngelContainer,
  isValidAngelContainer,
} from '@/context/AngelContainerContext'
import { useDebugDistance } from '@/context/DebugDistanceContext'
import { useTuner } from '@/context/TunerContext'
import { scrambleGlyphs } from '@/utils/glyphUtils'
import { useGlitchScheduler } from './home/useGlitchScheduler'
import { useHomeConsoleCommands } from './home/useHomeConsoleCommands'
import { HomeHudOverlay } from './home/HomeHudOverlay'
import { HomeScreenReaderNav } from './home/HomeScreenReaderNav'

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
  const { containerStyle: angelContainer, setContainerStyle: setAngelContainer } =
    useAngelContainer()

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

  const isPauseParam =
    queryParams.paused === 'true' ||
    queryParams.paused === '1' ||
    queryParams.pause === 'true' ||
    queryParams.pause === '1'

  const [isAnimationPaused, setIsAnimationPaused] = useState<boolean>(() => isPauseParam)
  const isAnimationPausedRef = useRef(isAnimationPaused)
  isAnimationPausedRef.current = isAnimationPaused

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

  const prevCameraElevationRef = useRef(cameraElevation)
  useEffect(() => {
    if (prevCameraElevationRef.current !== cameraElevation) {
      prevCameraElevationRef.current = cameraElevation
      const targetPitch = cameraElevation === 'eye-level' ? 0 : 25.07
      const targetDist = cameraElevation === 'eye-level' ? 6.0 : 6.017
      setCameraAngles((prev) => ({ ...prev, pitch: targetPitch, distance: targetDist }))
    }
  }, [cameraElevation])

  const handleResetCameraAngles = useCallback(() => {
    const targetPitch = cameraElevation === 'eye-level' ? 0 : 25.07
    const targetDist = cameraElevation === 'eye-level' ? 6.0 : 6.017
    setCameraAngles({ yaw: 0, pitch: targetPitch, distance: targetDist })
  }, [cameraElevation])

  const [geometryParams, setGeometryParams] = useState<AllGeometryParams>(DEFAULT_GEOMETRY_PARAMS)

  const handleModeChange = useCallback(
    (newMode: GeometryMode) => {
      const params = new URLSearchParams(window.location.search)
      if (newMode === DEFAULT_GEOMETRY_MODE) {
        params.delete('geo')
      } else {
        params.set('geo', newMode)
      }
      const queryString = params.toString()
      const targetPath = queryString ? `/?${queryString}` : '/'
      navigate(targetPath)
    },
    [navigate]
  )

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

  const isHaloParam =
    queryParams.halo === 'true' ||
    queryParams.halo === '1' ||
    queryParams.expanded === 'true' ||
    queryParams.expanded === '1'

  const [isExpanded, setIsExpanded] = useState<boolean>(() => isHaloParam)
  const [isTouchHovered, setIsTouchHovered] = useState(false)
  const [welcomeDisplay, setWelcomeDisplay] = useState('welcome')

  const {
    isGlitching,
    glitchDuration,
    glitchInterval,
    setGlitchInterval,
    glitchImageRate,
    setGlitchImageRate,
    handleTriggerGlitchBurst,
  } = useGlitchScheduler({
    isDocumentVisible,
    isAnimationPaused,
    isThemeLocked,
    randomizeTheme,
  })

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

  // Query parameter synchronization
  useEffect(() => {
    if (isPauseParam) setIsAnimationPaused(true)
  }, [isPauseParam])

  useEffect(() => {
    if (isHaloParam) setIsExpanded(true)
  }, [isHaloParam])

  useEffect(() => {
    if (queryParams.container && isValidAngelContainer(queryParams.container)) {
      setAngelContainer(queryParams.container)
      setIsExpanded(true)
    }
  }, [queryParams.container, setAngelContainer])

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

  useEffect(() => {
    const elev = queryParams.elevation ?? queryParams.camera
    if (elev === 'eye-level' || elev === 'elevated') {
      setCameraElevation(elev)
    }
  }, [queryParams.elevation, queryParams.camera, setCameraElevation])

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

  useHomeConsoleCommands({
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
  })

  return (
    <main
      data-effects-paused={isAnimationPaused ? 'true' : undefined}
      className="relative w-full h-full min-h-dvh overflow-hidden bg-[#1c1b22] flex items-center justify-center select-none"
    >
      <GpuGlitchOverlay
        isActive={isGlitching}
        duration={glitchDuration}
        primaryColor={currentTheme.primary}
        imageProbability={glitchImageRate}
      />

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
          onSelect={navigate}
          isGlitching={isGlitching}
          isPaused={isAnimationPaused}
          theme={currentTheme}
        />
      </SceneContainer>

      <HomeScreenReaderNav onSelect={navigate} />

      <HomeHudOverlay
        isExpanded={isExpanded}
        isTouchHovered={isTouchHovered}
        isGlitching={isGlitching}
        welcomeDisplay={welcomeDisplay}
        onExpand={() => setIsExpanded(true)}
        onToggleExpand={() => setIsExpanded((prev) => !prev)}
        onTouchStart={() => setIsTouchHovered(true)}
        onTouchEnd={() => {
          setIsTouchHovered(false)
          setWelcomeDisplay('welcome')
          setIsExpanded(true)
        }}
        onTouchCancel={() => {
          setIsTouchHovered(false)
          setWelcomeDisplay('welcome')
        }}
      />

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
          angelContainer={angelContainer}
          onAngelContainerChange={setAngelContainer}
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
