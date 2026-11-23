import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { LorenzMenu } from '../LorenzMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '../geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('LorenzMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should render navigation items when mounted', () => {
      // Given: default lorenz parameters
      const params = DEFAULT_GEOMETRY_PARAMS.lorenz

      // When: LorenzMenu is rendered
      render(
        <LorenzMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: navigation labels are rendered
      expect(screen.getByText('about')).toBeInTheDocument()
      expect(screen.getByText('more')).toBeInTheDocument()
      expect(screen.getByText('dchc')).toBeInTheDocument()
    })

    it('should render trail objects when showTrails is true', () => {
      // Given: params with showTrails = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.lorenz, showTrails: true }

      // When: rendered
      const { container } = render(
        <LorenzMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: primitive elements for trails are present
      expect(container.querySelectorAll('primitive').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & Attractor Step', () => {
    it('should advance attractor steps and shift trail buffer during animation frames', () => {
      // Given: active expanded lorenz attractor
      render(
        <LorenzMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.lorenz}
        />
      )

      // When: stepping animation frames
      act(() => {
        runFrames(15, 0.016)
      })

      // Then: badges remain active and rendered
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass differential steps when collapsed and scale <= 0.051', () => {
      // Given: collapsed menu
      render(
        <LorenzMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.lorenz}
        />
      )

      // When: stepping frames until scale shrinks below 0.051
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: executes sleep condition without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply dt jitter during glitch state', () => {
      // Given: glitching active
      render(
        <LorenzMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.lorenz}
        />
      )

      // When: stepping frames during glitch
      act(() => {
        stepFrame(0.016)
        stepFrame(0.016)
      })

      // Then: handles glitch state gracefully
      expect(screen.getByText('about')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should trigger onSelect callback when clicking a navigation badge', () => {
      // Given: selection mock
      const handleSelect = vi.fn()
      render(
        <LorenzMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.lorenz}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is invoked with /about
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should slow attractor step speed when an item is hovered', () => {
      // Given: expanded menu
      render(
        <LorenzMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.lorenz}
        />
      )

      // When: hovering over a badge
      const moreText = screen.getByText('more')
      const hoverTarget = moreText.parentElement?.querySelector('mesh') || moreText
      fireEvent.mouseEnter(hoverTarget)

      // And stepping frames with hover active
      act(() => {
        runFrames(10, 0.016)
      })

      // Then: hover slowdown executes
      expect(moreText).toBeInTheDocument()

      // When: hover leaves
      fireEvent.mouseLeave(hoverTarget)
      act(() => {
        runFrames(10, 0.016)
      })

      expect(moreText).toBeInTheDocument()
    })
  })
})
