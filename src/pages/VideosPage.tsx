import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '../routes/Router'
import { useTuner } from '../context/TunerContext'
import { useTheme } from '../context/ThemeContext'
import { usePowerManager } from '../hooks/usePowerManager'
import { CerebroChamber } from '../components/videos/CerebroChamber'
import { VideoTheaterOverlay } from '../components/videos/VideoTheaterOverlay'
import { VideoItem, VIDEOS_DATA } from '../components/videos/videoData'
import {
  VideoChamberParams,
  DEFAULT_VIDEO_CHAMBER_PARAMS,
} from '../components/videos/videoTunerConfig'
import { Tuner } from '../components/ui/Tuner'

export const VideosPage: React.FC = () => {
  const { navigate, queryParams } = useRouter()
  const { isTunerVisible, setIsTunerVisible } = useTuner()
  const { currentTheme, setTheme, setCustomColor, isThemeLocked, setIsThemeLocked } = useTheme()
  const { isBattery, powerMode, setPowerMode, targetFps, targetDpr } = usePowerManager()

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)
  const [videoParams, setVideoParams] = useState<VideoChamberParams>(DEFAULT_VIDEO_CHAMBER_PARAMS)
  const [isAnimationPaused, setIsAnimationPaused] = useState(false)
  const transitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with URL query parameter ?v=<id> if present on initial load
  useEffect(() => {
    if (queryParams?.v) {
      const match = VIDEOS_DATA.find((v) => v.id === queryParams.v || v.youtubeId === queryParams.v)
      if (match) {
        setSelectedVideo(match)
        setActiveVideo(match)
      }
    }
  }, [queryParams])

  // Clean up any pending transition timer on unmount
  useEffect(() => {
    return () => {
      if (transitTimerRef.current) clearTimeout(transitTimerRef.current)
    }
  }, [])

  // Two-stage fly-in: thumbnail visibly glides to center (340ms) while background fades, then video player expands
  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video)
    if (transitTimerRef.current) clearTimeout(transitTimerRef.current)
    transitTimerRef.current = setTimeout(() => {
      setActiveVideo(video)
    }, 340)
  }

  // Hitch-free exit: overlay dissolves first, then card smoothly flies from center back to wall slot fading in from darkness
  const handleCloseTheater = () => {
    setActiveVideo(null)
    if (transitTimerRef.current) clearTimeout(transitTimerRef.current)
    setSelectedVideo(null)
  }

  const handleVideoParamChange = <K extends keyof VideoChamberParams>(
    key: K,
    val: VideoChamberParams[K]
  ) => {
    setVideoParams((prev) => ({ ...prev, [key]: val }))
  }

  const handleResetVideoParams = () => {
    setVideoParams(DEFAULT_VIDEO_CHAMBER_PARAMS)
  }

  return (
    <main
      data-testid="videos-page"
      className="relative w-full h-full min-h-dvh bg-[#0c0b10] text-[var(--theme-primary)] flex flex-col overflow-hidden select-none lowercase"
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
          activeVideo={activeVideo}
          selectedVideo={selectedVideo}
          params={videoParams}
          onSelectVideo={handleSelectVideo}
        />
      </div>

      {/* Screen Reader Accessibility Navigation */}
      <nav className="sr-only absolute bottom-0 left-0" aria-label="Available Videos">
        {VIDEOS_DATA.map((video) => (
          <button
            key={video.id}
            onClick={() => handleSelectVideo(video)}
          >
            Play {video.title}
          </button>
        ))}
      </nav>

      {/* Full Cinematic Theater Mode Takeover */}
      <VideoTheaterOverlay
        activeVideo={activeVideo}
        onClose={handleCloseTheater}
        onSelectVideo={(video) => {
          setSelectedVideo(video)
          setActiveVideo(video)
        }}
      />

      {/* Developer System Tuner HUD (toggleable via cyber terminal "tuner enable" / "tuner disable") */}
      {isTunerVisible && (
        <Tuner
          isVideosPage={true}
          videoParams={videoParams}
          onVideoParamChange={handleVideoParamChange}
          onResetVideoParams={handleResetVideoParams}
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
