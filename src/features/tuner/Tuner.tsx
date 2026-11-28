import React, { useState, useEffect } from 'react'
import {
  GEOMETRY_MODES,
  DEFAULT_GEOMETRY_PARAMS,
} from '@/features/topologies/config/geometryConfig'
import {
  AngelContainerStyle,
  useAngelContainer,
} from '@/features/angel/AngelContainerContext'
import {
  useDebugDistance,
  DistanceMetric,
  CoordFrame,
  CameraElevation,
} from '@/context/DebugDistanceContext'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from '@/features/gallery/data/galleryTunerConfig'
import {
  computeHighlightColor,
  isValidHex,
  normalizeHex,
  getContrastRatio,
} from '@/utils/colorUtils'
import { useTuner } from '@/features/tuner/TunerContext'
import { TunerProps, TunerTabId } from '@/features/tuner/tunerTypes'
import { TunerGalleryTab } from '@/features/tuner/TunerGalleryTab'
import { TunerGeometryTab } from '@/features/tuner/TunerGeometryTab'
import { TunerVfxTab } from '@/features/tuner/TunerVfxTab'
import { CompactInspectDock } from '@/features/tuner/CompactInspectDock'
import { TunerHudPill } from '@/features/tuner/TunerHudPill'

export type { TunerProps }

export const Tuner: React.FC<TunerProps> = ({
  activeMode = 'halo',
  onModeChange = () => {},
  params = DEFAULT_GEOMETRY_PARAMS,
  onParamChange = () => {},
  onResetParams = () => {},
  onClose,
  currentThemeId = 'yellow',
  currentThemePrimary,
  currentThemeHighlight,
  onThemeChange,
  onCustomColorChange,
  isThemeLocked = false,
  onToggleThemeLock,
  glitchInterval = 8,
  onGlitchIntervalChange,
  imageRate = 1.0,
  onImageRateChange,
  onTriggerGlitch,
  powerMode = 'auto',
  onPowerModeChange,
  isBattery = false,
  targetFps = 60,
  targetDpr = [1, 2],
  angelContainer,
  onAngelContainerChange,
  showDistance,
  onToggleShowDistance,
  distanceMetric,
  onDistanceMetricChange,
  showCoordinates,
  onToggleShowCoordinates,
  coordFrame,
  onCoordFrameChange,
  cameraElevation,
  onCameraElevationChange,
  cameraAngles,
  onCameraAnglesChange,
  onResetCameraAngles,
  isPaused = false,
  onTogglePause,
  isGalleryPage = false,
  videoParams = DEFAULT_GALLERY_CHAMBER_PARAMS,
  onVideoParamChange = () => {},
  onResetVideoParams = () => {},
}) => {
  const isEffectiveGallery = Boolean(isGalleryPage)
  const { isTerminalOpen } = useTuner()
  const { containerStyle: ctxContainerStyle, setContainerStyle: ctxSetContainerStyle } =
    useAngelContainer()
  const activeAngelContainer = angelContainer ?? ctxContainerStyle
  const handleContainerChange = (style: AngelContainerStyle) => {
    if (onAngelContainerChange) {
      onAngelContainerChange(style)
    } else {
      ctxSetContainerStyle(style)
    }
  }

  const {
    showDistance: ctxShowDistance,
    toggleDistance: ctxToggleDistance,
    distanceMetric: ctxDistanceMetric,
    setDistanceMetric: ctxSetDistanceMetric,
    showCoordinates: ctxShowCoords,
    toggleCoordinates: ctxToggleCoordinates,
    coordFrame: ctxCoordFrame,
    setCoordFrame: ctxSetCoordFrame,
    cameraElevation: ctxCameraElevation,
    setCameraElevation: ctxSetCameraElevation,
  } = useDebugDistance()

  const activeShowDistance = typeof showDistance === 'boolean' ? showDistance : ctxShowDistance
  const activeDistanceMetric = distanceMetric ?? ctxDistanceMetric ?? 'euclid'
  const activeShowCoords = typeof showCoordinates === 'boolean' ? showCoordinates : ctxShowCoords
  const activeCoordFrame = coordFrame ?? ctxCoordFrame ?? 'view'
  const activeCameraElevation = cameraElevation ?? ctxCameraElevation ?? 'elevated'

  const handleToggleDistance = () => {
    if (onToggleShowDistance) {
      onToggleShowDistance(!activeShowDistance)
    } else {
      ctxToggleDistance()
    }
  }

  const handleSetMetric = (metric: DistanceMetric) => {
    if (onDistanceMetricChange) {
      onDistanceMetricChange(metric)
    } else {
      ctxSetDistanceMetric(metric)
    }
  }

  const handleToggleCoords = () => {
    if (onToggleShowCoordinates) {
      onToggleShowCoordinates(!activeShowCoords)
    } else {
      ctxToggleCoordinates()
    }
  }

  const handleSetCoordFrame = (frame: CoordFrame) => {
    if (onCoordFrameChange) {
      onCoordFrameChange(frame)
    } else {
      ctxSetCoordFrame(frame)
    }
  }

  const handleSetCameraElevation = (elevation: CameraElevation) => {
    if (onCameraElevationChange) {
      onCameraElevationChange(elevation)
    } else {
      ctxSetCameraElevation(elevation)
    }
  }

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TunerTabId>('geo')
  const [customHexInput, setCustomHexInput] = useState<string>(
    () => currentThemePrimary || '#e2f872'
  )

  useEffect(() => {
    if (currentThemePrimary) {
      setCustomHexInput(currentThemePrimary)
    }
  }, [currentThemePrimary])

  const handleHexChange = (val: string) => {
    setCustomHexInput(val)
    if (isValidHex(val)) {
      const normalized = normalizeHex(val)
      if (normalized) {
        onCustomColorChange?.(normalized)
      }
    }
  }

  const activePrimaryHex = isValidHex(customHexInput)
    ? normalizeHex(customHexInput)!
    : currentThemePrimary || '#e2f872'
  const autoHighlightHex = currentThemeHighlight || computeHighlightColor(activePrimaryHex)
  const contrastRatio = getContrastRatio(autoHighlightHex, '#1c1b22')

  const handleCycle = () => {
    if (!onModeChange) return
    const currentIndex = GEOMETRY_MODES.findIndex((m) => m.id === activeMode)
    const nextIndex = (currentIndex + 1) % GEOMETRY_MODES.length
    onModeChange(GEOMETRY_MODES[nextIndex].id)
  }

  const currentMeta = GEOMETRY_MODES.find((m) => m.id === activeMode) || GEOMETRY_MODES[0]

  return (
    <div
      data-testid="geometry-tuner"
      className={`fixed right-5 z-[60] flex flex-col items-end font-mono select-none transition-[bottom] motion-reduce:transition-none ${
        isTerminalOpen
          ? 'bottom-16 duration-[180ms] delay-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
          : 'bottom-5 duration-150 delay-0 ease-out'
      }`}
    >
      {/* Collapsible Tuning Drawer */}
      {isOpen && (
        <div
          data-testid="geometry-tuner-drawer"
          className={`mb-3 w-84 max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--theme-primary)]/30 bg-[#1c1b22]/95 p-4 text-xs text-[var(--theme-primary)] shadow-2xl backdrop-blur-md transition-all overflow-y-auto ${
            isTerminalOpen ? 'max-h-[calc(100dvh-9rem)]' : 'max-h-[82vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2 mb-2.5">
            <div>
              <span className="font-bold tracking-wider uppercase text-[11px]">System Tuner</span>
              <p className="text-[10px] opacity-70 mt-0.5">
                {activeTab === 'geo'
                  ? isEffectiveGallery
                    ? 'Gallery Chamber 3D Laboratory'
                    : currentMeta.name
                  : isEffectiveGallery
                  ? 'VFX & Theme Controls'
                  : 'VFX & Glitch Controls'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'geo' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEffectiveGallery) {
                      onResetVideoParams?.()
                    } else if (onResetParams && activeMode) {
                      onResetParams(activeMode)
                    }
                  }}
                  className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-[var(--theme-highlight)] cursor-pointer"
                  title="Reset to default parameters"
                >
                  reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cursor-pointer text-sm font-bold opacity-70 hover:opacity-100 px-1"
                aria-label="Close tuner"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex border-b border-[var(--theme-primary)]/20 mb-3 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab('geo')}
              className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'geo'
                  ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {isEffectiveGallery ? 'Gallery Chamber' : '3D Topologies'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vfx')}
              className={`flex-1 py-1.5 text-center font-semibold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'vfx'
                  ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {isEffectiveGallery ? 'VFX & Theme' : 'VFX & Glitch'}
            </button>
          </div>

          {activeTab === 'geo' && isEffectiveGallery && videoParams && onVideoParamChange && (
            <TunerGalleryTab
              videoParams={videoParams}
              onVideoParamChange={onVideoParamChange}
              onResetVideoParams={onResetVideoParams}
            />
          )}

          {activeTab === 'geo' && !isEffectiveGallery && (
            <TunerGeometryTab
              activeMode={activeMode}
              currentMetaName={currentMeta.name}
              onModeChange={onModeChange}
              params={params}
              onParamChange={onParamChange}
              onResetParams={onResetParams}
              activeAngelContainer={activeAngelContainer}
              onContainerChange={handleContainerChange}
              activeShowDistance={activeShowDistance}
              onToggleDistance={handleToggleDistance}
              activeDistanceMetric={activeDistanceMetric}
              onSetMetric={handleSetMetric}
              activeShowCoords={activeShowCoords}
              onToggleCoords={handleToggleCoords}
              activeCoordFrame={activeCoordFrame}
              onSetCoordFrame={handleSetCoordFrame}
              activeCameraElevation={activeCameraElevation}
              onSetCameraElevation={handleSetCameraElevation}
              isPaused={isPaused}
              cameraAngles={cameraAngles}
              onCameraAnglesChange={onCameraAnglesChange}
              onResetCameraAngles={onResetCameraAngles}
            />
          )}

          {activeTab === 'vfx' && (
            <TunerVfxTab
              currentThemeId={currentThemeId}
              onThemeChange={onThemeChange}
              customHexInput={customHexInput}
              onHexChange={handleHexChange}
              activePrimaryHex={activePrimaryHex}
              autoHighlightHex={autoHighlightHex}
              contrastRatio={contrastRatio}
              isThemeLocked={isThemeLocked}
              onToggleThemeLock={onToggleThemeLock}
              glitchInterval={glitchInterval}
              onGlitchIntervalChange={onGlitchIntervalChange}
              imageRate={imageRate}
              onImageRateChange={onImageRateChange}
              powerMode={powerMode}
              onPowerModeChange={onPowerModeChange}
              isBattery={isBattery}
              targetFps={targetFps}
              targetDpr={targetDpr}
              isPaused={isPaused}
              onTogglePause={onTogglePause}
              onTriggerGlitch={onTriggerGlitch}
            />
          )}
        </div>
      )}

      {/* Floating Compact Inspection Dock when Paused */}
      {isPaused && !isOpen && (
        <CompactInspectDock
          cameraAngles={cameraAngles}
          onCameraAnglesChange={onCameraAnglesChange}
          onResetCameraAngles={onResetCameraAngles}
        />
      )}

      <TunerHudPill
        isEffectiveGallery={isEffectiveGallery}
        currentMetaName={currentMeta.name}
        currentMetaLabel={currentMeta.label}
        isOpen={isOpen}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
        onCycleMode={handleCycle}
        onToggleOpen={() => setIsOpen((prev) => !prev)}
        onClose={onClose}
      />
    </div>
  )
}
