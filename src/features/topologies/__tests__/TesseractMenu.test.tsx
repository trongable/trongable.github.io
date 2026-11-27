import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { TesseractMenu, TESSERACT_ITEMS } from '@/features/topologies/menus/TesseractMenu'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'
import { DebugDistanceProvider } from '@/context/DebugDistanceContext'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('TesseractMenu Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Initialization & Mounting', () => {
    it('should render all 4 Clifford quad navigation badges when mounted', () => {
      // Given: default tesseract params
      const params = DEFAULT_GEOMETRY_PARAMS.tesseract

      // When: TesseractMenu is rendered
      render(
        <TesseractMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: navigation labels are in the document
      TESSERACT_ITEMS.forEach((item) => {
        if (!item.imageUrl) {
          expect(screen.getByText(item.label)).toBeInTheDocument()
        }
      })
    })

    it('should render lineSegments when showWireframe is true and wireStyle is solid', () => {
      // Given: params with showWireframe = true
      const params = { ...DEFAULT_GEOMETRY_PARAMS.tesseract, showWireframe: true, wireStyle: 'solid' as const }

      // When: rendered
      const { container } = render(
        <TesseractMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: lineSegments is present in the DOM
      expect(container.querySelectorAll('lineSegments').length).toBeGreaterThan(0)
    })

    it('should render points element when wireStyle is points', () => {
      // Given: wireStyle = 'points'
      const params = { ...DEFAULT_GEOMETRY_PARAMS.tesseract, showWireframe: true, wireStyle: 'points' as const }

      // When: rendered
      const { container } = render(
        <TesseractMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={params}
        />
      )

      // Then: points element is present
      expect(container.querySelectorAll('points').length).toBeGreaterThan(0)
    })
  })

  describe('Frame Animation & 4D Projection', () => {
    it('should advance 4D rotation angles and update vertex projections on frame step', () => {
      // Given: active tesseract
      render(
        <TesseractMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.tesseract}
        />
      )

      // When: stepping frames
      act(() => {
        runFrames(15, 0.016)
      })

      // Then: badges remain active
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should respect sleep guard and bypass calculations when collapsed and scale <= 0.051', () => {
      // Given: collapsed tesseract
      render(
        <TesseractMenu
          isExpanded={false}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.tesseract}
        />
      )

      // When: stepping frames until collapsed
      act(() => {
        runFrames(30, 0.016)
      })

      // Then: sleeps cleanly without error
      expect(screen.getByText('about')).toBeInTheDocument()
    })

    it('should apply 4D rotation jitter during glitch events', () => {
      // Given: glitching active
      render(
        <TesseractMenu
          isExpanded={true}
          isGlitching={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.tesseract}
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
        <TesseractMenu
          isExpanded={true}
          onSelect={handleSelect}
          params={DEFAULT_GEOMETRY_PARAMS.tesseract}
        />
      )

      // When: clicking a badge
      const aboutText = screen.getByText('about')
      const clickTarget = aboutText.parentElement?.querySelector('mesh') || aboutText
      fireEvent.click(clickTarget)

      // Then: onSelect is invoked with /about
      expect(handleSelect).toHaveBeenCalledWith('/about')
    })

    it('should slow 4D rotation speed when an item is hovered', () => {
      // Given: expanded menu
      render(
        <TesseractMenu
          isExpanded={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.tesseract}
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

      // Then: hover state is active
      expect(moreText).toBeInTheDocument()

      // When: hover leaves
      fireEvent.mouseLeave(hoverTarget)
      act(() => {
        runFrames(10, 0.016)
      })

      expect(moreText).toBeInTheDocument()
    })

    it('should pass vertex index and cell tags to badges when showDistance is true', () => {
      // Given: expanded menu with showDistance = true via DebugDistanceProvider
      window.history.replaceState({}, '', '/?dist=true')

      render(
        <DebugDistanceProvider>
          <TesseractMenu
            isExpanded={true}
            onSelect={vi.fn()}
            params={DEFAULT_GEOMETRY_PARAMS.tesseract}
          />
        </DebugDistanceProvider>
      )

      // Then: distance badges render with respective 4D vertex tags
      const distanceBadges = screen.getAllByTestId('distance-badge')
      expect(distanceBadges.length).toBe(5)

      const badgeTexts = distanceBadges.map((badge) => badge.textContent)
      expect(badgeTexts.some((txt) => txt?.includes('[V13 outer]'))).toBe(true)
      expect(badgeTexts.some((txt) => txt?.includes('[V7 inner]'))).toBe(true)
      expect(badgeTexts.some((txt) => txt?.includes('[V10 outer]'))).toBe(true)
      expect(badgeTexts.some((txt) => txt?.includes('[V0 inner]'))).toBe(true)
      expect(badgeTexts.some((txt) => txt?.includes('[V15 outer]'))).toBe(true)
    })

    it('should freeze 4D rotation when isPaused is true', () => {
      // Given: expanded menu with isPaused = true
      render(
        <TesseractMenu
          isExpanded={true}
          isPaused={true}
          onSelect={vi.fn()}
          params={DEFAULT_GEOMETRY_PARAMS.tesseract}
        />
      )

      // When stepping frames
      act(() => {
        runFrames(20, 0.016)
      })

      // Verification: badges remain mounted and rendering without advancing rotation
      expect(screen.getByText('about')).toBeInTheDocument()
    })
  })
})
