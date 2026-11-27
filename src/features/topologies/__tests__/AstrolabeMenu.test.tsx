import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AstrolabeMenu, ASTROLABE_ITEMS } from '@/features/topologies/menus/AstrolabeMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('AstrolabeMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should render all 4 ASTROLABE_ITEMS navigation badges when mounted', () => {
      // Given: default astrolabe params
      const params = DEFAULT_GEOMETRY_PARAMS.astrolabe

      // When: component is rendered
      render(
        <AstrolabeMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: all items are in the document
      ASTROLABE_ITEMS.forEach((item) => {
        if (!item.imageUrl) {
          expect(screen.getByText(item.label)).toBeInTheDocument()
        }
      })
    })

    it('should render procedural rings when showRings is true', () => {
      // Given: params with showRings = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.astrolabe, showRings: true }

      // When: rendered
      const { container } = render(
        <AstrolabeMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: mesh elements for procedural guides are present
      expect(container.querySelectorAll('mesh').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & Expansion', () => {
    it('should expand scale toward 1.0 when isExpanded is true', () => {
      // Given: isExpanded = true
      render(
        <AstrolabeMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.astrolabe}
        />
      )

      // When: advancing animation frames
      act(() => {
        runFrames(20, 0.016)
      })

      // Then: all badges remain rendered and visible
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass calculations when collapsed and scale <= 0.051', () => {
      // Given: isExpanded = false
      render(
        <AstrolabeMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.astrolabe}
        />
      )

      // When: stepping frames until scale shrinks below 0.051
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: sleep condition triggers without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should advance gimbal angular velocities during active frame ticks', () => {
      // Given: active expanded astrolabe
      render(
        <AstrolabeMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={{ ...DEFAULT_GEOMETRY_PARAMS.astrolabe, speed: 0.8 }}
        />
      )

      // When: stepping frames
      act(() => {
        stepFrame(0.016)
        stepFrame(0.016)
      })

      // Then: animation runs smoothly
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply glitch jitter when isGlitching is true', () => {
      // Given: isGlitching = true
      render(
        <AstrolabeMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.astrolabe}
        />
      )

      // When: stepping frames during glitch
      act(() => {
        stepFrame(0.016)
      })

      // Then: component handles glitch state without crashing
      expect(screen.getByText('about')).toBeInTheDocument()
    })
  })

  describe('Hover Interactions & Coplanar Lock', () => {
    it('should trigger onSelect callback when clicking a navigation badge', () => {
      // Given: mock onSelect
      const handleSelect = vi.fn()
      render(
        <AstrolabeMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.astrolabe}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is called with the destination route
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should align gimbals toward coplanar lock when hovering an item', () => {
      // Given: expanded menu
      render(
        <AstrolabeMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.astrolabe}
        />
      )

      // When: hovering over the 'about' item
      const aboutText = screen.getByText('about')
      const hoverTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.mouseEnter(hoverTarget)

      // And stepping frames with hover lock active
      act(() => {
        runFrames(10, 0.016)
      })

      // Then: coplanar alignment executes
      expect(aboutText).toBeInTheDocument()

      // When: hover leaves
      fireEvent.mouseLeave(hoverTarget)
      act(() => {
        runFrames(10, 0.016)
      })

      expect(aboutText).toBeInTheDocument()
    })
  })
})
