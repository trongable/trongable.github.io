import { describe, it, expect } from 'vitest'
import { computeStarColors } from '../ParticleField'

describe('ParticleField computeStarColors', () => {
  const count = 10
  // Mock metadata: [brightness = 0.85, whiteCore = 0.25, jitter = 0.0]
  const particleMeta = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    particleMeta[i * 3] = 0.85
    particleMeta[i * 3 + 1] = 0.25
    particleMeta[i * 3 + 2] = 0.0
  }

  it('computes Teal (#83d4d4) star colors with dominant green and blue channels over red', () => {
    const colors = computeStarColors(count, '#83d4d4', particleMeta)
    expect(colors.length).toBe(count * 3)

    for (let i = 0; i < count; i++) {
      const r = colors[i * 3]
      const g = colors[i * 3 + 1]
      const b = colors[i * 3 + 2]

      expect(g).toBeGreaterThan(r)
      expect(b).toBeGreaterThan(r)
      expect(g).toBeCloseTo(b, 5)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(1)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(1)
    }
  })

  it('computes Purple (#d4adf0) star colors with dominant blue and red channels over green', () => {
    const colors = computeStarColors(count, '#d4adf0', particleMeta)

    for (let i = 0; i < count; i++) {
      const r = colors[i * 3]
      const g = colors[i * 3 + 1]
      const b = colors[i * 3 + 2]

      expect(b).toBeGreaterThan(g)
      expect(r).toBeGreaterThan(g)
      expect(b).toBeGreaterThan(r)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(1)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThanOrEqual(1)
    }
  })

  it('computes Volt Yellow (#e2f872) star colors with high green and red', () => {
    const colors = computeStarColors(count, '#e2f872', particleMeta)

    for (let i = 0; i < count; i++) {
      const r = colors[i * 3]
      const g = colors[i * 3 + 1]
      const b = colors[i * 3 + 2]

      expect(g).toBeGreaterThan(b)
      expect(r).toBeGreaterThan(b)
    }
  })
})
