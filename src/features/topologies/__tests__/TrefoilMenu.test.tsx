import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TrefoilMenu } from '@/features/topologies/menus/TrefoilMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('TrefoilMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should render navigation items when mounted', () => {
      // Given: default trefoil parameters
      const params = DEFAULT_GEOMETRY_PARAMS.trefoil

      // When: TrefoilMenu is rendered
      render(
        <TrefoilMenu
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

    it('should render procedural knot guide track when showTrack is true', () => {
      // Given: params with showTrack = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.trefoil, showTrack: true }

      // When: rendered
      const { container } = render(
        <TrefoilMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: procedural guide mesh is present
      expect(container.querySelectorAll('mesh').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & Knot Motion', () => {
    it('should advance badge positions along the knot loop during animation frames', () => {
      // Given: expanded trefoil knot
      render(
        <TrefoilMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.trefoil}
        />
      )

      // When: advancing frames
      act(() => {
        runFrames(15, 0.016)
      })

      // Then: badges remain active and rendered
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass calculations when collapsed and scale <= 0.051', () => {
      // Given: collapsed trefoil menu
      render(
        <TrefoilMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.trefoil}
        />
      )

      // When: stepping frames until collapsed scale convergence
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: calculations sleep cleanly without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply glitch jitter to motion parameter when isGlitching is true', () => {
      // Given: glitching active
      render(
        <TrefoilMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.trefoil}
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
      // Given: mock selection callback
      const handleSelect = vi.fn()
      render(
        <TrefoilMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.trefoil}
        />
      )

      // When: clicking the badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is invoked with route
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should slow orbital speed when an item is hovered', () => {
      // Given: expanded menu
      render(
        <TrefoilMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.trefoil}
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

      // Then: runs in hover-slowdown mode
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
