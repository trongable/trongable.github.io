import React from 'react'

interface HomeHudOverlayProps {
  isExpanded: boolean
  isTouchHovered: boolean
  isGlitching: boolean
  welcomeDisplay: string
  onExpand: () => void
  onToggleExpand: () => void
  onTouchStart: () => void
  onTouchEnd: () => void
  onTouchCancel: () => void
}

/**
 * Central "welcome" trigger button that expands the 3D topology menu and
 * displays touch-hover glyph scrambling.
 */
export const HomeHudOverlay: React.FC<HomeHudOverlayProps> = ({
  isExpanded,
  isTouchHovered,
  isGlitching,
  welcomeDisplay,
  onExpand,
  onToggleExpand,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
}) => {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
      <button
        type="button"
        data-testid="welcome-trigger"
        aria-label="Welcome menu trigger"
        onMouseEnter={onExpand}
        onTouchStart={onTouchStart}
        onTouchEnd={(e) => {
          e.preventDefault()
          onTouchEnd()
        }}
        onTouchCancel={onTouchCancel}
        onClick={(e) => {
          e.stopPropagation()
          onToggleExpand()
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
  )
}
