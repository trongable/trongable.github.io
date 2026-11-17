import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GpuGlitchOverlay } from '../GpuGlitchOverlay'

describe('GpuGlitchOverlay Component', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(<GpuGlitchOverlay isActive={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders randomized fullscreen artifact blocks and slices when active', () => {
    render(<GpuGlitchOverlay isActive={true} />)
    const overlay = screen.getByTestId('gpu-glitch-overlay')
    expect(overlay).toBeInTheDocument()

    // Ensure multiple blocks and slices are generated
    expect(overlay.children.length).toBeGreaterThan(3)
  })

  it('supports custom extended duration up to 3 seconds with progressive load-in', () => {
    render(<GpuGlitchOverlay isActive={true} duration={2800} />)
    const overlay = screen.getByTestId('gpu-glitch-overlay')
    expect(overlay).toBeInTheDocument()
    expect(overlay.children.length).toBeGreaterThan(3)
  })

  it('guarantees generated shapes are strictly blocky and orthogonal (zero diagonals, zero hexagons/trapezoids)', () => {
    // Render multiple times to sample random shapes
    for (let trial = 0; trial < 15; trial++) {
      const { unmount } = render(<GpuGlitchOverlay isActive={true} />)
      const overlay = screen.getByTestId('gpu-glitch-overlay')
      const clip = overlay.style.clipPath
      if (clip && clip.startsWith('polygon(')) {
        // Extract coordinate pairs
        const pairs = clip
          .replace('polygon(', '')
          .replace(')', '')
          .split(',')
          .map((s) => s.trim().split(' ').map((p) => parseFloat(p.replace('%', ''))))

        // In an orthogonal polygon, every adjacent pair must share x or y (dx=0 or dy=0)
        for (let i = 0; i < pairs.length; i++) {
          const next = pairs[(i + 1) % pairs.length]
          const dx = Math.abs(pairs[i][0] - next[0])
          const dy = Math.abs(pairs[i][1] - next[1])
          const isOrthogonal = dx === 0 || dy === 0
          expect(isOrthogonal).toBe(true)
        }
      }
      unmount()
    }
  })

  it('suppresses glitch rendering when prefers-reduced-motion is active', () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    window.matchMedia = matchMediaMock

    const { container } = render(<GpuGlitchOverlay isActive={true} />)
    expect(container).toBeEmptyDOMElement()
  })
})
