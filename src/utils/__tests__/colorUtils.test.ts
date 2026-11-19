import { describe, it, expect } from 'vitest'
import {
  isValidHex,
  normalizeHex,
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  computeHighlightColor,
  getContrastRatio,
} from '../colorUtils'

describe('colorUtils', () => {
  it('validates 3- and 6-digit hex strings', () => {
    expect(isValidHex('#fff')).toBe(true)
    expect(isValidHex('fff')).toBe(true)
    expect(isValidHex('#639191')).toBe(true)
    expect(isValidHex('639191')).toBe(true)
    expect(isValidHex('#gggggg')).toBe(false)
    expect(isValidHex('1234')).toBe(false)
    expect(isValidHex('')).toBe(false)
  })

  it('normalizes hex strings with leading # and lowercase 6 digits', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff')
    expect(normalizeHex('abc')).toBe('#aabbcc')
    expect(normalizeHex('#766482')).toBe('#766482')
    expect(normalizeHex('invalid')).toBeNull()
  })

  it('converts hex to RGB', () => {
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    expect(hexToRgb('#639191')).toEqual([99, 145, 145])
    expect(hexToRgb('invalid')).toBeNull()
  })

  it('converts RGB to hex', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
    expect(rgbToHex(99, 145, 145)).toBe('#639191')
  })

  it('roundtrips RGB and HSL conversions accurately', () => {
    const originalRgb: [number, number, number] = [118, 100, 130]
    const [h, s, l] = rgbToHsl(...originalRgb)
    const [r, g, b] = hslToRgb(h, s, l)
    expect(Math.abs(r - originalRgb[0])).toBeLessThanOrEqual(1)
    expect(Math.abs(g - originalRgb[1])).toBeLessThanOrEqual(1)
    expect(Math.abs(b - originalRgb[2])).toBeLessThanOrEqual(1)
  })

  it('computes companion highlight colors with higher lightness and preserved hue', () => {
    // Dark teal #2e6f70 (L ~0.31) -> should lift lightness to >= 0.68
    const highlightTeal = computeHighlightColor('#2e6f70')
    expect(isValidHex(highlightTeal)).toBe(true)
    const [r1, g1, b1] = hexToRgb('#2e6f70')!
    const [r2, g2, b2] = hexToRgb(highlightTeal)!
    const [, , l1] = rgbToHsl(r1, g1, b1)
    const [, , l2] = rgbToHsl(r2, g2, b2)
    expect(l2).toBeGreaterThan(l1)
    expect(l2).toBeGreaterThanOrEqual(0.65)

    // Neon yellow #e2f872 (already bright) -> lifts lightness further
    const highlightYellow = computeHighlightColor('#e2f872')
    expect(isValidHex(highlightYellow)).toBe(true)
  })

  it('calculates contrast ratios against background', () => {
    const contrast = getContrastRatio('#ffffff', '#1c1b22')
    expect(contrast).toBeGreaterThan(10)
    const darkContrast = getContrastRatio('#1c1b22', '#1c1b22')
    expect(darkContrast).toBe(1.0)
  })
})
