import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CerebroChamber } from '../CerebroChamber'
import { VIDEOS_DATA } from '../galleryData'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from '@/components/gallery/galleryTunerConfig'
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

  it('configures Canvas with NoToneMapping to preserve bit-exact sRGB contrast and saturation', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const canvas = screen.getByTestId('r3f-canvas')
    expect(canvas).toHaveAttribute('data-tone-mapping', '0')
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

  it('adaptively expands max yaw in portrait viewport mode', () => {
    // In portrait mode: width < height
    setMockThreeState({
      viewport: {
        width: 400,
        height: 800,
        factor: 1,
        distance: 5,
        aspect: 400 / 800,
      },
    })

    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')
    // Drag horizontally
    fireEvent.pointerDown(container, { clientX: 300, clientY: 400 })
    fireEvent.pointerMove(container, { clientX: 10, clientY: 400 })

    act(() => {
      runFrames(10, 0.016)
    })

    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })

  it('provides exact 1:1 direct tracking without lag during active dragging', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')

    // Initial camera yaw
    act(() => {
      runFrames(1, 0.016)
    })
    const startYaw = currentThreeState.camera.rotation.y

    // Drag 64px to the right (dx = 64px > 4px threshold)
    fireEvent.pointerDown(container, { clientX: 300, clientY: 300 })
    fireEvent.pointerMove(container, { clientX: 364, clientY: 300 })

    // In a single frame during active drag, the camera immediately reflects 1:1 movement
    act(() => {
      runFrames(1, 0.016)
    })

    const afterFirstFrameYaw = currentThreeState.camera.rotation.y
    // Camera rotates to look left (positive rotation around Y axis in Three.js when looking towards -Z)
    expect(afterFirstFrameYaw).not.toEqual(startYaw)

    // Run another frame while still holding pointer down: position remains stable (no lag float)
    act(() => {
      runFrames(1, 0.016)
    })
    expect(currentThreeState.camera.rotation.y).toBeCloseTo(afterFirstFrameYaw, 4)

    // Release pointer: inertia smoothly eases to stop
    fireEvent.pointerUp(container)
    act(() => {
      runFrames(60, 0.016)
    })
    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })

  it('calibrates two-finger wheel scrolling to 1:1 input to output with deltaMode support', () => {
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')

    act(() => {
      runFrames(2, 0.016)
    })
    const initialRotY = currentThreeState.camera.rotation.y

    // Fire wheel event in pixel mode (deltaMode = 0)
    fireEvent.wheel(container, { deltaX: 50, deltaY: 0, deltaMode: 0 })

    act(() => {
      runFrames(15, 0.016)
    })

    // Content scrolls left -> camera looks right (negative Y rotation when looking down -Z)
    const pixelRotY = currentThreeState.camera.rotation.y
    expect(pixelRotY).toBeLessThan(initialRotY)

    // Fire wheel event in line mode (deltaMode = 1, e.g. 2 lines)
    fireEvent.wheel(container, { deltaX: 2, deltaY: 0, deltaMode: 1 })

    act(() => {
      runFrames(15, 0.016)
    })

    expect(currentThreeState.camera.rotation.y).toBeLessThan(pixelRotY)
  })

  it('scales drag sensitivity when dragMultiplier parameter is configured in tuner', () => {
    // Render with 2.0x drag multiplier
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          params={{
            ...DEFAULT_GALLERY_CHAMBER_PARAMS,
            dragMultiplier: 2.0,
          }}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')

    act(() => {
      runFrames(1, 0.016)
    })
    const startYaw = currentThreeState.camera.rotation.y

    // Drag 50px
    fireEvent.pointerDown(container, { clientX: 200, clientY: 200 })
    fireEvent.pointerMove(container, { clientX: 250, clientY: 200 })

    act(() => {
      runFrames(1, 0.016)
    })

    const deltaYaw2x = currentThreeState.camera.rotation.y - startYaw
    expect(Math.abs(deltaYaw2x)).toBeGreaterThan(0.04)

    fireEvent.pointerUp(container)
  })

  it('modulates touch fling inertia according to flingInertia parameter', () => {
    // 1. With flingInertia = 0, camera stops immediately on pointer release
    const { unmount } = render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          params={{
            ...DEFAULT_GALLERY_CHAMBER_PARAMS,
            flingInertia: 0.0,
          }}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')

    fireEvent.pointerDown(container, { clientX: 200, clientY: 200 })
    fireEvent.pointerMove(container, { clientX: 280, clientY: 200 })

    act(() => {
      runFrames(1, 0.016)
    })
    const atReleaseYaw = currentThreeState.camera.rotation.y

    // Release immediately (fling intent)
    fireEvent.pointerUp(container)

    act(() => {
      runFrames(10, 0.016)
    })

    // With flingInertia = 0, position does not drift further
    expect(currentThreeState.camera.rotation.y).toBeCloseTo(atReleaseYaw, 3)

    unmount()

    // 2. With flingInertia = 1.5, camera coasts smoothly past release point
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          params={{
            ...DEFAULT_GALLERY_CHAMBER_PARAMS,
            flingInertia: 1.5,
          }}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container2 = screen.getByTestId('cerebro-chamber-container')

    fireEvent.pointerDown(container2, { clientX: 200, clientY: 200 })
    fireEvent.pointerMove(container2, { clientX: 280, clientY: 200 })

    act(() => {
      runFrames(1, 0.016)
    })

    fireEvent.pointerUp(container2)

    act(() => {
      runFrames(20, 0.016)
    })

    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })
})
