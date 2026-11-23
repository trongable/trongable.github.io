import React, { useEffect, useCallback, useState } from 'react'
import { VideoItem, VIDEOS_DATA } from './videoData'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

export interface VideoTheaterOverlayProps {
  activeVideo: VideoItem | null
  onClose: () => void
  onSelectVideo: (video: VideoItem) => void
}

export const VideoTheaterOverlay: React.FC<VideoTheaterOverlayProps> = ({
  activeVideo,
  onClose,
  onSelectVideo,
}) => {
  const [isExiting, setIsExiting] = useState(false)

  const currentIndex = activeVideo
    ? VIDEOS_DATA.findIndex((v) => v.id === activeVideo.id)
    : -1

  // Hitch-free closing transition: smoothly dissolves overlay before invoking unmount
  const handleInitiateClose = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => {
      setIsExiting(false)
      onClose()
    }, 180)
  }, [isExiting, onClose])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onSelectVideo(VIDEOS_DATA[currentIndex - 1])
    } else {
      onSelectVideo(VIDEOS_DATA[VIDEOS_DATA.length - 1])
    }
  }, [currentIndex, onSelectVideo])

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < VIDEOS_DATA.length - 1) {
      onSelectVideo(VIDEOS_DATA[currentIndex + 1])
    } else {
      onSelectVideo(VIDEOS_DATA[0])
    }
  }, [currentIndex, onSelectVideo])

  // Keyboard navigation: ESC to close, Left/Right arrows to cycle videos
  useEffect(() => {
    if (!activeVideo) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleInitiateClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeVideo, handleInitiateClose, handlePrev, handleNext])

  if (!activeVideo) return null

  return (
    <div
      data-testid="video-theater-overlay"
      className={`fixed inset-0 z-50 flex flex-col justify-between p-3 md:p-6 bg-[#0a090e]/95 backdrop-blur-md transition-all duration-200 ease-out select-none ${
        isExiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100 animate-in fade-in'
      }`}
      onClick={handleInitiateClose}
    >
      {/* Top HUD Bar */}
      <div
        className="w-full flex items-center justify-between text-xs font-mono tracking-widest text-[var(--theme-primary)] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleInitiateClose}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded border border-[var(--theme-primary)]/30 bg-[#14131a]/80 hover:bg-[var(--theme-primary)]/15 hover:border-[var(--theme-highlight)] text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
          aria-label="Return to chamber"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>return</span>
          <span className="hidden md:inline text-[var(--theme-primary)]/50 ml-1">[esc]</span>
        </button>

        <button
          onClick={handleInitiateClose}
          className="p-1.5 rounded border border-[var(--theme-primary)]/30 bg-[#14131a]/80 hover:bg-[#ff0055]/20 hover:border-[#ff0055]/60 hover:text-[#ff0055] transition-colors cursor-pointer"
          aria-label="Close video player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Cinema Container: Maximized screen real estate */}
      <div
        className="relative w-full max-w-[95vw] md:max-w-[92vw] xl:max-w-[88vw] max-h-[85vh] mx-auto my-auto flex-1 flex flex-col items-center justify-center p-1 md:p-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-h-[82vh] aspect-video rounded-lg overflow-hidden border border-[var(--theme-primary)]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-black transition-transform duration-300 scale-100">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Bottom HUD Bar: Video Title & Prev/Next Controls */}
      <div
        className="w-full max-w-[95vw] md:max-w-[92vw] xl:max-w-[88vw] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono tracking-wider text-[var(--theme-primary)] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col text-center sm:text-left">
          <span className="font-semibold text-[var(--theme-highlight)] text-sm md:text-base line-clamp-1">
            {activeVideo.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--theme-primary)]/30 bg-[#14131a]/80 hover:bg-[var(--theme-primary)]/15 hover:border-[var(--theme-highlight)] text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
            aria-label="Previous video"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[11px]">prev</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--theme-primary)]/30 bg-[#14131a]/80 hover:bg-[var(--theme-primary)]/15 hover:border-[var(--theme-highlight)] text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
            aria-label="Next video"
          >
            <span className="text-[11px]">next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
