import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HomePage } from '../HomePage'
import { RouterProvider } from '../../routes/Router'
import { ThemeProvider } from '../../context/ThemeContext'

// Mock 3D SceneContainer in jsdom test environment
vi.mock('../../components/canvas/SceneContainer', () => ({
  SceneContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-scene-container">{children}</div>
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
  GeometryDispatcher: ({ mode, isExpanded }: { mode: string; isExpanded: boolean }) => (
    <div data-testid="mock-geometry-dispatcher" data-mode={mode} data-expanded={isExpanded}>
      <div data-testid="mock-halo-ring" data-expanded={isExpanded} />
    </div>
  ),
}))

describe('HomePage Component', () => {
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
    expect(['#ff007f', '#39ff14', '#ff3c00']).toContain(newPrimary)

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
})
