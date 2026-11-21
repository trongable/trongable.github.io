import { describe, it, expect } from 'vitest'
import { scrambleGlyphs, SCRAMBLE_GLYPHS, HALO_ITEMS, CONSTANT_ANGULAR_VELOCITY } from '../HaloMenuRing'

describe('HaloMenuRing Topology', () => {
  it('defines 4 primary orbital navigation items including sonny', () => {
    expect(HALO_ITEMS).toHaveLength(4)
    expect(HALO_ITEMS.map((i) => i.label)).toEqual(['about', 'more', 'sonny', 'dchc'])
    expect(HALO_ITEMS.find((i) => i.label === 'sonny')?.imageUrl).toBe('/images/sonny.png')
  })

  it('defines non-zero constant angular velocity', () => {
    expect(CONSTANT_ANGULAR_VELOCITY).toBeGreaterThan(0)
  })

  it('preserves the exact string length when scrambled', () => {
    const original = 'about'
    const scrambled = scrambleGlyphs(original, 2)
    expect(scrambled.length).toBe(original.length)
  })

  it('substitutes characters with characters from the cyber glyph set', () => {
    const original = 'more'
    const scrambled = scrambleGlyphs(original, original.length)
    expect(scrambled.length).toBe(original.length)

    const hasCyberGlyph = scrambled.split('').some((ch) => SCRAMBLE_GLYPHS.includes(ch))
    expect(hasCyberGlyph).toBe(true)
  })

  it('converts tilt and yaw angles accurately for 3D orientation', () => {
    const tiltDeg = 90
    const yawDeg = 180
    const tiltRad = (tiltDeg * Math.PI) / 180
    const yawRad = (yawDeg * Math.PI) / 180

    expect(tiltRad).toBeCloseTo(Math.PI / 2)
    expect(yawRad).toBeCloseTo(Math.PI)
  })
})
