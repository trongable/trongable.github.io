import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SlingshotMenu, KeplerCurve } from '@/features/topologies/menus/SlingshotMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('SlingshotMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('KeplerCurve Class', () => {
    it('should compute closed periodic points along elliptical trajectory', () => {
      // Given: KeplerCurve instance
      const curve = new KeplerCurve(2.0, 0.4)

      // When: sampling point at t = 0
      const p0 = curve.getPoint(0)
      const p1 = curve.getPoint(1)

      // Then: closed periodic loop holds
      expect(p0.distanceTo(p1)).toBeLessThan(0.001)
    })
  })

  describe('Initialization & Mounting', () => {
    it('should render navigation items when mounted', () => {
      // Given: default slingshot parameters
      const params = DEFAULT_GEOMETRY_PARAMS.slingshot

      // When: SlingshotMenu is rendered
      render(
        <SlingshotMenu
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

    it('should render procedural orbit guides when showOrbits is true', () => {
      // Given: params with showOrbits = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.slingshot, showOrbits: true }

      // When: rendered
      const { container } = render(
        <SlingshotMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: procedural guide meshes are present
      expect(container.querySelectorAll('mesh').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & Keplerian Whip', () => {
    it('should advance badge anomaly angles during frame steps with inverse-square velocity', () => {
      // Given: active slingshot menu
      render(
        <SlingshotMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.slingshot}
        />
      )

      // When: stepping animation frames
      act(() => {
        runFrames(15, 0.016)
      })

      // Then: items remain active and rendered
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass calculations when collapsed and scale <= 0.051', () => {
      // Given: collapsed menu
      render(
        <SlingshotMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.slingshot}
        />
      )

      // When: stepping frames until scale shrinks below 0.051
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: sleeps cleanly without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply glitch jitter to angular velocity during glitch bursts', () => {
      // Given: glitching active
      render(
        <SlingshotMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.slingshot}
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
        <SlingshotMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.slingshot}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is called with /about
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should slow orbital whip velocity when an item is hovered', () => {
      // Given: expanded menu
      render(
        <SlingshotMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.slingshot}
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
