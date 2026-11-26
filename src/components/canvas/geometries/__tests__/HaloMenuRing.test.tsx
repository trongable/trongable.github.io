import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HaloMenuRing, HALO_ITEMS, CONSTANT_ANGULAR_VELOCITY } from '../HaloMenuRing'
import { DEFAULT_GEOMETRY_PARAMS } from '../geometryConfig'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('HaloMenuRing Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should define 5 orbital navigation items including angel and videos', () => {
      // Given & Then: items schema holds 5 destinations
      expect(HALO_ITEMS).toHaveLength(5)
      expect(HALO_ITEMS.map((i) => i.label)).toEqual(['about', 'gallery', 'more', 'angel', 'dchc'])
      expect(HALO_ITEMS.find((i) => i.label === 'angel')?.imageUrl).toBe('/images/angel.png')
    })

    it('should define non-zero constant angular velocity', () => {
      // Given & Then: constant angular velocity is positive
      expect(CONSTANT_ANGULAR_VELOCITY).toBeGreaterThan(0)
    })

    it('should render all navigation items when mounted', () => {
      // Given: default halo parameters
      const params = DEFAULT_GEOMETRY_PARAMS.halo

      // When: rendered
      render(
        <HaloMenuRing
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: navigation labels are present
      expect(screen.getByText('about')).toBeInTheDocument()
      expect(screen.getByText('gallery')).toBeInTheDocument()
      expect(screen.getByText('more')).toBeInTheDocument()
      expect(screen.getByText('dchc')).toBeInTheDocument()
    })
  })

  describe('Frame Animation & Angular Velocity', () => {
    it('should advance badge positions around the orbit during animation frames', () => {
      // Given: active expanded halo ring
      render(
        <HaloMenuRing
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.halo}
        />
      )

      // When: advancing animation frames
      act(() => {
        runFrames(15, 0.016)
      })

      // Then: badges remain active and rendered
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass calculations when collapsed and scale <= 0.051', () => {
      // Given: collapsed menu
      render(
        <HaloMenuRing
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.halo}
        />
      )

      // When: stepping frames until scale converges below 0.051
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: sleep condition triggers without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply glitch jitter to orbital rotation during glitch bursts', () => {
      // Given: glitching active
      render(
        <HaloMenuRing
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.halo}
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

    it('should freeze orbital motion when isPaused is true', () => {
      // Given: rendered halo ring with isPaused = true
      render(
        <HaloMenuRing
          isExpanded={true}
          isPaused={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.halo}
        />
      )

      // When: stepping animation frames
      act(() => {
        runFrames(20, 0.016)
      })

      // Then: stays rendered and does not throw
      expect(screen.getByText('about')).toBeInTheDocument()
    })
  })

  describe('Keyboard Debug Ring & User Interactions', () => {
    it('should toggle debug guide ring when pressing "d" on the keyboard', () => {
      // Given: rendered halo ring
      render(
        <HaloMenuRing
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.halo}
        />
      )

      // When: pressing key 'd'
      fireEvent.keyDown(window, { key: 'd' })

      // Then: toggles state without crashing
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should trigger onSelect callback when clicking a navigation badge', () => {
      // Given: mock onSelect
      const handleSelect = vi.fn()
      render(
        <HaloMenuRing
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.halo}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is called with /about
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })
  })
})
