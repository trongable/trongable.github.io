import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HomePage } from '../HomePage'
import { RouterProvider } from '../../routes/Router'
import { ThemeProvider } from '../../context/ThemeContext'
import { SonnyContainerProvider } from '../../context/SonnyContainerContext'
import { DebugDistanceProvider } from '../../context/DebugDistanceContext'

// Mock 3D SceneContainer in jsdom test environment
vi.mock('../../components/canvas/SceneContainer', () => ({
  SceneContainer: ({
    children,
    onBackgroundClick,
    isPaused,
    cameraElevation,
    cameraAngles,
  }: {
    children: React.ReactNode
    onBackgroundClick?: () => void
    isPaused?: boolean
    cameraElevation?: string
    cameraAngles?: { yaw: number; pitch: number; distance: number }
  }) => (
    <div
      data-testid="mock-scene-container"
      data-paused={isPaused ? 'true' : 'false'}
      data-camera-elevation={cameraElevation || 'elevated'}
      data-camera-yaw={cameraAngles?.yaw}
      data-camera-pitch={cameraAngles?.pitch}
      data-camera-dist={cameraAngles?.distance}
      onClick={onBackgroundClick}
    >
      {children}
    </div>
  ),
}))

// Mock HaloMenuRing inside SceneContainer
vi.mock('../../components/canvas/HaloMenuRing', () => ({
  HaloMenuRing: ({ isExpanded }: { isExpanded: boolean }) => (
    <div data-testid="mock-halo-ring" data-expanded={isExpanded} />
  ),
}))

// Mock GeometryDispatcher in jsdom test environment
vi.mock('../../components/canvas/geometries/GeometryDispatcher', () => ({
  GeometryDispatcher: ({
    mode,
    isExpanded,
    isPaused,
  }: {
    mode: string
    isExpanded: boolean
    isPaused?: boolean
  }) => (
    <div
      data-testid="mock-geometry-dispatcher"
      data-mode={mode}
      data-expanded={isExpanded}
      data-paused={isPaused ? 'true' : 'false'}
    >
      <div data-testid="mock-halo-ring" data-expanded={isExpanded} />
    </div>
  ),
}))

describe('HomePage Component', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the unpretentious "welcome" prompt initially', () => {
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const welcomeButton = screen.getByTestId('welcome-trigger')
    expect(welcomeButton).toBeInTheDocument()
    expect(welcomeButton).toHaveTextContent('welcome')
    expect(welcomeButton.className).toContain('scale-100')
    expect(welcomeButton.className).toContain('opacity-100')

    const haloRing = screen.getByTestId('mock-halo-ring')
    expect(haloRing).toHaveAttribute('data-expanded', 'false')

    const geoDispatcher = screen.getByTestId('mock-geometry-dispatcher')
    expect(geoDispatcher).toHaveAttribute('data-mode', 'tesseract')

    // Tuner is hidden by default behind secret console command
    expect(screen.queryByTestId('geometry-tuner')).not.toBeInTheDocument()
  })

  it('shrinks and disappears "welcome" and expands Halo on mouse hover', () => {
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const welcomeButton = screen.getByTestId('welcome-trigger')
    const haloRing = screen.getByTestId('mock-halo-ring')

    expect(haloRing).toHaveAttribute('data-expanded', 'false')
    expect(welcomeButton.className).toContain('scale-100')

    fireEvent.mouseEnter(welcomeButton)

    // Halo expands
    expect(haloRing).toHaveAttribute('data-expanded', 'true')
    // "welcome" text shrinks and disappears
    expect(welcomeButton.className).toContain('scale-0')
    expect(welcomeButton.className).toContain('opacity-0')
  })

  it('restores "welcome" when pressing Escape', () => {
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const welcomeButton = screen.getByTestId('welcome-trigger')
    const haloRing = screen.getByTestId('mock-halo-ring')

    fireEvent.mouseEnter(welcomeButton)
    expect(haloRing).toHaveAttribute('data-expanded', 'true')
    expect(welcomeButton.className).toContain('scale-0')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(haloRing).toHaveAttribute('data-expanded', 'false')
    expect(welcomeButton.className).toContain('scale-100')
  })

  it('initializes with halo expanded when ?halo=true query parameter is present', () => {
    window.location.hash = '#/?halo=true'
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const haloRing = screen.getByTestId('mock-halo-ring')
    const welcomeButton = screen.getByTestId('welcome-trigger')

    expect(haloRing).toHaveAttribute('data-expanded', 'true')
    expect(welcomeButton.className).toContain('scale-0')
    expect(welcomeButton.className).toContain('opacity-0')
  })

  it('mutates the primary color after the glitch resolves', () => {
    vi.useFakeTimers()
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    const initialPrimary = document.documentElement.style.getPropertyValue('--theme-primary')
    expect(initialPrimary).toBe('#e2f872')

    // With Math.random() = 0.5:
    // interval = 4000 + 0.5 * 11000 = 9500ms
    // burstDuration = 400 + 0.5 * 2600 = 1700ms
    // Total for first glitch = 11200ms
    act(() => {
      vi.advanceTimersByTime(11500)
    })

    const newPrimary = document.documentElement.style.getPropertyValue('--theme-primary')
    expect(newPrimary).not.toBe('#e2f872')
    expect(['#d4adf0', '#83d4d4']).toContain(newPrimary)

    mathSpy.mockRestore()
    vi.useRealTimers()
  })

  it('hides GeometryTuner by default, but unlocks via secret console command tuner()', () => {
    window.location.hash = '#/'
    window.localStorage.clear()
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    // Hidden initially
    expect(screen.queryByTestId('geometry-tuner')).not.toBeInTheDocument()

    // Invoke secret console command
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    act(() => {
      ;(window as any).tuner()
    })

    // Now revealed in the DOM
    const tuner = screen.getByTestId('geometry-tuner')
    expect(tuner).toBeInTheDocument()
    expect(tuner).toHaveTextContent('tesseract')

    // Invoke again to toggle off
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).tuner()
    })
    expect(screen.queryByTestId('geometry-tuner')).not.toBeInTheDocument()
  })

  it('renders GeometryTuner when ?tuner=true query parameter is present and respects ?geo=trefoil', () => {
    window.location.hash = '#/?geo=trefoil&tuner=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    const tuner = screen.getByTestId('geometry-tuner')
    expect(tuner).toBeInTheDocument()
    expect(tuner).toHaveTextContent('trefoil')
  })

  it('includes mobile-friendly viewport classes and expanded touch target area', () => {
    window.location.hash = '#/'
    const { container } = render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const main = container.querySelector('main')
    expect(main).toHaveClass('min-h-dvh')
    expect(main).toHaveClass('h-full')

    const welcomeButton = screen.getByTestId('welcome-trigger')
    expect(welcomeButton).toHaveClass('touch-manipulation')
    expect(welcomeButton.className).toContain('after:absolute')
    expect(welcomeButton.className).toContain('after:-inset-8')
    expect(welcomeButton.className).toContain('md:after:inset-0')
  })

  it('activates tactile touch hover state on touchStart and expands on touchEnd', () => {
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const welcomeButton = screen.getByTestId('welcome-trigger')
    const haloRing = screen.getByTestId('mock-halo-ring')

    expect(haloRing).toHaveAttribute('data-expanded', 'false')

    // Touch down: tactile hover activated (highlight color + subtle scale)
    fireEvent.touchStart(welcomeButton)
    expect(welcomeButton.className).toContain('scale-105')
    expect(welcomeButton.className).toContain('text-[var(--theme-highlight)]')
    expect(haloRing).toHaveAttribute('data-expanded', 'false')

    // Touch release: commits expansion into 3D topology
    fireEvent.touchEnd(welcomeButton)
    expect(haloRing).toHaveAttribute('data-expanded', 'true')
    expect(welcomeButton.className).toContain('scale-0')
  })

  it('resets touch hover state when touchCancel is dispatched', () => {
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const welcomeButton = screen.getByTestId('welcome-trigger')
    const haloRing = screen.getByTestId('mock-halo-ring')

    // Touch down
    fireEvent.touchStart(welcomeButton)
    expect(welcomeButton.className).toContain('scale-105')

    // Finger dragged away / gesture cancelled
    fireEvent.touchCancel(welcomeButton)
    expect(welcomeButton.className).toContain('scale-100')
    expect(haloRing).toHaveAttribute('data-expanded', 'false')
  })

  it('supports powerMode and setPowerMode console commands', () => {
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    expect(typeof win.setPowerMode).toBe('function')
    expect(typeof win.powerMode).toBe('function')

    act(() => {
      win.setPowerMode('eco')
    })
    expect(window.localStorage.getItem('trongngyn_power_mode')).toBe('eco')

    act(() => {
      win.setPowerMode('uncapped')
    })
    expect(window.localStorage.getItem('trongngyn_power_mode')).toBe('uncapped')
  })

  it('restores tuner visibility from legacy antigravity_tuner_visible key', () => {
    window.location.hash = '#/'
    window.localStorage.setItem('antigravity_tuner_visible', 'true')
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('geometry-tuner')).toBeInTheDocument()
  })

  it('collapses geometry when clicking the space background (SceneContainer)', () => {
    window.location.hash = '#/?expanded=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    const haloRing = screen.getByTestId('mock-halo-ring')
    const welcomeButton = screen.getByTestId('welcome-trigger')
    expect(haloRing).toHaveAttribute('data-expanded', 'true')
    expect(welcomeButton.className).toContain('scale-0')

    // Click space background
    const sceneContainer = screen.getByTestId('mock-scene-container')
    fireEvent.click(sceneContainer)

    expect(haloRing).toHaveAttribute('data-expanded', 'false')
    expect(welcomeButton.className).toContain('scale-100')
  })

  it('does not collapse geometry when clicking options in the tuner menu', () => {
    window.location.hash = '#/?expanded=true&tuner=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    const haloRing = screen.getByTestId('mock-halo-ring')
    expect(haloRing).toHaveAttribute('data-expanded', 'true')

    const tuner = screen.getByTestId('geometry-tuner')
    expect(tuner).toBeInTheDocument()

    // 1. Click gear button to open drawer
    const gearBtn = screen.getByLabelText('Toggle parameter drawer')
    fireEvent.click(gearBtn)
    expect(screen.getByTestId('geometry-tuner-drawer')).toBeInTheDocument()
    expect(haloRing).toHaveAttribute('data-expanded', 'true')

    // 2. Click a geometry mode button inside the drawer (e.g. Trefoil)
    const trefoilBtn = screen.getByRole('button', { name: 'trefoil' })
    fireEvent.click(trefoilBtn)
    expect(haloRing).toHaveAttribute('data-expanded', 'true')

    // 3. Click VFX & Glitch tab
    const vfxTab = screen.getByRole('button', { name: 'VFX & Glitch' })
    fireEvent.click(vfxTab)
    expect(haloRing).toHaveAttribute('data-expanded', 'true')

    // 4. Click a theme color button
    const purpleThemeBtn = screen.getByRole('button', { name: /purple/i })
    fireEvent.click(purpleThemeBtn)
    expect(haloRing).toHaveAttribute('data-expanded', 'true')

    // 5. Click the geo cycle button on the pill
    const cycleBtn = screen.getByRole('button', { name: /Current geometry:/i })
    fireEvent.click(cycleBtn)
    expect(haloRing).toHaveAttribute('data-expanded', 'true')

    // Finally, clicking the space background DOES collapse it
    const sceneContainer = screen.getByTestId('mock-scene-container')
    fireEvent.click(sceneContainer)
    expect(haloRing).toHaveAttribute('data-expanded', 'false')
  })

  it('supports setSonnyContainer and sonnyContainers console commands', () => {
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <ThemeProvider>
          <SonnyContainerProvider>
            <HomePage />
          </SonnyContainerProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    expect(typeof win.setSonnyContainer).toBe('function')
    expect(typeof win.sonnyContainer).toBe('function')
    expect(typeof win.sonnyContainers).toBe('function')

    act(() => {
      win.setSonnyContainer('capsule')
    })
    expect(window.localStorage.getItem('trongngyn_sonny_container')).toBe('capsule')

    act(() => {
      win.setSonnyContainer('crystal')
    })
    expect(window.localStorage.getItem('trongngyn_sonny_container')).toBe('crystal')

    // Invalid style warning
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    act(() => {
      win.setSonnyContainer('invalid-style')
    })
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()

    // sonnyContainers console table
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {})
    act(() => {
      win.sonnyContainers()
    })
    expect(tableSpy).toHaveBeenCalled()
    tableSpy.mockRestore()
  })

  it('initializes sonny container from query parameter', () => {
    window.location.hash = '#/?container=wirebox'
    render(
      <RouterProvider>
        <ThemeProvider>
          <SonnyContainerProvider>
            <HomePage />
          </SonnyContainerProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    expect(window.localStorage.getItem('trongngyn_sonny_container')).toBe('wirebox')
  })

  it('supports toggleDistance and showDistance console commands', () => {
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <ThemeProvider>
          <SonnyContainerProvider>
            <DebugDistanceProvider>
              <HomePage />
            </DebugDistanceProvider>
          </SonnyContainerProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    expect(typeof win.toggleDistance).toBe('function')
    expect(typeof win.showDistance).toBe('function')

    act(() => {
      win.toggleDistance()
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance')).toBe('true')

    act(() => {
      win.toggleDistance()
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance')).toBe('false')

    act(() => {
      win.showDistance(true)
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance')).toBe('true')

    expect(typeof win.setDistanceMetric).toBe('function')
    expect(typeof win.toggleDistanceMetric).toBe('function')
    expect(typeof win.distanceMetric).toBe('function')

    act(() => {
      win.setDistanceMetric('depth')
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance_metric')).toBe('depth')
    expect(win.distanceMetric()).toBe('depth')

    act(() => {
      win.toggleDistanceMetric()
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance_metric')).toBe('euclid')

    expect(typeof win.toggleCoords).toBe('function')
    expect(typeof win.showCoords).toBe('function')

    act(() => {
      win.toggleCoords()
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance_coords')).toBe('false')

    act(() => {
      win.showCoords(true)
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance_coords')).toBe('true')

    expect(typeof win.setCoordFrame).toBe('function')
    expect(typeof win.toggleCoordFrame).toBe('function')
    expect(typeof win.coordFrame).toBe('function')

    act(() => {
      win.setCoordFrame('world')
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance_coord_frame')).toBe('world')
    expect(win.coordFrame()).toBe('world')

    act(() => {
      win.toggleCoordFrame()
    })
    expect(window.localStorage.getItem('trongngyn_debug_distance_coord_frame')).toBe('view')
    expect(win.coordFrame()).toBe('view')
  })

  it('initializes debug distance from ?dist=true query parameter', () => {
    window.location.hash = '#/?dist=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <SonnyContainerProvider>
            <DebugDistanceProvider>
              <HomePage />
            </DebugDistanceProvider>
          </SonnyContainerProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    expect(window.localStorage.getItem('trongngyn_debug_distance')).toBe('true')
  })

  it('toggles expansion state when clicking the welcome trigger button directly', () => {
    // Given: rendered home page
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    const welcomeButton = screen.getByTestId('welcome-trigger')
    const haloRing = screen.getByTestId('mock-halo-ring')
    expect(haloRing).toHaveAttribute('data-expanded', 'false')

    // When: clicking welcome button
    fireEvent.click(welcomeButton)

    // Then: expands geometry
    expect(haloRing).toHaveAttribute('data-expanded', 'true')
  })

  it('navigates to destination paths when clicking screen-reader accessibility buttons', () => {
    // Given: rendered home page
    window.location.hash = '#/'
    render(
      <RouterProvider>
        <HomePage />
      </RouterProvider>
    )

    // When: clicking screen-reader buttons
    const srNav = screen.getByRole('navigation', { name: 'Direct Destinations' })
    const aboutBtn = screen.getByRole('button', { name: 'about' })
    const moreBtn = screen.getByRole('button', { name: 'more' })
    const sonnyBtn = screen.getByRole('button', { name: 'sonny' })

    expect(srNav).toBeInTheDocument()

    fireEvent.click(aboutBtn)
    expect(window.location.hash).toBe('#/about')

    fireEvent.click(moreBtn)
    expect(window.location.hash).toBe('#/more')

    fireEvent.click(sonnyBtn)
    expect(window.location.hash).toBe('#/sonny')
  })

  it('hides Tuner HUD and removes localStorage persistence when closing via onClose', () => {
    // Given: tuner open via query param
    window.location.hash = '#/?tuner=true'
    window.localStorage.setItem('trongngyn_tuner_visible', 'true')

    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('geometry-tuner')).toBeInTheDocument()

    // When: clicking close button on Tuner
    const closeBtn = screen.getByLabelText('Hide tuner menu')
    fireEvent.click(closeBtn)

    // Then: tuner is dismissed and key removed
    expect(screen.queryByTestId('geometry-tuner')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('trongngyn_tuner_visible')).toBeNull()
  })

  it('renders animation pause button strictly when tuner is visible, and controls pause state', () => {
    // Given: home page without tuner visible
    window.location.hash = '#/'
    const { unmount } = render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    // Then: pause button is not rendered
    expect(screen.queryByTestId('animation-pause-button')).not.toBeInTheDocument()
    unmount()

    // When: opening page with tuner visible
    window.location.hash = '#/?tuner=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    // Then: pause button is visible next to tuner launcher
    const pauseBtn = screen.getByTestId('animation-pause-button')
    const sceneContainer = screen.getByTestId('mock-scene-container')
    const mainEl = document.querySelector('main')

    expect(pauseBtn).toBeInTheDocument()
    expect(pauseBtn).toHaveTextContent('⏸')
    expect(sceneContainer).toHaveAttribute('data-paused', 'false')
    expect(mainEl).not.toHaveAttribute('data-effects-paused')

    // When: clicking pause button
    fireEvent.click(pauseBtn)

    // Then: effects are paused
    expect(pauseBtn).toHaveTextContent('▶')
    expect(sceneContainer).toHaveAttribute('data-paused', 'true')
    expect(mainEl).toHaveAttribute('data-effects-paused', 'true')

    // When: closing tuner, auto-unpauses
    const closeBtn = screen.getByLabelText('Hide tuner menu')
    fireEvent.click(closeBtn)

    expect(sceneContainer).toHaveAttribute('data-paused', 'false')
    expect(mainEl).not.toHaveAttribute('data-effects-paused')
  })

  it('controls animation pause via secret console commands pause, togglePause, and isPaused', () => {
    window.location.hash = '#/?tuner=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    const win = window as any
    expect(typeof win.pause).toBe('function')
    expect(typeof win.togglePause).toBe('function')
    expect(typeof win.isPaused).toBe('function')

    const sceneContainer = screen.getByTestId('mock-scene-container')
    const mainEl = document.querySelector('main')

    expect(win.isPaused()).toBe(false)
    expect(sceneContainer).toHaveAttribute('data-paused', 'false')

    // When: calling win.pause(true)
    act(() => {
      win.pause(true)
    })
    expect(win.isPaused()).toBe(true)
    expect(sceneContainer).toHaveAttribute('data-paused', 'true')
    expect(mainEl).toHaveAttribute('data-effects-paused', 'true')

    // When: calling win.togglePause()
    act(() => {
      win.togglePause()
    })
    expect(win.isPaused()).toBe(false)
    expect(sceneContainer).toHaveAttribute('data-paused', 'false')
    expect(mainEl).not.toHaveAttribute('data-effects-paused')
  })

  it('initializes animation paused state from ?paused=true query parameter', () => {
    window.location.hash = '#/?tuner=true&paused=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </RouterProvider>
    )

    const sceneContainer = screen.getByTestId('mock-scene-container')
    const mainEl = document.querySelector('main')
    const pauseBtn = screen.getByTestId('animation-pause-button')

    expect(sceneContainer).toHaveAttribute('data-paused', 'true')
    expect(mainEl).toHaveAttribute('data-effects-paused', 'true')
    expect(pauseBtn).toHaveTextContent('▶')
  })

  it('controls camera elevation via secret console commands setCameraElevation, toggleCameraElevation, and cameraElevation', () => {
    window.location.hash = '#/?tuner=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <DebugDistanceProvider>
            <HomePage />
          </DebugDistanceProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    const win = window as any
    expect(typeof win.setCameraElevation).toBe('function')
    expect(typeof win.toggleCameraElevation).toBe('function')
    expect(typeof win.cameraElevation).toBe('function')

    const sceneContainer = screen.getByTestId('mock-scene-container')
    expect(win.cameraElevation()).toBe('elevated')
    expect(sceneContainer).toHaveAttribute('data-camera-elevation', 'elevated')

    // When: setting to eye-level
    act(() => {
      win.setCameraElevation('eye-level')
    })
    expect(win.cameraElevation()).toBe('eye-level')
    expect(sceneContainer).toHaveAttribute('data-camera-elevation', 'eye-level')

    // When: toggling elevation
    act(() => {
      win.toggleCameraElevation()
    })
    expect(win.cameraElevation()).toBe('elevated')
    expect(sceneContainer).toHaveAttribute('data-camera-elevation', 'elevated')
  })

  it('initializes camera elevation from ?elevation=eye-level URL parameter', () => {
    window.location.hash = '#/?tuner=true&elevation=eye-level'
    render(
      <RouterProvider>
        <ThemeProvider>
          <DebugDistanceProvider>
            <HomePage />
          </DebugDistanceProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    const sceneContainer = screen.getByTestId('mock-scene-container')
    expect(sceneContainer).toHaveAttribute('data-camera-elevation', 'eye-level')
  })

  it('controls camera orbit inspection via console commands setInspectYaw, setInspectPitch, setInspectDistance, resetCameraAngles, and cameraAngles', () => {
    window.location.hash = '#/?tuner=true'
    render(
      <RouterProvider>
        <ThemeProvider>
          <DebugDistanceProvider>
            <HomePage />
          </DebugDistanceProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    const win = window as any
    expect(typeof win.setInspectYaw).toBe('function')
    expect(typeof win.setInspectPitch).toBe('function')
    expect(typeof win.setInspectDistance).toBe('function')
    expect(typeof win.resetCameraAngles).toBe('function')
    expect(typeof win.cameraAngles).toBe('function')

    const initialAngles = win.cameraAngles()
    expect(initialAngles.yaw).toBe(0)
    expect(initialAngles.pitch).toBeCloseTo(25.07, 1)

    // Adjust yaw
    act(() => {
      win.setInspectYaw(45)
    })
    expect(win.cameraAngles().yaw).toBe(45)
    expect(screen.getByTestId('mock-scene-container')).toHaveAttribute('data-camera-yaw', '45')

    // Adjust pitch
    act(() => {
      win.setInspectPitch(-30)
    })
    expect(win.cameraAngles().pitch).toBe(-30)
    expect(screen.getByTestId('mock-scene-container')).toHaveAttribute('data-camera-pitch', '-30')

    // Adjust distance
    act(() => {
      win.setInspectDistance(8.5)
    })
    expect(win.cameraAngles().distance).toBe(8.5)
    expect(screen.getByTestId('mock-scene-container')).toHaveAttribute('data-camera-dist', '8.5')

    // Reset camera angles
    act(() => {
      win.resetCameraAngles()
    })
    expect(win.cameraAngles().yaw).toBe(0)
    expect(win.cameraAngles().pitch).toBeCloseTo(25.07, 1)
    expect(win.cameraAngles().distance).toBeCloseTo(6.017, 2)
  })

  it('initializes camera inspection angles from query parameters ?yaw=45&pitch=30&zoom=8.5', () => {
    window.location.hash = '#/?tuner=true&yaw=45&pitch=30&zoom=8.5'
    render(
      <RouterProvider>
        <ThemeProvider>
          <DebugDistanceProvider>
            <HomePage />
          </DebugDistanceProvider>
        </ThemeProvider>
      </RouterProvider>
    )

    const sceneContainer = screen.getByTestId('mock-scene-container')
    expect(sceneContainer).toHaveAttribute('data-camera-yaw', '45')
    expect(sceneContainer).toHaveAttribute('data-camera-pitch', '30')
    expect(sceneContainer).toHaveAttribute('data-camera-dist', '8.5')

    const win = window as any
    expect(win.cameraAngles().yaw).toBe(45)
    expect(win.cameraAngles().pitch).toBe(30)
    expect(win.cameraAngles().distance).toBe(8.5)
  })
})
