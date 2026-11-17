import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from '../routes/Router'
import { useTheme } from '../context/ThemeContext'
import { SceneContainer } from '../components/canvas/SceneContainer'
import { GpuGlitchOverlay } from '../components/effects/GpuGlitchOverlay'
import { GeometryDispatcher } from '../components/canvas/geometries/GeometryDispatcher'
import { GeometryTuner } from '../components/ui/GeometryTuner'
import {
  GeometryMode,
  AllGeometryParams,
  DEFAULT_GEOMETRY_PARAMS,
  DEFAULT_GEOMETRY_MODE,
  isValidGeometryMode,
  GEOMETRY_MODES,
} from '../components/canvas/geometries/geometryConfig'
import { scrambleGlyphs } from '../utils/glyphUtils'

export const HomePage: React.FC = () => {
  const { navigate, queryParams } = useRouter()
  const { currentTheme, randomizeTheme } = useTheme()
  const randomizeRef = useRef(randomizeTheme)
  randomizeRef.current = randomizeTheme

  // Active geometry mode (defaults to 'tesseract' if not specified or invalid)
  const activeGeoMode: GeometryMode = isValidGeometryMode(queryParams.geo)
    ? queryParams.geo
    : DEFAULT_GEOMETRY_MODE

  const isTunerParam =
    queryParams.tuner === 'true' ||
    queryParams.tuner === '1' ||
    queryParams.debug === 'true'

  const [isTunerVisible, setIsTunerVisible] = useState<boolean>(() => {
    if (isTunerParam) return true
    if (typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem('antigravity_tuner_visible') === 'true'
      } catch {
        return false
      }
    }
    return false
  })

  const [geometryParams, setGeometryParams] = useState<AllGeometryParams>(DEFAULT_GEOMETRY_PARAMS)

  const handleModeChange = (newMode: GeometryMode) => {
    // Synchronize via browser history / query params
    const params = new URLSearchParams(window.location.search)
    if (newMode === DEFAULT_GEOMETRY_MODE) {
      params.delete('geo')
    } else {
      params.set('geo', newMode)
    }
    const queryString = params.toString()
    const targetPath = queryString ? `/?${queryString}` : '/'
    navigate(targetPath)
  }

  const handleParamChange = <M extends GeometryMode, K extends keyof AllGeometryParams[M]>(
    mode: M,
    key: K,
    val: AllGeometryParams[M][K]
  ) => {
    setGeometryParams((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: val,
      },
    }))
  }

  const handleResetParams = (mode: GeometryMode) => {
    setGeometryParams((prev) => ({
      ...prev,
      [mode]: { ...DEFAULT_GEOMETRY_PARAMS[mode] },
    }))
  }

  // Detect query param to auto-expand halo: ?halo=true, ?halo=1, ?expanded=true, etc.
  const isHaloParam =
    queryParams.halo === 'true' ||
    queryParams.halo === '1' ||
    queryParams.expanded === 'true' ||
    queryParams.expanded === '1'

  const [isExpanded, setIsExpanded] = useState<boolean>(() => isHaloParam)
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchDuration, setGlitchDuration] = useState(360)
  const [isTouchHovered, setIsTouchHovered] = useState(false)
  const [welcomeDisplay, setWelcomeDisplay] = useState('welcome')

  // Scramble glyphs while touch-hovered (press-and-hold tactile feedback on mobile)
  useEffect(() => {
    if (!isTouchHovered) {
      setWelcomeDisplay('welcome')
      return
    }

    const interval = window.setInterval(() => {
      setWelcomeDisplay(scrambleGlyphs('welcome', Math.random() < 0.35 ? 2 : 1))
    }, 85)

    return () => window.clearInterval(interval)
  }, [isTouchHovered])

  // Synchronize if query params change
  useEffect(() => {
    if (isHaloParam) {
      setIsExpanded(true)
    }
  }, [isHaloParam])

  // Periodic fullscreen GPU artifact glitch every 4–15 seconds (randomized), lasting 400ms to 3,000ms (3s)
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) return

    let timerId: number
    let resetId: number

    const triggerGlitch = () => {
      // Random interval between 4000ms and 15000ms
      const nextInterval = 4000 + Math.random() * 11000
      timerId = window.setTimeout(() => {
        // Glitch duration randomized up to 3.0 seconds (400ms to 3000ms)
        const burstDuration = 400 + Math.random() * 2600
        setGlitchDuration(burstDuration)
        setIsGlitching(true)
        resetId = window.setTimeout(() => {
          setIsGlitching(false)
          // Mutate to a new random neon color right after the glitch resolves
          randomizeRef.current()
          triggerGlitch()
        }, burstDuration)
      }, nextInterval)
    }

    triggerGlitch()

    return () => {
      window.clearTimeout(timerId)
      window.clearTimeout(resetId)
    }
  }, [])

  const handleSelect = (path: string) => {
    navigate(path)
  }

  // Allow Escape key to collapse the halo and bring back "welcome"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false)
        setIsTouchHovered(false)
        setWelcomeDisplay('welcome')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Secret Console Commands: unlock and toggle the geometry tuner
  useEffect(() => {
    const toggleTuner = (show?: boolean) => {
      setIsTunerVisible((prev) => {
        const next = typeof show === 'boolean' ? show : !prev
        try {
          if (next) {
            window.localStorage.setItem('antigravity_tuner_visible', 'true')
          } else {
            window.localStorage.removeItem('antigravity_tuner_visible')
          }
        } catch {
          // ignore localStorage errors
        }
        if (next) {
          console.log(
            '%c[TOPOLOGY TUNER] UNLOCKED',
            'color: #39ff14; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'
          )
          console.log(
            'Animation menu is now visible in the bottom-right HUD.\nCommands:\n  tuner()        - Toggle visibility\n  setGeo(mode)   - Switch topology\n  geoList()      - List all topologies\n  hideTuner()    - Hide HUD tuner'
          )
        } else {
          console.log(
            '%c[TOPOLOGY TUNER] HIDDEN',
            'color: #ff007f; font-weight: bold; background: #1c1b22; padding: 2px 6px; border-radius: 4px;'
          )
        }
        return next
      })
    }

    const setGeo = (mode: string) => {
      if (isValidGeometryMode(mode)) {
        handleModeChange(mode)
        console.log(`%c[TOPOLOGY] Switched to '${mode}'`, 'color: #39ff14')
      } else {
        console.warn(`[TOPOLOGY] Invalid mode '${mode}'. Available:`, GEOMETRY_MODES.map((m) => m.id))
      }
    }

    const geoList = () => {
      console.table(GEOMETRY_MODES.map((m) => ({ id: m.id, name: m.name, description: m.description })))
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    win.tuner = toggleTuner
    win.showTuner = () => toggleTuner(true)
    win.hideTuner = () => toggleTuner(false)
    win.setGeo = setGeo
    win.geoList = geoList

    return () => {
      delete win.tuner
      delete win.showTuner
      delete win.hideTuner
      delete win.setGeo
      delete win.geoList
    }
  }, [handleModeChange])

  return (
    <main
      className="relative w-full h-full min-h-dvh overflow-hidden bg-[#1c1b22] flex items-center justify-center select-none"
      onClick={() => {
        if (isExpanded) {
          setIsExpanded(false)
          setIsTouchHovered(false)
          setWelcomeDisplay('welcome')
        }
      }}
    >
      {/* Fullscreen Random "Graphics Card Dying" Artifact Glitch Overlay */}
      <GpuGlitchOverlay
        isActive={isGlitching}
        duration={glitchDuration}
        primaryColor={currentTheme.primary}
      />

      {/* 3D Canvas Background & Geometry Animation */}
      <SceneContainer isGlitching={isGlitching} theme={currentTheme}>
        <GeometryDispatcher
          mode={activeGeoMode}
          params={geometryParams}
          isExpanded={isExpanded}
          onSelect={handleSelect}
          isGlitching={isGlitching}
          theme={currentTheme}
        />
      </SceneContainer>

      {/* Accessibility screen-reader navigation links */}
      <nav className="sr-only" aria-label="Direct Destinations">
        <button onClick={() => handleSelect('/about')}>about</button>
        <button onClick={() => handleSelect('/more')}>more</button>
        <a href="https://dc-hardcore.com" target="_blank" rel="noopener noreferrer">dchc</a>
      </nav>

      {/* Central "welcome" text - shrinks and disappears when halo appears */}
      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
        <button
          type="button"
          data-testid="welcome-trigger"
          aria-label="Welcome menu trigger"
          onMouseEnter={() => setIsExpanded(true)}
          onTouchStart={() => {
            setIsTouchHovered(true)
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            setIsTouchHovered(false)
            setWelcomeDisplay('welcome')
            setIsExpanded(true)
          }}
          onTouchCancel={() => {
            setIsTouchHovered(false)
            setWelcomeDisplay('welcome')
          }}
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded((prev) => !prev)
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

      {/* Bottom-Right HUD Geometry Switcher & Parameter Tuner (Secret: unlock via `tuner()` in console) */}
      {isTunerVisible && (
        <GeometryTuner
          activeMode={activeGeoMode}
          onModeChange={handleModeChange}
          params={geometryParams}
          onParamChange={handleParamChange}
          onResetParams={handleResetParams}
          onClose={() => {
            setIsTunerVisible(false)
            try {
              window.localStorage.removeItem('antigravity_tuner_visible')
            } catch {
              // ignore localStorage errors
            }
          }}
        />
      )}
    </main>
  )
}
