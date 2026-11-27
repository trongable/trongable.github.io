import React, { useEffect, useCallback, useState } from 'react'
import { GalleryItem, GALLERY_DATA } from './galleryData'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { preloadAndDecodeImage, isImageDecoded } from '@/utils/imagePreload'

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
  const [hasEntered, setHasEntered] = useState(false)
  const [loadedHqUrl, setLoadedHqUrl] = useState<string | null>(null)

  const hqUrl = currentItem && currentItem.type === 'photo'
    ? (currentItem.hqImageUrl || currentItem.imageUrl)
    : null
  const isHqReady = Boolean(hqUrl && (loadedHqUrl === hqUrl || isImageDecoded(hqUrl)))

  const currentIndex = currentItem
    ? items.findIndex((v) => v.id === currentItem.id)
    : -1

  useEffect(() => {
    if (!currentItem) {
      setHasEntered(false)
      return
    }
    const raf = requestAnimationFrame(() => setHasEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [currentItem])

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

  // Pre-decode adjacent gallery items for hitch-free Prev / Next cycling
  useEffect(() => {
    if (currentIndex < 0 || items.length === 0) return

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0

    const prevItem = items[prevIndex]
    const nextItem = items[nextIndex]

    if (prevItem && prevItem.type === 'photo') {
      preloadAndDecodeImage(prevItem.hqImageUrl || prevItem.imageUrl)
    }
    if (nextItem && nextItem.type === 'photo') {
      preloadAndDecodeImage(nextItem.hqImageUrl || nextItem.imageUrl)
    }
  }, [currentIndex, items])

  if (!currentItem) return null

  const isVideo = currentItem.type === 'video'

  const aspect = currentItem.type === 'video' ? 16 / 9 : currentItem.aspectRatio
  const stageSizeStyle = {
    width: `min(90vw, ${(80 * aspect).toFixed(2)}vh)`,
    height: `min(80vh, ${(90 / aspect).toFixed(2)}vw)`,
  }
  const chromeVisibleClass = hasEntered && !isExiting ? 'opacity-100' : 'opacity-0'

  return (
    <div
      data-testid="video-theater-overlay"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0a090e]/95 transition-opacity duration-200 ease-out select-none ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleInitiateClose}
    >
      {/* Top HUD Bar */}
      <div
        className={`absolute inset-x-0 top-0 p-3 md:p-6 flex items-center justify-between text-xs font-mono tracking-widest text-[var(--theme-primary)] z-20 transition-opacity duration-200 ${chromeVisibleClass}`}
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
      </div>

      {/* Center Media Container locked 1:1 to 3D arrival bounds at exact viewport center (50vw, 50vh) */}
      <div
        data-testid="theater-media-stage"
        className="relative flex items-center justify-center p-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <div
            className="relative rounded-sm overflow-hidden border border-[var(--theme-primary)]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-black"
            style={stageSizeStyle}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${currentItem.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={currentItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div
            data-testid="theater-photo-frame"
            className="relative rounded-sm overflow-hidden border border-[var(--theme-primary)]/40 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-[#0c0b10] flex items-center justify-center"
            style={stageSizeStyle}
          >
            {/* Instant cached thumbnail matching the flat 3D panel 1:1 until full-res finishes loading */}
            {currentItem.thumbnailUrl && (
              <img
                data-testid="theater-thumbnail-placeholder"
                src={currentItem.thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none opacity-100"
              />
            )}
            {/* High-res full size image loaded asynchronously off-thread and crossfaded cleanly */}
            <img
              data-testid="theater-main-image"
              src={hqUrl!}
              alt={currentItem.title}
              decoding="async"
              loading="eager"
              onLoad={() => setLoadedHqUrl(hqUrl)}
              className={`relative w-full h-full object-contain select-none pointer-events-none z-10 transition-opacity duration-150 ${
                isHqReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}
      </div>

      {/* Bottom HUD Bar: Centered Title & Right-Aligned Prev/Next Controls */}
      <div
        className={`absolute inset-x-0 bottom-0 p-3 md:p-6 z-20 transition-opacity duration-200 ${chromeVisibleClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[90vw] mx-auto grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-mono tracking-wider text-[var(--theme-primary)]">
          <div className="hidden sm:block" aria-hidden="true" />

          <div
            data-testid="theater-title-wrapper"
            className="flex flex-col items-center text-center lowercase sm:col-start-2 sm:justify-self-center"
          >
            <span className="font-serif italic font-normal text-[var(--theme-highlight)] text-base md:text-lg line-clamp-1 lowercase">
              {currentItem.title.toLowerCase()}
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 sm:col-start-3 sm:justify-self-end">
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
    </div>
  )
}

// Retain VideoTheaterOverlay export alias for full backward compatibility
export const VideoTheaterOverlay = GalleryTheaterOverlay
