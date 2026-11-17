import { describe, it, expect } from 'vitest'
import { scrambleGlyphs, SCRAMBLE_GLYPHS, HALO_ITEMS, CONSTANT_ANGULAR_VELOCITY } from '../HaloMenuRing'

describe('HaloMenuRing Topology', () => {
  it('defines 3 primary orbital navigation items', () => {
    expect(HALO_ITEMS).toHaveLength(3)
    expect(HALO_ITEMS.map((i) => i.label)).toEqual(['about', 'more', 'dchc'])
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

  it('returns original string when count is 0 or string is empty', () => {
    expect(scrambleGlyphs('test', 0)).toBe('test')
    expect(scrambleGlyphs('', 2)).toBe('')
  })
})
