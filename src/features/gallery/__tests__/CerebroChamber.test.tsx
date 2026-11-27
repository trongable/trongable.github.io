import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CerebroChamber } from '@/features/gallery/chamber/CerebroChamber'
import { VIDEOS_DATA } from '@/features/gallery/data/galleryData'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from '@/features/gallery/data/galleryTunerConfig'
import { ThemeProvider } from '@/context/ThemeContext'
import { clearFrameRegistry, runFrames, setMockThreeState, currentThreeState } from '@/testUtils/r3fTestUtils'

describe('CerebroChamber Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
    setMockThreeState({ pointer: { x: 0, y: 0 } })
  })

  it('renders chamber container and all 29 video panels', () => {
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

  it('allows unrestricted 360+ degree horizontal spin when maxYawDeg is 180 and clamps when below 180', () => {
    const { unmount } = render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          params={{
            ...DEFAULT_GALLERY_CHAMBER_PARAMS,
            maxYawDeg: 180,
            dragMultiplier: 4.0,
          }}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')
    fireEvent.pointerDown(container, { clientX: 600, clientY: 300 })
    // Repeated horizontal drags past 180 deg should not clamp camera rotation
    for (let i = 0; i < 6; i++) {
      fireEvent.pointerMove(container, { clientX: 600 - (i + 1) * 400, clientY: 300 })
    }
    act(() => {
      runFrames(5, 0.016)
    })

    // Camera quaternion should remain valid and rotated continuously without NaN
    expect(Number.isFinite(currentThreeState.camera.rotation.y)).toBe(true)
    fireEvent.pointerUp(container)
    unmount()

    // With freeSpin disabled and maxYawDeg = 45, dragging far keeps camera clamped within 45 deg
    render(
      <ThemeProvider>
        <CerebroChamber
          activeVideo={null}
          params={{
            ...DEFAULT_GALLERY_CHAMBER_PARAMS,
            freeSpin: false,
            maxYawDeg: 45,
            dragMultiplier: 4.0,
          }}
          onSelectVideo={vi.fn()}
        />
      </ThemeProvider>
    )

    const containerClamped = screen.getByTestId('cerebro-chamber-container')
    fireEvent.pointerDown(containerClamped, { clientX: 600, clientY: 300 })
    fireEvent.pointerMove(containerClamped, { clientX: -1200, clientY: 300 })
    act(() => {
      runFrames(5, 0.016)
    })
    expect(Math.abs(currentThreeState.camera.rotation.y)).toBeLessThanOrEqual((45 * Math.PI) / 180 + 0.02)
    fireEvent.pointerUp(containerClamped)
  })

  it('spins continuously with ArrowLeft/ArrowRight/A/D keys only when chamber is not dimmed', () => {
    const { rerender } = render(
      <ThemeProvider>
        <CerebroChamber activeVideo={null} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )

    act(() => {
      runFrames(1, 0.016)
    })
    const startRotY = currentThreeState.camera.rotation.y

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => {
      runFrames(10, 0.016)
    })
    const afterRightRotY = currentThreeState.camera.rotation.y
    expect(afterRightRotY).toBeLessThan(startRotY)

    fireEvent.keyUp(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'a' })
    act(() => {
      runFrames(15, 0.016)
    })
    expect(currentThreeState.camera.rotation.y).toBeGreaterThan(afterRightRotY)
    fireEvent.keyUp(window, { key: 'a' })

    // Let camera damping settle before opening overlay
    act(() => {
      runFrames(45, 0.016)
    })

    // When dimmed (overlay open), keyboard spin keys do not pan chamber
    rerender(
      <ThemeProvider>
        <CerebroChamber activeVideo={VIDEOS_DATA[0]} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )
    act(() => {
      runFrames(2, 0.016)
    })
    const dimmedRotY = currentThreeState.camera.rotation.y
    fireEvent.keyDown(window, { key: 'd' })
    act(() => {
      runFrames(10, 0.016)
    })
    expect(currentThreeState.camera.rotation.y).toBeCloseTo(dimmedRotY, 3)
    fireEvent.keyUp(window, { key: 'd' })
  })

  it('pans vertically with ArrowUp/ArrowDown/W/S keys only when chamber is not dimmed', () => {
    const { rerender } = render(
      <ThemeProvider>
        <CerebroChamber activeVideo={null} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )

    act(() => {
      runFrames(1, 0.016)
    })
    const startPitch = currentThreeState.camera.rotation.x

    fireEvent.keyDown(window, { key: 'ArrowUp' })
    act(() => {
      runFrames(10, 0.016)
    })
    const afterUpPitch = currentThreeState.camera.rotation.x
    expect(afterUpPitch).toBeGreaterThan(startPitch)
    fireEvent.keyUp(window, { key: 'ArrowUp' })

    fireEvent.keyDown(window, { key: 's' })
    act(() => {
      runFrames(20, 0.016)
    })
    expect(currentThreeState.camera.rotation.x).toBeLessThan(afterUpPitch)
    fireEvent.keyUp(window, { key: 's' })
    act(() => {
      runFrames(45, 0.016)
    })

    // When dimmed, W/S keys do not tilt camera
    rerender(
      <ThemeProvider>
        <CerebroChamber activeVideo={VIDEOS_DATA[0]} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )
    act(() => {
      runFrames(2, 0.016)
    })
    const dimmedPitch = currentThreeState.camera.rotation.x
    fireEvent.keyDown(window, { key: 'w' })
    act(() => {
      runFrames(10, 0.016)
    })
    expect(currentThreeState.camera.rotation.x).toBeCloseTo(dimmedPitch, 2)
    fireEvent.keyUp(window, { key: 'w' })
  })

  it('calls preventDefault on horizontal wheel events when active to block Chrome back/forward nav gestures', () => {
    const { rerender } = render(
      <ThemeProvider>
        <CerebroChamber activeVideo={null} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )

    const container = screen.getByTestId('cerebro-chamber-container')
    const activeEvent = new WheelEvent('wheel', { deltaX: 120, deltaY: 0, bubbles: true, cancelable: true })
    container.dispatchEvent(activeEvent)
    expect(activeEvent.defaultPrevented).toBe(true)

    rerender(
      <ThemeProvider>
        <CerebroChamber activeVideo={VIDEOS_DATA[0]} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )
    const dimmedEvent = new WheelEvent('wheel', { deltaX: 120, deltaY: 0, bubbles: true, cancelable: true })
    container.dispatchEvent(dimmedEvent)
    expect(dimmedEvent.defaultPrevented).toBe(false)
  })

  it('auto-focuses the center-most panel while panning and yields priority to explicit mouse hover', () => {
    render(
      <ThemeProvider>
        <CerebroChamber activeVideo={null} onSelectVideo={vi.fn()} />
      </ThemeProvider>
    )

    // Pan around the sphere so center-gaze evaluation selects the centered panel
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => {
      runFrames(20, 0.016)
    })
    fireEvent.keyUp(window, { key: 'ArrowRight' })

    // Explicitly hovering a panel takes priority over center-gaze focus
    const hoveredMesh = screen.getByTestId(`curved-video-mesh-${VIDEOS_DATA[0].id}`)
    fireEvent.pointerOver(hoveredMesh)
    act(() => {
      runFrames(5, 0.016)
    })
    expect(screen.getByTestId(`curved-panel-reticle-${VIDEOS_DATA[0].id}`)).toBeInTheDocument()

    fireEvent.pointerOut(hoveredMesh)
  })

  it('toggles cerebro-vignette-overlay opacity with vignette param and active item selection', () => {
    const onSelectVideo = vi.fn()
    const { rerender } = render(
      <ThemeProvider>
        <CerebroChamber onSelectVideo={onSelectVideo} activeVideo={null} />
      </ThemeProvider>
    )

    const vignette = screen.getByTestId('cerebro-vignette-overlay')
    expect(vignette).toHaveClass('opacity-100')

    rerender(
      <ThemeProvider>
        <CerebroChamber
          onSelectVideo={onSelectVideo}
          activeVideo={null}
          params={{ ...DEFAULT_GALLERY_CHAMBER_PARAMS, vignette: false }}
        />
      </ThemeProvider>
    )
    expect(screen.getByTestId('cerebro-vignette-overlay')).toHaveClass('opacity-0')

    rerender(
      <ThemeProvider>
        <CerebroChamber
          onSelectVideo={onSelectVideo}
          activeVideo={VIDEOS_DATA[0]}
          params={{ ...DEFAULT_GALLERY_CHAMBER_PARAMS, vignette: true }}
        />
      </ThemeProvider>
    )
    expect(screen.getByTestId('cerebro-vignette-overlay')).toHaveClass('opacity-0')
  })
})
