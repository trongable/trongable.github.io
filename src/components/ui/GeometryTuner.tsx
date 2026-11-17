import React, { useState } from 'react'
import {
  GeometryMode,
  GEOMETRY_MODES,
  AllGeometryParams,
} from '../canvas/geometries/geometryConfig'

export interface GeometryTunerProps {
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
}

export const GeometryTuner: React.FC<GeometryTunerProps> = ({
  activeMode,
  onModeChange,
  params,
  onParamChange,
  onResetParams,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false)

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
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end font-mono select-none"
    >
      {/* Collapsible Tuning Drawer */}
      {isOpen && (
        <div
          data-testid="geometry-tuner-drawer"
          className="mb-3 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--theme-primary)]/30 bg-[#1c1b22]/95 p-4 text-xs text-[var(--theme-primary)] shadow-2xl backdrop-blur-md transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--theme-primary)]/20 pb-2 mb-3">
            <div>
              <span className="font-bold tracking-wider">{currentMeta.name}</span>
              <p className="text-[10px] opacity-70 mt-0.5">{currentMeta.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onResetParams(activeMode)}
                className="text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-[var(--theme-highlight)] cursor-pointer"
                title="Reset to default parameters"
              >
                reset
              </button>
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
                    min="0.6"
                    max="1.6"
                    step="0.05"
                    value={params.origami.facetScale}
                    onChange={(e) => onParamChange('origami', 'facetScale', parseFloat(e.target.value))}
                    className="w-full accent-[var(--theme-primary)] cursor-pointer"
                  />
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
