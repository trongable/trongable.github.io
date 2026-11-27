import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from '../routes/Router'
import { useTuner } from '../context/TunerContext'
import { useTheme } from '../context/ThemeContext'
import { usePowerManager } from '../hooks/usePowerManager'
import { CerebroChamber } from '@/components/gallery/CerebroChamber'
import { GalleryTheaterOverlay } from '@/components/gallery/GalleryTheaterOverlay'
import {
  GalleryItem,
  GALLERY_DATA,
  layoutGalleryTiers,
  randomizeGallery,
} from '../components/gallery/galleryData'
import {
  GalleryChamberParams,
  DEFAULT_GALLERY_CHAMBER_PARAMS,
} from '../components/gallery/galleryTunerConfig'
import { Tuner } from '../components/ui/Tuner'
import { preloadAndDecodeImage } from '@/utils/imagePreload'

export const GalleryPage: React.FC = () => {
  const { navigate, queryParams } = useRouter()
  const { isTunerVisible, setIsTunerVisible } = useTuner()
  const { currentTheme, setTheme, setCustomColor, isThemeLocked, setIsThemeLocked } = useTheme()
  const { isBattery, powerMode, setPowerMode, targetFps, targetDpr } = usePowerManager()

  // Randomize gallery items once on page load, or preserve canonical order if random=false is present
  const [baseGalleryItems] = useState<GalleryItem[]>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('random=false')) {
      return GALLERY_DATA
    }
    return randomizeGallery(GALLERY_DATA)
  })

  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null)
  const [galleryParams, setGalleryParams] = useState<GalleryChamberParams>(DEFAULT_GALLERY_CHAMBER_PARAMS)

  const galleryItems = useMemo(
    () =>
      layoutGalleryTiers(
        baseGalleryItems,
        galleryParams.tierCount,
        galleryParams.arcDegrees,
        galleryParams.sphereRadius,
        galleryParams.rowSeparation
      ),
    [
      baseGalleryItems,
      galleryParams.tierCount,
      galleryParams.arcDegrees,
      galleryParams.sphereRadius,
      galleryParams.rowSeparation,
    ]
  )
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  const transitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with URL query parameter ?item=<id> or ?v=<id> if present on initial load
  useEffect(() => {
    const targetId = queryParams?.item || queryParams?.v
    if (targetId) {
      const match = galleryItems.find((item) => item.id === targetId || item.youtubeId === targetId)
      if (match) {
        setSelectedItem(match)
        setActiveItem(match)
      }
    }
  }, [queryParams, galleryItems])

  // Clean up any pending transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitTimerRef.current) clearTimeout(transitTimerRef.current)
    }
  }, [])

  // Two-stage fly-in: card visibly glides to center (340ms) while background fades, then focused theater expands
  const handleSelectItem = (item: GalleryItem) => {
    setSelectedItem(item)
    // Pre-decode high-res image off-thread immediately so it is in memory before the 340ms flight concludes
    if (item.type === 'photo') {
      preloadAndDecodeImage(item.hqImageUrl || item.imageUrl)
    }
    if (transitTimerRef.current) clearTimeout(transitTimerRef.current)
    transitTimerRef.current = setTimeout(() => {
      setActiveItem(item)
    }, 340)
  }

  // Hitch-free exit: overlay dissolves first, then card smoothly flies from center back to wall slot fading in from darkness
  const handleCloseTheater = () => {
    setActiveItem(null)
    if (transitTimerRef.current) clearTimeout(transitTimerRef.current)
    setSelectedItem(null)
  }

  const handleGalleryParamChange = <K extends keyof GalleryChamberParams>(
    key: K,
    val: GalleryChamberParams[K]
  ) => {
    setGalleryParams((prev) => ({ ...prev, [key]: val }))
  }

  const handleResetGalleryParams = () => {
    setGalleryParams(DEFAULT_GALLERY_CHAMBER_PARAMS)
  }

  return (
    <main
      data-testid="gallery-page"
      className="relative w-full h-full min-h-dvh bg-[#0c0b10] text-[var(--theme-primary)] flex flex-col overflow-hidden overscroll-none select-none lowercase"
    >
      {/* Minimalist Return Home Link matching other shell pages */}
      <button
        onClick={() => navigate('/?expanded=true')}
        className="fixed top-6 left-6 font-mono text-xs tracking-widest lowercase text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer z-40"
        aria-label="Return home"
      >
        ← home
      </button>

      {/* 3D Spherical Chamber */}
      <div className="flex-1 w-full h-full">
        <CerebroChamber
          items={galleryItems}
          activeItem={activeItem}
          selectedItem={selectedItem}
          params={galleryParams}
          onSelectItem={handleSelectItem}
        />
      </div>

      {/* Screen Reader Accessibility Navigation */}
      <nav className="sr-only absolute bottom-0 left-0" aria-label="Available Gallery Items">
        {galleryItems.map((item) => (
          <button
            key={item.id}
            data-testid={`gallery-nav-btn-${item.id}`}
            onClick={() => handleSelectItem(item)}
          >
            {item.type === 'video' ? `Play ${item.title}` : `View ${item.title}`}
          </button>
        ))}
      </nav>

      {/* Full Cinematic Theater Mode Takeover */}
      <GalleryTheaterOverlay
        items={galleryItems}
        activeItem={activeItem}
        onClose={handleCloseTheater}
        onSelectItem={(item) => {
          setSelectedItem(item)
          setActiveItem(item)
        }}
      />

      {/* Developer System Tuner HUD */}
      {isTunerVisible && (
        <Tuner
          isGalleryPage={true}
          videoParams={galleryParams}
          onVideoParamChange={handleGalleryParamChange}
          onResetVideoParams={handleResetGalleryParams}
          currentThemeId={currentTheme.id}
          currentThemePrimary={currentTheme.primary}
          currentThemeHighlight={currentTheme.highlight}
          onThemeChange={setTheme}
          onCustomColorChange={setCustomColor}
          isThemeLocked={isThemeLocked}
          onToggleThemeLock={setIsThemeLocked}
          powerMode={powerMode}
          onPowerModeChange={setPowerMode}
          isBattery={isBattery}
          targetFps={targetFps}
          targetDpr={targetDpr}
          isPaused={isAnimationPaused}
          onTogglePause={(paused) =>
            setIsAnimationPaused(typeof paused === 'boolean' ? paused : !isAnimationPaused)
          }
          onClose={() => setIsTunerVisible(false)}
        />
      )}
    </main>
  )
}
