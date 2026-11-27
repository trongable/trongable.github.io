import React, { useState, useEffect } from 'react'
import {
  GEOMETRY_MODES,
  DEFAULT_GEOMETRY_PARAMS,
} from '@/components/canvas/geometries/geometryConfig'
import {
  AngelContainerStyle,
  useAngelContainer,
} from '@/context/AngelContainerContext'
import {
  useDebugDistance,
  DistanceMetric,
  CoordFrame,
  CameraElevation,
} from '@/context/DebugDistanceContext'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from '@/components/gallery/galleryTunerConfig'
import {
  computeHighlightColor,
  isValidHex,
  normalizeHex,
  getContrastRatio,
} from '@/utils/colorUtils'
import { useTuner } from '@/context/TunerContext'
import { TunerProps, TunerTabId } from './tuner/tunerTypes'
import { TunerGalleryTab } from './tuner/TunerGalleryTab'
import { TunerGeometryTab } from './tuner/TunerGeometryTab'
import { TunerVfxTab } from './tuner/TunerVfxTab'

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
    showCoordinates: ctxShowCoordinates,
    toggleCoordinates: ctxToggleCoordinates,
    coordFrame: ctxCoordFrame,
    setCoordFrame: ctxSetCoordFrame,
    cameraElevation: ctxCameraElevation,
    setCameraElevation: ctxSetCameraElevation,
  } = useDebugDistance()

  const activeShowDistance = typeof showDistance === 'boolean' ? showDistance : ctxShowDistance
  const activeDistanceMetric = distanceMetric ?? ctxDistanceMetric ?? 'euclid'
  const activeShowCoords = typeof showCoordinates === 'boolean' ? showCoordinates : ctxShowCoordinates
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
      className={`fixed right-5 z-[60] flex flex-col items-end font-mono select-none transition-[bottom] duration-150 ${
        isTerminalOpen ? 'bottom-16' : 'bottom-5'
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

      {/* Floating Compact Inspection Dock when Paused (outside open drawer) */}
      {isPaused && !isOpen && (
        <div
          data-testid="compact-inspection-dock"
          className="mb-2 p-2.5 rounded-xl border border-[#10b981]/40 bg-[#1c1b22]/95 backdrop-blur-md shadow-2xl w-64 text-left pointer-events-auto"
        >
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#10b981]/20">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                Inspect Orbit
              </span>
              <span className="text-[9px] font-mono opacity-60">Paused</span>
            </div>
            <button
              type="button"
              data-testid="compact-reset-btn"
              onClick={onResetCameraAngles}
              className="text-[9px] uppercase tracking-wider text-[var(--theme-primary)] opacity-70 hover:opacity-100 cursor-pointer"
              title="Reset camera angles"
            >
              ↺ reset
            </button>
          </div>

          <div className="mb-1.5">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span className="opacity-70">Yaw</span>
              <span className="text-[var(--theme-primary)] font-bold">
                {cameraAngles?.yaw !== undefined
                  ? `${cameraAngles.yaw > 0 ? '+' : ''}${cameraAngles.yaw.toFixed(0)}°`
                  : '0°'}
              </span>
            </div>
            <input
              type="range"
              data-testid="compact-slider-yaw"
              min="-180"
              max="180"
              step="1"
              value={cameraAngles?.yaw ?? 0}
              onChange={(e) =>
                onCameraAnglesChange?.({
                  ...(cameraAngles ?? { yaw: 0, pitch: 25.07, distance: 6.017 }),
                  yaw: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
            />
          </div>

          <div className="mb-1.5">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span className="opacity-70">Pitch</span>
              <span className="text-[var(--theme-primary)] font-bold">
                {cameraAngles?.pitch !== undefined
                  ? `${cameraAngles.pitch > 0 ? '+' : ''}${cameraAngles.pitch.toFixed(0)}°`
                  : '25°'}
              </span>
            </div>
            <input
              type="range"
              data-testid="compact-slider-pitch"
              min="-85"
              max="85"
              step="1"
              value={cameraAngles?.pitch ?? 25.07}
              onChange={(e) =>
                onCameraAnglesChange?.({
                  ...(cameraAngles ?? { yaw: 0, pitch: 25.07, distance: 6.017 }),
                  pitch: parseFloat(e.target.value),
                })
              }
              className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
            />
          </div>

          <div className="flex gap-1 pt-1 text-[8px] font-mono">
            <button
              type="button"
              data-testid="compact-preset-front"
              onClick={() =>
                onCameraAnglesChange?.({
                  ...(cameraAngles ?? { distance: 6.017 }),
                  yaw: 0,
                  pitch: 0,
                  distance: cameraAngles?.distance ?? 6.0,
                })
              }
              className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
            >
              Front
            </button>
            <button
              type="button"
              data-testid="compact-preset-side"
              onClick={() =>
                onCameraAnglesChange?.({
                  ...(cameraAngles ?? { distance: 6.017 }),
                  yaw: 90,
                  pitch: 0,
                  distance: cameraAngles?.distance ?? 6.0,
                })
              }
              className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
            >
              Side
            </button>
            <button
              type="button"
              data-testid="compact-preset-top"
              onClick={() =>
                onCameraAnglesChange?.({
                  ...(cameraAngles ?? { distance: 6.017 }),
                  yaw: 0,
                  pitch: 85,
                  distance: cameraAngles?.distance ?? 6.0,
                })
              }
              className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
            >
              Top
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom-Right HUD Switcher Pill & Dedicated Pause Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="animation-pause-button"
          onClick={() => onTogglePause?.(!isPaused)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-lg backdrop-blur-md cursor-pointer transition-all active:scale-95 ${
            isPaused
              ? 'border-[#10b981] bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 font-bold'
              : 'border-[var(--theme-primary)]/40 bg-[#1c1b22]/90 text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] hover:border-[var(--theme-primary)]'
          }`}
          title={isPaused ? 'Resume animations & visual effects' : 'Pause all animations & visual effects'}
          aria-label={isPaused ? 'Resume animations and visual effects' : 'Pause all animations and visual effects'}
        >
          <span className="text-sm select-none" aria-hidden="true">
            {isPaused ? '▶' : '⏸'}
          </span>
        </button>

        <div className="flex items-center rounded-full border border-[var(--theme-primary)]/40 bg-[#1c1b22]/90 p-1 shadow-lg backdrop-blur-md">
          {isEffectiveGallery ? (
            <div
              data-testid="gallery-chamber-hud-pill"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--theme-primary)]"
            >
              <span className="opacity-60">chamber:</span>
              <span className="font-semibold">gallery</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCycle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] cursor-pointer transition-colors"
              title="Click to cycle to next 3D geometry"
              aria-label={`Current geometry: ${currentMeta.name}. Click to switch.`}
            >
              <span className="opacity-60">geo:</span>
              <span className="font-semibold">{currentMeta.label}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-[var(--theme-primary)]/30 text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] hover:border-[var(--theme-primary)] cursor-pointer transition-colors ${
              isOpen ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold' : ''
            }`}
            title="Tune live parameters"
            aria-label="Toggle parameter drawer"
          >
            ⚙
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--theme-primary)] hover:text-[#ff0055] hover:bg-[#ff0055]/10 cursor-pointer transition-colors text-xs ml-0.5"
              title="Hide HUD menu"
              aria-label="Hide tuner menu"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
