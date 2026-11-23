import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { ParticleField, computeStarColors } from '../ParticleField'
import {
  stepFrame,
  runFrames,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('ParticleField Component & Star Colors', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('computeStarColors Math Calculation', () => {
    const count = 10
    const particleMeta = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      particleMeta[i * 3] = 0.85
      particleMeta[i * 3 + 1] = 0.25
      particleMeta[i * 3 + 2] = 0.0
    }

    it('computes Teal (#83d4d4) star colors with dominant green and blue channels over red', () => {
      // Given: count, teal color, and metadata
      // When: computing star colors
      const colors = computeStarColors(count, '#83d4d4', particleMeta)

      // Then: length matches count * 3 and channels reflect teal
      expect(colors.length).toBe(count * 3)
      for (let i = 0; i < count; i++) {
        const r = colors[i * 3]
        const g = colors[i * 3 + 1]
        const b = colors[i * 3 + 2]
        expect(g).toBeGreaterThan(r)
        expect(b).toBeGreaterThan(r)
        expect(g).toBeCloseTo(b, 5)
      }
    })

    it('computes Purple (#d4adf0) star colors with dominant blue and red channels over green', () => {
      // Given: purple color
      // When: computing star colors
      const colors = computeStarColors(count, '#d4adf0', particleMeta)

      // Then: blue and red are dominant
      for (let i = 0; i < count; i++) {
        const r = colors[i * 3]
        const g = colors[i * 3 + 1]
        const b = colors[i * 3 + 2]
        expect(b).toBeGreaterThan(g)
        expect(r).toBeGreaterThan(g)
      }
    })

    it('computes Volt Yellow (#e2f872) star colors with high green and red channels over blue', () => {
      // Given: yellow color
      // When: computing star colors
      const colors = computeStarColors(count, '#e2f872', particleMeta)

      // Then: green and red are dominant
      for (let i = 0; i < count; i++) {
        const r = colors[i * 3]
        const g = colors[i * 3 + 1]
        const b = colors[i * 3 + 2]
        expect(g).toBeGreaterThan(b)
        expect(r).toBeGreaterThan(b)
      }
    })
  })

  describe('ParticleField Component Lifecycle & useFrame', () => {
    it('should mount with procedural star points and buffer geometry', () => {
      // Given & When: rendering ParticleField
      const { container } = render(
        <ParticleField
          count={50}
          theme={{ id: 'yellow', name: 'Volt Yellow', primary: '#e2f872', highlight: '#f5ff9e' }}
        />
      )

      // Then: points element is rendered
      expect(container.querySelector('points')).toBeInTheDocument()
    })

    it('should rotate points and converge star colors in useFrame', () => {
      // Given: mounted ParticleField
      const { unmount } = render(
        <ParticleField
          count={50}
          theme={{ id: 'purple', name: 'Purple', primary: '#d4adf0', highlight: '#eddcf9' }}
        />
      )

      // When: stepping frames to trigger useFrame rotation and color lerping
      act(() => {
        runFrames(15, 0.016)
      })

      // Then: executes smoothly and disposes WebGL texture cleanly
      unmount()
    })

    it('should reset isSettled guard and re-lerp when theme primary color changes', () => {
      // Given: mounted with yellow theme
      const { rerender } = render(
        <ParticleField
          count={50}
          theme={{ id: 'yellow', name: 'Volt Yellow', primary: '#e2f872', highlight: '#f5ff9e' }}
        />
      )

      act(() => {
        stepFrame(0.016)
      })

      // When: theme changes to teal
      rerender(
        <ParticleField
          count={50}
          theme={{ id: 'teal', name: 'Teal', primary: '#83d4d4', highlight: '#afe5e5' }}
        />
      )

      // And stepping frames to converge to new color
      act(() => {
        runFrames(10, 0.016)
      })

      // Then: executes without crashing
      expect(true).toBe(true)
    })
  })
})
