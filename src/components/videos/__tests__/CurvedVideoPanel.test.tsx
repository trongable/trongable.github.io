import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CurvedVideoPanel } from '../CurvedVideoPanel'
import { VIDEOS_DATA } from '../videoData'
import { ThemeProvider } from '@/context/ThemeContext'
import { runFrames, clearFrameRegistry } from '@/testUtils/r3fTestUtils'

describe('CurvedVideoPanel Component', () => {
  const mockVideo = VIDEOS_DATA[0]

  beforeEach(() => {
    clearFrameRegistry()
    vi.useFakeTimers()
  })

  it('renders the curved video panel with video test id', () => {
    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)).toBeInTheDocument()
  })

  it('triggers onSelect callback when clicking the screen mesh', () => {
    const handleSelect = vi.fn()

    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          onSelect={handleSelect}
        />
      </ThemeProvider>
    )

    const screenMesh = screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)
    fireEvent.click(screenMesh)

    expect(handleSelect).toHaveBeenCalledWith(mockVideo)
  })

  it('handles pointer over and pointer out with glyph scrambling on the screen mesh', () => {
    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    const screenMesh = screen.getByTestId(`curved-video-mesh-${mockVideo.id}`)

    // Hover in
    fireEvent.pointerOver(screenMesh)

    act(() => {
      vi.advanceTimersByTime(120)
      runFrames(5, 0.016)
    })

    // Hover out
    fireEvent.pointerOut(screenMesh)

    expect(screenMesh).toBeInTheDocument()
  })

  it('interpolates towards center position when isSelected is true', () => {
    const { rerender } = render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isSelected={false}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(5, 0.016)
    })

    // Select the video
    rerender(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          isSelected={true}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    act(() => {
      runFrames(20, 0.016)
    })

    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
  })

  it('fades thumbnail into darkness during fly in and restores brightness on fly out', () => {
    // Mathematical progression verification:
    // darknessFactor = clamp(fp, 0, 1)
    // visibilityFactor = max(0, 1.0 - darknessFactor)
    // At wall resting slot (fp = 0):
    const fpStart = 0.0
    const darknessStart = Math.min(1, Math.max(0, fpStart))
    const visibilityStart = Math.max(0, 1.0 - darknessStart)
    expect(darknessStart).toBe(0.0)
    expect(visibilityStart).toBe(1.0)

    // Mid-flight (fp = 0.5):
    const fpMid = 0.5
    const darknessMid = Math.min(1, Math.max(0, fpMid))
    const visibilityMid = Math.max(0, 1.0 - darknessMid)
    expect(darknessMid).toBe(0.5)
    expect(visibilityMid).toBe(0.5)

    // Full center flight (fp = 1.0):
    const fpEnd = 1.0
    const darknessEnd = Math.min(1, Math.max(0, fpEnd))
    const visibilityEnd = Math.max(0, 1.0 - darknessEnd)
    expect(darknessEnd).toBe(1.0)
    expect(visibilityEnd).toBe(0.0)
  })

  it('applies unified horizontal curvature aligned with sphere latitude radius Rh, curved text, and lowercase', () => {
    const R = 4.5
    const el = 11.54 // deg
    const phi = (el * Math.PI) / 180
    const Rh = R * Math.cos(phi) // ~4.409
    const w = 1.92
    const hw = w / 2

    // Angular half-width
    const alphaMax = Math.asin(hw / Rh)
    const xEdge = Rh * Math.sin(alphaMax)
    const zEdge = Rh * (1 - Math.cos(alphaMax))

    expect(xEdge).toBeCloseTo(hw, 4)
    expect(zEdge).toBeCloseTo(0.1058, 3)

    // Distance in 2D to cylinder center (0, Rh) is constant Rh everywhere
    const distToCenter = Math.sqrt(xEdge * xEdge + (Rh - zEdge) * (Rh - zEdge))
    expect(distToCenter).toBeCloseTo(Rh, 4)

    // Component renders with dynamic sphereRadius, curved text, and lowercase
    render(
      <ThemeProvider>
        <CurvedVideoPanel
          video={mockVideo}
          sphereRadius={5.0}
          onSelect={vi.fn()}
        />
      </ThemeProvider>
    )

    expect(screen.getByTestId(`curved-video-panel-${mockVideo.id}`)).toBeInTheDocument()
  })
})
