import React, { useState, useEffect } from 'react'
import {
  GeometryMode,
  GEOMETRY_MODES,
  AllGeometryParams,
  GUIDE_STYLES,
  LINE_GUIDE_STYLES,
  FACET_GUIDE_STYLES,
} from '../canvas/geometries/geometryConfig'
import { ThemeId, THEME_PALETTES, THEME_IDS } from '@/context/ThemeContext'
import { PowerMode } from '@/hooks/usePowerManager'
import {
  computeHighlightColor,
  isValidHex,
  normalizeHex,
  getContrastRatio,
} from '@/utils/colorUtils'

export interface TunerProps {
  activeMode: GeometryMode
  onModeChange: (mode: GeometryMode) => void
  params: AllGeometryParams
  onParamChange: <M extends GeometryMode, K extends keyof AllGeometryParams[M]>(
    mode: M,
    key: K,
    val: AllGeometryParams[M][K]
  ) => void
  onResetParams: (mode: GeometryMode) => void
  onClose?: () => void
  // VFX & Glitch Controls
  currentThemeId?: ThemeId
  currentThemePrimary?: string
  currentThemeHighlight?: string
  onThemeChange?: (id: ThemeId) => void
  onCustomColorChange?: (primaryHex: string) => void
  isThemeLocked?: boolean
  onToggleThemeLock?: (locked: boolean) => void
  glitchInterval?: number
  onGlitchIntervalChange?: (seconds: number) => void
  imageRate?: number
  onImageRateChange?: (rate: number) => void
  onTriggerGlitch?: () => void
  // Power & Performance Controls
  powerMode?: PowerMode
  onPowerModeChange?: (mode: PowerMode) => void
  isBattery?: boolean
  targetFps?: number | null
  targetDpr?: number | [number, number]
}

export const Tuner: React.FC<TunerProps> = ({
  activeMode,
  onModeChange,
  params,
  onParamChange,
  onResetParams,
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
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'geo' | 'vfx'>('geo')
  const [customHexInput, setCustomHexInput] = useState<string>(() => currentThemePrimary || '#e2f872')

  // Keep customHexInput in sync when theme changes externally
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
  const autoHighlightHex =
    currentThemeHighlight || computeHighlightColor(activePrimaryHex)
  const contrastRatio = getContrastRatio(autoHighlightHex, '#1c1b22')

  // Cycle to next mode
  const handleCycle = () => {
    const currentIndex = GEOMETRY_MODES.findIndex((m) => m.id === activeMode)
    const nextIndex = (currentIndex + 1) % GEOMETRY_MODES.length
    onModeChange(GEOMETRY_MODES[nextIndex].id)
  }

  const currentMeta = GEOMETRY_MODES.find((m) => m.id === activeMode) || GEOMETRY_MODES[0]

  return (
    <div
      data-testid="geometry-tuner"
      className="fixed bottom-5 right-5 z-[60] flex flex-col items-end font-mono select-none"
    >
      {/* Collapsible Tuning Drawer */}
      {isOpen && (
        <div
          data-testid="geometry-tuner-drawer"
          className="mb-3 w-84 max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--theme-primary)]/30 bg-[#1c1b22]/95 p-4 text-xs text-[var(--theme-primary)] shadow-2xl backdrop-blur-md transition-all max-h-[82vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2 mb-2.5">
            <div>
              <span className="font-bold tracking-wider uppercase text-[11px]">System Tuner</span>
              <p className="text-[10px] opacity-70 mt-0.5">
                {activeTab === 'geo' ? currentMeta.name : 'VFX & Glitch Controls'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'geo' && (
                <button
                  type="button"
                  onClick={() => onResetParams(activeMode)}
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
              3D Topologies
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
              VFX & Glitch
            </button>
          </div>

          {/* Tab 1: 3D Topologies */}
          {activeTab === 'geo' && (
            <div>
              {/* Direct Mode Selector Grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {GEOMETRY_MODES.map((mode) => {
                  const isActive = mode.id === activeMode
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onModeChange(mode.id)}
                      className={`px-1.5 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                        isActive
                          ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                          : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                      }`}
                      title={mode.name}
                    >
                      {mode.label}
                    </button>
                  )
                })}
              </div>

              {/* Mode-Specific Sliders */}
              <div className="space-y-3 pt-1">
                {activeMode === 'halo' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>speed</span>
                        <span>{params.halo.speed.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.02"
                        max="0.25"
                        step="0.005"
                        value={params.halo.speed}
                        onChange={(e) => onParamChange('halo', 'speed', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>radius scale</span>
                        <span>{params.halo.radius.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.8"
                        step="0.05"
                        value={params.halo.radius}
                        onChange={(e) => onParamChange('halo', 'radius', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>tilt / upright</span>
                        <span>{params.halo.tilt.toFixed(0)}°</span>
                      </div>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        step="1"
                        value={params.halo.tilt}
                        onChange={(e) => onParamChange('halo', 'tilt', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>yaw</span>
                        <span>{params.halo.yaw.toFixed(0)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="1"
                        value={params.halo.yaw}
                        onChange={(e) => onParamChange('halo', 'yaw', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>guide width</span>
                        <span>{params.halo.guideWidth.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.045"
                        step="0.002"
                        value={params.halo.guideWidth}
                        onChange={(e) => onParamChange('halo', 'guideWidth', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">guide style</span>
                      <div className="grid grid-cols-4 gap-1">
                        {GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('halo', 'guideStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.halo.guideStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.halo.showGuide}
                        onChange={(e) => onParamChange('halo', 'showGuide', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show guide ring</span>
                    </label>
                  </>
                )}

                {activeMode === 'trefoil' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>transit speed</span>
                        <span>{params.trefoil.speed.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.50"
                        step="0.01"
                        value={params.trefoil.speed}
                        onChange={(e) => onParamChange('trefoil', 'speed', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>knot scale</span>
                        <span>{params.trefoil.scale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.8"
                        step="0.05"
                        value={params.trefoil.scale}
                        onChange={(e) => onParamChange('trefoil', 'scale', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>tube radius</span>
                        <span>{params.trefoil.tubeRadius.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.045"
                        step="0.002"
                        value={params.trefoil.tubeRadius}
                        onChange={(e) => onParamChange('trefoil', 'tubeRadius', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">track style</span>
                      <div className="grid grid-cols-4 gap-1">
                        {GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('trefoil', 'trackStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.trefoil.trackStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.trefoil.showTrack}
                        onChange={(e) => onParamChange('trefoil', 'showTrack', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show knot track ribbon</span>
                    </label>
                  </>
                )}

                {activeMode === 'tesseract' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>4D spin speed</span>
                        <span>{params.tesseract.speed4D.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.70"
                        step="0.02"
                        value={params.tesseract.speed4D}
                        onChange={(e) => onParamChange('tesseract', 'speed4D', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>projection distance</span>
                        <span>{params.tesseract.distance.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.4"
                        max="3.2"
                        step="0.05"
                        value={params.tesseract.distance}
                        onChange={(e) => onParamChange('tesseract', 'distance', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>cube size</span>
                        <span>{params.tesseract.cubeSize.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.8"
                        step="0.05"
                        value={params.tesseract.cubeSize}
                        onChange={(e) => onParamChange('tesseract', 'cubeSize', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">wire style</span>
                      <div className="grid grid-cols-3 gap-1">
                        {LINE_GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('tesseract', 'wireStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.tesseract.wireStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.tesseract.showWires}
                        onChange={(e) => onParamChange('tesseract', 'showWires', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show wireframe lattice</span>
                    </label>
                  </>
                )}

                {activeMode === 'astrolabe' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>speed multiplier</span>
                        <span>{params.astrolabe.speed.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="2.5"
                        step="0.05"
                        value={params.astrolabe.speed}
                        onChange={(e) => onParamChange('astrolabe', 'speed', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>ring spacing</span>
                        <span>{params.astrolabe.ringSpread.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.6"
                        step="0.05"
                        value={params.astrolabe.ringSpread}
                        onChange={(e) => onParamChange('astrolabe', 'ringSpread', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>tilt spread</span>
                        <span>{params.astrolabe.tiltAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="75"
                        step="1"
                        value={params.astrolabe.tiltAngle}
                        onChange={(e) => onParamChange('astrolabe', 'tiltAngle', parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>ring width</span>
                        <span>{params.astrolabe.ringWidth.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.045"
                        step="0.002"
                        value={params.astrolabe.ringWidth}
                        onChange={(e) => onParamChange('astrolabe', 'ringWidth', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">ring style</span>
                      <div className="grid grid-cols-4 gap-1">
                        {GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('astrolabe', 'ringStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.astrolabe.ringStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.astrolabe.showRings}
                        onChange={(e) => onParamChange('astrolabe', 'showRings', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show gimbal rings</span>
                    </label>
                  </>
                )}

                {activeMode === 'lorenz' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>simulation step (dt)</span>
                        <span>{params.lorenz.speed.toFixed(4)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.003"
                        max="0.016"
                        step="0.0005"
                        value={params.lorenz.speed}
                        onChange={(e) => onParamChange('lorenz', 'speed', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>manifold scale</span>
                        <span>{params.lorenz.scale.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.03"
                        max="0.11"
                        step="0.005"
                        value={params.lorenz.scale}
                        onChange={(e) => onParamChange('lorenz', 'scale', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>Rayleigh number (rho)</span>
                        <span>{params.lorenz.rho}</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="38"
                        step="1"
                        value={params.lorenz.rho}
                        onChange={(e) => onParamChange('lorenz', 'rho', parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">trail style</span>
                      <div className="grid grid-cols-3 gap-1">
                        {LINE_GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('lorenz', 'trailStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.lorenz.trailStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.lorenz.showParticles}
                        onChange={(e) => onParamChange('lorenz', 'showParticles', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show ribbon trails</span>
                    </label>
                  </>
                )}

                {activeMode === 'origami' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>unfold bloom</span>
                        <span>{params.origami.unfold.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.0"
                        max="1.4"
                        step="0.05"
                        value={params.origami.unfold}
                        onChange={(e) => onParamChange('origami', 'unfold', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>tumble speed</span>
                        <span>{params.origami.tumbleSpeed.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.03"
                        max="0.40"
                        step="0.01"
                        value={params.origami.tumbleSpeed}
                        onChange={(e) => onParamChange('origami', 'tumbleSpeed', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>facet scale</span>
                        <span>{params.origami.facetScale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="1.6"
                        step="0.05"
                        value={params.origami.facetScale}
                        onChange={(e) => onParamChange('origami', 'facetScale', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">facet style</span>
                      <div className="grid grid-cols-3 gap-1">
                        {FACET_GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('origami', 'wireStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.origami.wireStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.origami.showWires}
                        onChange={(e) => onParamChange('origami', 'showWires', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show core wireframe</span>
                    </label>
                  </>
                )}

                {activeMode === 'slingshot' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>eccentricity (e)</span>
                        <span>{params.slingshot.eccentricity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="0.86"
                        step="0.02"
                        value={params.slingshot.eccentricity}
                        onChange={(e) => onParamChange('slingshot', 'eccentricity', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>semi-major axis</span>
                        <span>{params.slingshot.axis.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1.2"
                        max="2.8"
                        step="0.05"
                        value={params.slingshot.axis}
                        onChange={(e) => onParamChange('slingshot', 'axis', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>whip acceleration</span>
                        <span>{params.slingshot.acceleration.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="2.2"
                        step="0.05"
                        value={params.slingshot.acceleration}
                        onChange={(e) => onParamChange('slingshot', 'acceleration', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>orbit width</span>
                        <span>{params.slingshot.orbitWidth.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.045"
                        step="0.002"
                        value={params.slingshot.orbitWidth}
                        onChange={(e) => onParamChange('slingshot', 'orbitWidth', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">orbit style</span>
                      <div className="grid grid-cols-4 gap-1">
                        {GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('slingshot', 'orbitStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.slingshot.orbitStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.slingshot.showOrbits}
                        onChange={(e) => onParamChange('slingshot', 'showOrbits', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show elliptical orbits</span>
                    </label>
                  </>
                )}

                {activeMode === 'helix' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>transit speed</span>
                        <span>{params.helix.speed.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.50"
                        step="0.01"
                        value={params.helix.speed}
                        onChange={(e) => onParamChange('helix', 'speed', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>coils</span>
                        <span>{params.helix.coils}</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={params.helix.coils}
                        onChange={(e) => onParamChange('helix', 'coils', parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>torus radius</span>
                        <span>{params.helix.radius.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="2.6"
                        step="0.05"
                        value={params.helix.radius}
                        onChange={(e) => onParamChange('helix', 'radius', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span>coil width</span>
                        <span>{params.helix.coilWidth.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.005"
                        max="0.045"
                        step="0.002"
                        value={params.helix.coilWidth}
                        onChange={(e) => onParamChange('helix', 'coilWidth', parseFloat(e.target.value))}
                        className="w-full accent-[var(--theme-primary)] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">coil style</span>
                      <div className="grid grid-cols-4 gap-1">
                        {GUIDE_STYLES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => onParamChange('helix', 'coilStyle', st.id)}
                            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
                              params.helix.coilStyle === st.id
                                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={params.helix.showCoil}
                        onChange={(e) => onParamChange('helix', 'showCoil', e.target.checked)}
                        className="accent-[var(--theme-primary)]"
                      />
                      <span>show corkscrew coil</span>
                    </label>
                  </>
                )}
              </div>

              {/* Dedicated Reset Button for Active Geometry */}
              <div className="pt-2.5 border-t border-[var(--theme-primary)]/20 mt-3">
                <button
                  type="button"
                  onClick={() => onResetParams(activeMode)}
                  className="w-full py-1.5 px-3 rounded border border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)]/15 text-[11px] font-semibold cursor-pointer transition-colors text-center"
                >
                  ↺ Reset {currentMeta.name} to Defaults
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: VFX & Glitch Controls */}
          {activeTab === 'vfx' && (
            <div className="space-y-4 pt-1">
              {/* Force Theme Color */}
              <div>
                <span className="block text-[11px] font-semibold mb-1.5 opacity-90">Preset Palettes</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {THEME_IDS.map((tId) => {
                    const palette = THEME_PALETTES[tId]
                    if (!palette) return null
                    const isActive = currentThemeId === tId
                    return (
                      <button
                        key={tId}
                        type="button"
                        onClick={() => onThemeChange?.(tId)}
                        className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold shadow'
                            : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                        }`}
                        title={palette.name}
                        aria-label={palette.name}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full border border-black/40"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <span className="truncate">{tId}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Hex Color Entry & Auto-Computed Colors */}
              <div className="pt-2 border-t border-[var(--theme-primary)]/20">
                <span className="block text-[11px] font-semibold mb-1.5 opacity-90">Custom Hex Color Entry</span>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="color"
                      value={isValidHex(customHexInput) ? normalizeHex(customHexInput)! : '#e2f872'}
                      onChange={(e) => handleHexChange(e.target.value)}
                      className="w-7 h-7 rounded border border-[var(--theme-primary)]/40 cursor-pointer bg-transparent p-0 overflow-hidden"
                      aria-label="Color Picker"
                    />
                  </div>
                  <input
                    type="text"
                    value={customHexInput}
                    onChange={(e) => handleHexChange(e.target.value)}
                    placeholder="#2e6f70"
                    maxLength={7}
                    className="flex-1 px-2.5 py-1 rounded bg-[#131217] border border-[var(--theme-primary)]/40 text-[11px] font-mono text-[var(--theme-primary)] focus:outline-none focus:border-[var(--theme-primary)]"
                    aria-label="Custom Hex Input"
                  />
                  {currentThemeId === 'custom' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--theme-primary)] text-[#1c1b22]">
                      CUSTOM
                    </span>
                  )}
                </div>

                {/* Auto-Computed Affected Colors Display */}
                <div className="rounded bg-[#131217] border border-[var(--theme-primary)]/20 p-2 space-y-1.5">
                  <div className="text-[10px] font-medium opacity-75 mb-1">Computed Palette:</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-black/40 shadow-xs"
                        style={{ backgroundColor: activePrimaryHex }}
                      />
                      <span className="opacity-80">Primary:</span>
                    </div>
                    <span className="font-mono">{activePrimaryHex}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-black/40 shadow-xs"
                        style={{ backgroundColor: autoHighlightHex }}
                      />
                      <span className="opacity-80">Auto Highlight:</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>{autoHighlightHex}</span>
                      <span className="text-[9px] opacity-60">({contrastRatio}:1)</span>
                    </div>
                  </div>
                </div>

                {/* Lock Theme Toggle */}
                {onToggleThemeLock && (
                  <label className="flex items-center gap-2 cursor-pointer pt-2 text-[10px] opacity-80 hover:opacity-100">
                    <input
                      type="checkbox"
                      checked={isThemeLocked}
                      onChange={(e) => onToggleThemeLock(e.target.checked)}
                      className="accent-[var(--theme-primary)]"
                      aria-label="Lock Theme"
                    />
                    <span>Lock theme (prevent glitch mutations)</span>
                  </label>
                )}
              </div>

              {/* Glitch Frequency / Interval */}
              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>Glitch Interval</span>
                  <span>{glitchInterval}s</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={glitchInterval}
                  onChange={(e) => onGlitchIntervalChange?.(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--theme-primary)] cursor-pointer"
                  aria-label="Glitch Interval"
                />
                <span className="text-[9px] opacity-60 block mt-0.5">Interval between periodic glitches (2s–20s)</span>
              </div>

              {/* Memory Picture Rate */}
              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>Memory Picture Rate</span>
                  <span>{Math.round(imageRate * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(imageRate * 100)}
                  onChange={(e) => onImageRateChange?.(parseInt(e.target.value, 10) / 100)}
                  className="w-full accent-[var(--theme-primary)] cursor-pointer"
                  aria-label="Memory Picture Rate"
                />
                <span className="text-[9px] opacity-60 block mt-0.5">Chance of distorted memory photo during glitches</span>
              </div>

              {/* Power & Performance Manager */}
              <div className="pt-2 border-t border-[var(--theme-primary)]/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold opacity-90">Power & Performance</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--theme-primary)]/15 text-[var(--theme-primary)]">
                    {isBattery ? '🔋 Battery' : '🔌 AC Power'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {(['auto', 'eco', 'uncapped'] as PowerMode[]).map((mode) => {
                    const isActive = (powerMode || 'auto') === mode
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onPowerModeChange?.(mode)}
                        className={`py-1 px-1.5 rounded text-[10px] uppercase font-semibold transition-colors cursor-pointer text-center ${
                          isActive
                            ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold shadow'
                            : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
                        }`}
                        aria-label={`Power mode: ${mode}`}
                      >
                        {mode}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-75 font-mono px-1">
                  <span>Target: {targetFps ? `${targetFps} FPS` : 'Uncapped'}</span>
                  <span>DPR: {Array.isArray(targetDpr) ? `${targetDpr[1]}x` : `${targetDpr}x`}</span>
                </div>
              </div>

              {/* Instant Trigger Glitch Burst */}
              {onTriggerGlitch && (
                <button
                  type="button"
                  onClick={onTriggerGlitch}
                  className="w-full py-2 px-3 rounded border border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)] hover:text-[#1c1b22] text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] text-center"
                >
                  ⚡ Trigger Glitch Burst
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Persistent Bottom-Right HUD Switcher Pill */}
      <div className="flex items-center rounded-full border border-[var(--theme-primary)]/40 bg-[#1c1b22]/90 p-1 shadow-lg backdrop-blur-md">
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
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--theme-primary)] hover:text-[#ff007f] hover:bg-[#ff007f]/10 cursor-pointer transition-colors text-xs ml-0.5"
            title="Hide HUD menu (reopen via console: tuner())"
            aria-label="Hide tuner menu"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
