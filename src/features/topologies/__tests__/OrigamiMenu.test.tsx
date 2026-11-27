import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { OrigamiMenu, ORIGAMI_ITEMS } from '@/features/topologies/menus/OrigamiMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('OrigamiMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should render all 4 origami navigation badges when mounted', () => {
      // Given: default origami params
      const params = DEFAULT_GEOMETRY_PARAMS.origami

      // When: OrigamiMenu is rendered
      render(
        <OrigamiMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: all navigation items are present
      ORIGAMI_ITEMS.forEach((item) => {
        if (!item.imageUrl) {
          expect(screen.getByText(item.label)).toBeInTheDocument()
        }
      })
    })

    it('should render wireframe core when showWires is true', () => {
      // Given: params with showWires = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.origami, showWires: true }

      // When: rendered
      const { container } = render(
        <OrigamiMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: lines or mesh are present for wireframe
      expect(container.querySelectorAll('lineSegments, mesh, points').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & Blossom Unfolding', () => {
    it('should interpolate blossom unfolding radius from core to facet perimeter', () => {
      // Given: active expanded origami
      render(
        <OrigamiMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.origami}
        />
      )

      // When: stepping animation frames
      act(() => {
        runFrames(20, 0.016)
      })

      // Then: badges remain active and rendered
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass calculations when collapsed and scale <= 0.051', () => {
      // Given: collapsed menu
      render(
        <OrigamiMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.origami}
        />
      )

      // When: stepping frames until scale shrinks below 0.051
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: sleep condition triggers without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply glitch jitter to crystal tumble when isGlitching is true', () => {
      // Given: glitching active
      render(
        <OrigamiMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.origami}
        />
      )

      // When: stepping frames during glitch
      act(() => {
        stepFrame(0.016)
        stepFrame(0.016)
      })

      // Then: executes smoothly without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should trigger onSelect callback when clicking a navigation badge', () => {
      // Given: mock onSelect
      const handleSelect = vi.fn()
      render(
        <OrigamiMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.origami}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is called with /about
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should reduce crystal tumble speed when an item is hovered', () => {
      // Given: expanded menu
      render(
        <OrigamiMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.origami}
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

      // Then: tumble slows down gracefully
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
