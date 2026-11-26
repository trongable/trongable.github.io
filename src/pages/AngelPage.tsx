import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from '@/routes/Router'
import { useTheme } from '@/context/ThemeContext'
import { usePowerManager } from '@/hooks/usePowerManager'
import { useTuner } from '@/context/TunerContext'
import { Tuner } from '@/components/ui/Tuner'
import {
  ANGEL_AVATAR_STORAGE_KEY,
  AngelAvatarConfig,
  DEFAULT_ANGEL_CONFIG,
  decodeAngelConfig,
  encodeAngelConfig,
  randomizeAngelConfig,
} from '@/components/angel/angelCatalog'
import {
  AngelStudioCanvas,
  CameraFocusPreset,
} from '@/components/angel/AngelStudioCanvas'
import { AngelCustomizerPanel } from '@/components/angel/AngelCustomizerPanel'

export const AngelPage: React.FC = () => {
  const { navigate, queryParams } = useRouter()
  const { currentTheme, setTheme, setCustomColor, isThemeLocked, setIsThemeLocked } = useTheme()
  const { isBattery, powerMode, setPowerMode, targetFps, targetDpr, isSleeping } =
    usePowerManager()
  const { isTunerVisible, setIsTunerVisible } = useTuner()

  const isPaused = queryParams?.paused === 'true'
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [config, setConfig] = useState<AngelAvatarConfig>(() => {
    const fromUrl = decodeAngelConfig(queryParams?.a)
    if (fromUrl) return fromUrl
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(ANGEL_AVATAR_STORAGE_KEY)
        const parsed = decodeAngelConfig(stored)
        if (parsed) return parsed
      } catch {
        // Ignore storage errors
      }
    }
    return DEFAULT_ANGEL_CONFIG
  })

  const [focusPreset, setFocusPreset] = useState<CameraFocusPreset>('full')
  const [isTurntableActive, setIsTurntableActive] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(ANGEL_AVATAR_STORAGE_KEY, encodeAngelConfig(config))
    } catch {
      // Ignore storage errors
    }
  }, [config])

  const handleCopyLink = useCallback(() => {
    const encoded = encodeAngelConfig(config)
    const shareUrl = `${window.location.origin}/#/angel?a=${encoded}`
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
    }
    window.location.hash = `#/angel?a=${encoded}`
    setCopiedLink(true)
    window.setTimeout(() => setCopiedLink(false), 1800)
  }, [config])

  const handleSavePng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'angel-builder.png'
    link.href = dataUrl
    link.click()
  }, [])

  return (
    <main
      data-testid="angel-page"
      className="relative w-full h-dvh min-h-dvh bg-[#1c1b22] overflow-hidden select-none overscroll-none"
    >
      {/* Top-Left Navigation & Title */}
      <div className="fixed top-6 left-6 z-40 flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/?expanded=true')}
          className="font-mono text-xs tracking-widest lowercase text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
          aria-label="Return home"
        >
          ← home
        </button>
        <h1 className="font-mono text-xs tracking-widest lowercase text-[var(--theme-primary)]/80">
          angel builder
        </h1>
      </div>

      {/* 3D Viewport */}
      <div className="w-full h-full md:pr-80">
        <AngelStudioCanvas
          config={config}
          primaryColorHex={currentTheme.primary}
          highlightColorHex={currentTheme.highlight}
          focusPreset={focusPreset}
          isTurntableActive={isTurntableActive}
          isPaused={isPaused}
          isSleeping={isSleeping}
          targetFps={targetFps}
          targetDpr={targetDpr}
          canvasRef={canvasRef}
        />
      </div>

      {/* Customizer HUD */}
      <AngelCustomizerPanel
        config={config}
        onChange={setConfig}
        onReset={() => setConfig(DEFAULT_ANGEL_CONFIG)}
        onRandomize={() => setConfig((prev) => randomizeAngelConfig(prev.containerStyle))}
        onCopyLink={handleCopyLink}
        onSavePng={handleSavePng}
        copiedLink={copiedLink}
        focusPreset={focusPreset}
        onFocusChange={setFocusPreset}
        isTurntableActive={isTurntableActive}
        onToggleTurntable={() => setIsTurntableActive((prev) => !prev)}
      />

      {/* Global Tuner HUD (z-[60]) */}
      {isTunerVisible && (
        <Tuner
          onClose={() => setIsTunerVisible(false)}
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
        />
      )}
    </main>
  )
}
