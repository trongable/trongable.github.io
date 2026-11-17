import { describe, it, expect } from 'vitest'
import { scrambleGlyphs, SCRAMBLE_GLYPHS } from '@/utils/glyphUtils'

describe('glyphUtils', () => {
  it('preserves text length when scrambling', () => {
    const text = 'welcome'
    const scrambled = scrambleGlyphs(text, 2)
    expect(scrambled).toHaveLength(text.length)
  })

  it('returns original text if count <= 0 or text is empty', () => {
    expect(scrambleGlyphs('test', 0)).toBe('test')
    expect(scrambleGlyphs('', 2)).toBe('')
  })

  it('uses glyphs from SCRAMBLE_GLYPHS by default', () => {
    const text = 'a'
    const scrambled = scrambleGlyphs(text, 1)
    expect(SCRAMBLE_GLYPHS).toContain(scrambled)
  })

  it('supports custom glyphs array', () => {
    const custom = ['X', 'Y', 'Z']
    const scrambled = scrambleGlyphs('hello', 3, custom)
    expect(scrambled).toHaveLength(5)
    const diffChars = scrambled.split('').filter((c, i) => c !== 'hello'[i])
    diffChars.forEach((c) => {
      expect(custom).toContain(c)
    })
  })
})
