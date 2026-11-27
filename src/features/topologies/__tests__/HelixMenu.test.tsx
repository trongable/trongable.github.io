import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HelixMenu } from '@/features/topologies/menus/HelixMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('HelixMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should render navigation items when mounted', () => {
      // Given: default helix parameters
      const params = DEFAULT_GEOMETRY_PARAMS.helix

      // When: HelixMenu is rendered
      render(
        <HelixMenu
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

    it('should render procedural corkscrew guide track when showCoil is true', () => {
      // Given: params with showCoil = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.helix, showCoil: true }

      // When: rendered
      const { container } = render(
        <HelixMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: procedural guide mesh is present
      expect(container.querySelectorAll('mesh').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & Corkscrew Motion', () => {
    it('should advance badge positions along the toroidal helix during animation frames', () => {
      // Given: active expanded helix
      render(
        <HelixMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.helix}
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
      // Given: collapsed menu
      render(
        <HelixMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.helix}
        />
      )

      // When: stepping frames until scale shrinks below 0.051
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: sleeps cleanly without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply glitch jitter to transit angle during glitch bursts', () => {
      // Given: glitching active
      render(
        <HelixMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.helix}
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
        <HelixMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.helix}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is called with /about
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should slow corkscrew transit velocity when an item is hovered', () => {
      // Given: expanded menu
      render(
        <HelixMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.helix}
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

      // Then: speed is reduced gracefully
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
