import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MenuItemBadge } from '../MenuItemBadge'

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
})
