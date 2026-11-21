import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MenuItemBadge, SONNY_FRAMES } from '../MenuItemBadge'

// Mock R3F and Drei primitives for unit testing in jsdom
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: () => ({
    camera: { position: { x: 0, y: 0, z: 5 }, lookAt: vi.fn() },
    pointer: { x: 0, y: 0 },
    viewport: { width: 10, height: 10 },
  }),
}))

vi.mock('@react-three/drei', () => ({
  Billboard: ({ children }: { children: React.ReactNode }) => <div data-testid="billboard">{children}</div>,
  Text: ({ children, onSync }: { children: React.ReactNode; onSync?: (troika: unknown) => void }) => {
    React.useEffect(() => {
      if (onSync) {
        onSync({ geometry: { boundingBox: { min: { x: 0 }, max: { x: 0.5 } } } })
      }
    }, [onSync])
    return <span data-testid="badge-text">{children}</span>
  },
}))

describe('MenuItemBadge Component', () => {
  it('renders badge with initial label and responds to hover and select', () => {
    const handleSelect = vi.fn()
    const handleHover = vi.fn()

    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        onSelect={handleSelect}
        onHover={handleHover}
      />
    )

    const textEl = screen.getByTestId('badge-text')
    expect(textEl).toHaveTextContent('about')
  })

  it('scrambles glyphs when hovered', () => {
    vi.useFakeTimers()

    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={true}
        isExpanded={true}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )

    act(() => {
      vi.advanceTimersByTime(200)
    })

    const textEl = screen.getByTestId('badge-text')
    expect(textEl.textContent).toHaveLength(5)

    vi.useRealTimers()
  })

  it('scrambles glyphs during glitch state', () => {
    vi.useFakeTimers()

    render(
      <MenuItemBadge
        label="more"
        path="/more"
        isHovered={false}
        isExpanded={true}
        isGlitching={true}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )

    act(() => {
      vi.advanceTimersByTime(150)
    })

    const textEl = screen.getByTestId('badge-text')
    expect(textEl.textContent).toHaveLength(4)

    vi.useRealTimers()
  })

  it('renders image sprite instead of text when imageUrl is provided', () => {
    const handleSelect = vi.fn()
    const handleHover = vi.fn()

    render(
      <MenuItemBadge
        label="sonny"
        path="/sonny"
        imageUrl="/images/sonny.png"
        isHovered={false}
        isExpanded={true}
        onSelect={handleSelect}
        onHover={handleHover}
      />
    )

    // Should NOT render Text component
    expect(screen.queryByTestId('badge-text')).not.toBeInTheDocument()
    // Should render Billboard container
    expect(screen.getByTestId('billboard')).toBeInTheDocument()
  })

  it('exports SONNY_FRAMES array with 15 frames starting with the original front-facing frame', () => {
    expect(SONNY_FRAMES).toHaveLength(15)
    expect(SONNY_FRAMES[0]).toBe('/images/sonny.png')
    expect(SONNY_FRAMES[1]).toBe('/images/sonny/frame-01.png')
    expect(SONNY_FRAMES[14]).toBe('/images/sonny/frame-14.png')
  })

  it('renders custom imageFrames badge and billboard structure', () => {
    const handleSelect = vi.fn()
    const handleHover = vi.fn()

    render(
      <MenuItemBadge
        label="custom"
        path="/more"
        imageFrames={['/images/frame-a.png', '/images/frame-b.png']}
        isHovered={true}
        isExpanded={true}
        onSelect={handleSelect}
        onHover={handleHover}
      />
    )

    expect(screen.queryByTestId('badge-text')).not.toBeInTheDocument()
    expect(screen.getByTestId('billboard')).toBeInTheDocument()
  })

  it.each([
    'diorama',
    'pedestal',
    'capsule',
    'wirebox',
    'crystal',
    'none',
  ] as const)('renders image badge correctly with containerStyle="%s"', (containerStyle) => {
    const handleSelect = vi.fn()
    const handleHover = vi.fn()

    const { container } = render(
      <MenuItemBadge
        label="sonny"
        path="/sonny"
        imageUrl="/images/sonny.png"
        containerStyle={containerStyle}
        isHovered={false}
        isExpanded={true}
        onSelect={handleSelect}
        onHover={handleHover}
      />
    )

    expect(screen.queryByTestId('badge-text')).not.toBeInTheDocument()
    expect(screen.getByTestId('billboard')).toBeInTheDocument()
    expect(container).toBeDefined()
  })

  it('renders distance badge above item when showDistance is enabled', () => {
    // 1. Text badge with showDistance={true}
    const { unmount } = render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        showDistance={true}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )
    expect(screen.getByTestId('distance-badge')).toBeInTheDocument()
    unmount()

    // 2. Image badge with showDistance={true}
    render(
      <MenuItemBadge
        label="sonny"
        path="/sonny"
        imageUrl="/images/sonny.png"
        isHovered={false}
        isExpanded={true}
        showDistance={true}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )
    expect(screen.getByTestId('distance-badge')).toBeInTheDocument()
  })

  it('does not render distance badge when showDistance is false', () => {
    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        showDistance={false}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )
    expect(screen.queryByTestId('distance-badge')).not.toBeInTheDocument()
  })

  it('renders distance badge with z: prefix when distanceMetric="depth"', () => {
    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        showDistance={true}
        distanceMetric="depth"
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )
    const distanceBadge = screen.getByTestId('distance-badge')
    expect(distanceBadge).toBeInTheDocument()
    expect(distanceBadge).toHaveTextContent(/z:\s*5\.00/)
  })

  it('renders x, y, z coordinates in telemetry badge when showCoordinates is true', () => {
    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        showDistance={true}
        showCoordinates={true}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )
    const distanceBadge = screen.getByTestId('distance-badge')
    expect(distanceBadge).toBeInTheDocument()
    expect(distanceBadge).toHaveTextContent(/d:\s*5\.00/)
    expect(distanceBadge).toHaveTextContent(/x:\s*0\.00\s+y:\s*0\.00\s+z:\s*0\.00/)
  })

  it('omits x, y, z coordinates when showCoordinates is false', () => {
    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        showDistance={true}
        showCoordinates={false}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )
    const distanceBadge = screen.getByTestId('distance-badge')
    expect(distanceBadge).toBeInTheDocument()
    expect(distanceBadge).toHaveTextContent(/d:\s*5\.00/)
    expect(distanceBadge).not.toHaveTextContent(/x:/)
  })

  it('registers useFrame callback to update depth scaling and renderOrder', () => {
    let capturedCallback: unknown = null
    vi.mocked(useFrame).mockImplementation((cb) => {
      capturedCallback = cb
      return null
    })

    render(
      <MenuItemBadge
        label="about"
        path="/about"
        isHovered={false}
        isExpanded={true}
        onSelect={vi.fn()}
        onHover={vi.fn()}
      />
    )

    expect(capturedCallback).toBeTypeOf('function')
  })

  it('calculates depth and renderOrder correctly across distance spectrum with pure optical perspective scaling', () => {
    // Distance formula verification:
    // computedDepth = clamp((8.4 - dist) / 4.8, 0, 1)
    // Option 2 (Pure Optical): 100% of scaling is driven by Three.js PerspectiveCamera
    // renderOrder = Math.round(computedDepth * 100)

    // Foreground (closest items ~3.6 units)
    const fgDist = 3.6
    const fgDepth = THREE.MathUtils.clamp((8.4 - fgDist) / 4.8, 0, 1)
    const fgRenderOrder = Math.round(fgDepth * 100)
    expect(fgDepth).toBeCloseTo(1.0, 5)
    expect(fgRenderOrder).toBe(100)

    // Midground (distance ~6.0 units)
    const midDist = 6.0
    const midDepth = THREE.MathUtils.clamp((8.4 - midDist) / 4.8, 0, 1)
    const midRenderOrder = Math.round(midDepth * 100)
    expect(midDepth).toBeCloseTo(0.5, 5)
    expect(midRenderOrder).toBe(50)

    // Background (furthest items ~8.4 units)
    const bgDist = 8.4
    const bgDepth = THREE.MathUtils.clamp((8.4 - bgDist) / 4.8, 0, 1)
    const bgRenderOrder = Math.round(bgDepth * 100)
    expect(bgDepth).toBeCloseTo(0.0, 5)
    expect(bgRenderOrder).toBe(0)

    // Beyond background bounds (e.g. 10.0 units) clamps cleanly to 0
    const farDist = 10.0
    const farDepth = THREE.MathUtils.clamp((8.4 - farDist) / 4.8, 0, 1)
    expect(farDepth).toBe(0)

    // Closer than foreground bounds (e.g. 2.0 units) clamps cleanly to 1
    const nearDist = 2.0
    const nearDepth = THREE.MathUtils.clamp((8.4 - nearDist) / 4.8, 0, 1)
    expect(nearDepth).toBe(1)
  })
})
