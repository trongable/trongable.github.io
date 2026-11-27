import React from 'react'
import { ThemeId, THEME_PALETTES, THEME_IDS } from '@/context/ThemeContext'
import type { PowerMode } from '@/hooks/usePowerManager'
import { isValidHex, normalizeHex } from '@/utils/colorUtils'

interface TunerVfxTabProps {
  currentThemeId: ThemeId
  onThemeChange?: (id: ThemeId) => void
  customHexInput: string
  onHexChange: (val: string) => void
  activePrimaryHex: string
  autoHighlightHex: string
  contrastRatio: number
  isThemeLocked: boolean
  onToggleThemeLock?: (locked: boolean) => void
  glitchInterval: number
  onGlitchIntervalChange?: (seconds: number) => void
  imageRate: number
  onImageRateChange?: (rate: number) => void
  powerMode: PowerMode
  onPowerModeChange?: (mode: PowerMode) => void
  isBattery: boolean
  targetFps: number | null
  targetDpr: number | [number, number]
  isPaused: boolean
  onTogglePause?: (paused?: boolean) => void
  onTriggerGlitch?: () => void
}

/**
 * VFX & Glitch tab: theme presets, custom hex + WCAG contrast readout,
 * glitch timing, power mode governor, and animation engine pause/resume.
 */
export const TunerVfxTab: React.FC<TunerVfxTabProps> = ({
  currentThemeId,
  onThemeChange,
  customHexInput,
  onHexChange,
  activePrimaryHex,
  autoHighlightHex,
  contrastRatio,
  isThemeLocked,
  onToggleThemeLock,
  glitchInterval,
  onGlitchIntervalChange,
  imageRate,
  onImageRateChange,
  powerMode,
  onPowerModeChange,
  isBattery,
  targetFps,
  targetDpr,
  isPaused,
  onTogglePause,
  onTriggerGlitch,
}) => {
  return (
    <div className="space-y-4 pt-1">
      {/* Preset Palettes */}
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
              onChange={(e) => onHexChange(e.target.value)}
              className="w-7 h-7 rounded border border-[var(--theme-primary)]/40 cursor-pointer bg-transparent p-0 overflow-hidden"
              aria-label="Color Picker"
            />
          </div>
          <input
            type="text"
            value={customHexInput}
            onChange={(e) => onHexChange(e.target.value)}
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
        <span className="text-[9px] opacity-60 block mt-0.5">
          Interval between periodic glitches (2s–20s)
        </span>
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
        <span className="text-[9px] opacity-60 block mt-0.5">
          Chance of distorted memory photo during glitches
        </span>
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

      {/* Animation Engine Pause/Resume */}
      <div className="pt-2 border-t border-[var(--theme-primary)]/20">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <span className="text-[11px] font-semibold opacity-90">Animation Engine</span>
            <span className="block text-[9px] opacity-60">Freeze 3D canvas & all visual effects</span>
          </div>
          <button
            type="button"
            data-testid="toggle-pause-drawer"
            onClick={() => onTogglePause?.(!isPaused)}
            className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
              isPaused
                ? 'bg-[#10b981] text-white font-bold shadow'
                : 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold shadow'
            }`}
            title={isPaused ? 'Resume animations & visual effects' : 'Pause animations & visual effects'}
          >
            {isPaused ? 'PAUSED (FROZEN)' : 'RUNNING (LIVE)'}
          </button>
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
  )
}
