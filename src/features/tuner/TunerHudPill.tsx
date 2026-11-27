import React from 'react'

interface TunerHudPillProps {
  isEffectiveGallery: boolean
  currentMetaName: string
  currentMetaLabel: string
  isOpen: boolean
  isPaused: boolean
  onTogglePause?: (paused?: boolean) => void
  onCycleMode: () => void
  onToggleOpen: () => void
  onClose?: () => void
}

/**
 * Persistent bottom-right HUD pill containing the pause/resume toggle, active
 * geometry/chamber label, drawer gear button, and optional close button.
 */
export const TunerHudPill: React.FC<TunerHudPillProps> = ({
  isEffectiveGallery,
  currentMetaName,
  currentMetaLabel,
  isOpen,
  isPaused,
  onTogglePause,
  onCycleMode,
  onToggleOpen,
  onClose,
}) => (
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
          onClick={onCycleMode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] cursor-pointer transition-colors"
          title="Click to cycle to next 3D geometry"
          aria-label={`Current geometry: ${currentMetaName}. Click to switch.`}
        >
          <span className="opacity-60">geo:</span>
          <span className="font-semibold">{currentMetaLabel}</span>
        </button>
      )}

      <button
        type="button"
        onClick={onToggleOpen}
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
)
