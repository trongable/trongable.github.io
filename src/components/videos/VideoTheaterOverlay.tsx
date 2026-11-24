import React, { useEffect, useCallback, useState } from 'react'
import { GalleryItem, GALLERY_DATA } from '../gallery/galleryData'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

export interface GalleryTheaterOverlayProps {
  activeVideo?: GalleryItem | null
  activeItem?: GalleryItem | null
  items?: GalleryItem[]
  onClose: () => void
  onSelectVideo?: (item: GalleryItem) => void
  onSelectItem?: (item: GalleryItem) => void
}

export type VideoTheaterOverlayProps = GalleryTheaterOverlayProps

export const GalleryTheaterOverlay: React.FC<GalleryTheaterOverlayProps> = ({
  activeVideo,
  activeItem,
  items = GALLERY_DATA,
  onClose,
  onSelectVideo,
  onSelectItem,
}) => {
  const currentItem = activeItem ?? activeVideo ?? null
  const handleSelect = onSelectItem ?? onSelectVideo ?? (() => { })

  const [isExiting, setIsExiting] = useState(false)

  const currentIndex = currentItem
    ? items.findIndex((v) => v.id === currentItem.id)
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
      handleSelect(items[currentIndex - 1])
    } else {
      handleSelect(items[items.length - 1])
    }
  }, [currentIndex, handleSelect, items])

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < items.length - 1) {
      handleSelect(items[currentIndex + 1])
    } else {
      handleSelect(items[0])
    }
  }, [currentIndex, handleSelect, items])

  // Keyboard navigation: ESC to close, Left/Right arrows to cycle media items
  useEffect(() => {
    if (!currentItem) return

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
  }, [currentItem, handleInitiateClose, handlePrev, handleNext])

  if (!currentItem) return null

  const isVideo = currentItem.type === 'video'

  return (
    <div
      data-testid="video-theater-overlay"
      className={`fixed inset-0 z-50 flex flex-col justify-between p-3 md:p-6 bg-[#0a090e]/95 backdrop-blur-md transition-all duration-200 ease-out select-none ${isExiting ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100 animate-in fade-in'
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
          aria-label="Close media player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Media Container */}
      <div
        className="relative w-full max-w-[95vw] md:max-w-[92vw] xl:max-w-[88vw] max-h-[82vh] mx-auto my-auto flex-1 flex flex-col items-center justify-center p-1 md:p-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <div className="relative w-full h-full max-h-[80vh] aspect-video rounded-lg overflow-hidden border border-[var(--theme-primary)]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-black transition-transform duration-300 scale-100">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${currentItem.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={currentItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="relative max-w-full max-h-[80vh] rounded-lg overflow-hidden border border-[var(--theme-primary)]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-[#0d0c12] transition-transform duration-300 scale-100 flex items-center justify-center">
            <img
              src={currentItem.hqImageUrl || currentItem.imageUrl}
              alt={currentItem.title}
              className="max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain select-none pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Bottom HUD Bar: Item Title & Prev/Next Controls */}
      <div
        className="w-full max-w-[95vw] md:max-w-[92vw] xl:max-w-[88vw] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono tracking-wider text-[var(--theme-primary)] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col text-center sm:text-left lowercase">
          <span className="font-serif italic font-normal text-[var(--theme-highlight)] text-base md:text-lg line-clamp-1 lowercase">
            {currentItem.title.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--theme-primary)]/30 bg-[#14131a]/80 hover:bg-[var(--theme-primary)]/15 hover:border-[var(--theme-highlight)] text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
            aria-label={isVideo ? 'Previous video' : 'Previous item'}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[11px]">prev</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--theme-primary)]/30 bg-[#14131a]/80 hover:bg-[var(--theme-primary)]/15 hover:border-[var(--theme-highlight)] text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
            aria-label={isVideo ? 'Next video' : 'Next item'}
          >
            <span className="text-[11px]">next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Retain VideoTheaterOverlay export alias for full backward compatibility
export const VideoTheaterOverlay = GalleryTheaterOverlay
