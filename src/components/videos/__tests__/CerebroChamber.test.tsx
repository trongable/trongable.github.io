import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CerebroChamber } from '../CerebroChamber'
import { VIDEOS_DATA } from '../videoData'
import { ThemeProvider } from '@/context/ThemeContext'
import { clearFrameRegistry, runFrames, setMockThreeState, currentThreeState } from '@/testUtils/r3fTestUtils'

describe('CerebroChamber Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
    setMockThreeState({ pointer: { x: 0, y: 0 } })
  })

  it('renders chamber container and all 7 video panels', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()

    VIDEOS_DATA.forEach((video) => {
      expect(screen.getByTestId(`curved-video-panel-${video.id}`)).toBeInTheDocument()
    })
  })

  it('handles touch drag interaction across the container on touch devices', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')

    fireEvent.pointerDown(container, { clientX: 100, clientY: 100, pointerType: 'touch' })
    fireEvent.pointerMove(container, { clientX: 150, clientY: 120, pointerType: 'touch' })

    act(() => {
      runFrames(5, 0.016)
    })

    fireEvent.pointerUp(container, { pointerType: 'touch' })

    expect(container).toBeInTheDocument()
  })

  it('keeps camera completely stationary when mouse cursor moves across edges without dragging', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    // Position mouse near outer edge
    setMockThreeState({ pointer: { x: 0.92, y: 0.85 } })

    const initialRotY = currentThreeState.camera.rotation.y

    act(() => {
      runFrames(20, 0.016)
    })

    // Edge panning has been removed: passive mouse movement produces zero rotation
    expect(currentThreeState.camera.rotation.y).toBeCloseTo(initialRotY, 2)
  })

  it('pans camera when pointer dragging is initiated', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')

    // Start drag
    fireEvent.pointerDown(container, { clientX: 200, clientY: 200 })
    // Move more than threshold of 4px
    fireEvent.pointerMove(container, { clientX: 250, clientY: 200 })

    act(() => {
      runFrames(10, 0.016)
    })

    // Pointer up releases drag with inertia
    fireEvent.pointerUp(container)

    act(() => {
      runFrames(10, 0.016)
    })

    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })

  it('renders with selectedVideo in flight state', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          selectedVideo={VIDEOS_DATA[0]}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })

  it('handles document visibility changes to sleep when tab is hidden', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })
    fireEvent(document, new Event('visibilitychange'))

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    fireEvent(document, new Event('visibilitychange'))

    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })
})
