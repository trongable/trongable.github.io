/**
 * Color utility functions for hex parsing, RGB/HSL conversions,
 * automatic companion highlight color computation, and contrast ratios.
 */

export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false
  const clean = hex.trim().replace(/^#/, '')
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)
}

export function normalizeHex(hex: string): string | null {
  if (!isValidHex(hex)) return null
  const clean = hex.trim().replace(/^#/, '').toLowerCase()
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
  }
  return `#${clean}`
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const clean = normalized.slice(1)
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [r, g, b]
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6
        break
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6
        break
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6
        break
    }
  }

  return [h * 360, s, l]
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hNorm = (h % 360 + 360) % 360 / 360

  if (s === 0) {
    const val = Math.round(l * 255)
    return [val, val, val]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t
    if (tNorm < 0) tNorm += 1
    if (tNorm > 1) tNorm -= 1
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm
    if (tNorm < 1 / 2) return q
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255)
  const g = Math.round(hue2rgb(p, q, hNorm) * 255)
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255)

  return [r, g, b]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Computes an aligned companion highlight color from a primary hex code.
 * Preserves the exact tonal hue, while scaling lightness so the color achieves
 * crisp, luminous contrast (>6:1) against dark backgrounds (#1c1b22).
 */
export function computeHighlightColor(primaryHex: string): string {
  const rgb = hexToRgb(primaryHex)
  if (!rgb) return '#f5ff9e' // Fallback to default neon highlight

  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2])

  // If primary is dark/mid-tone (L < 0.55), lift lightness to at least 0.68
  // If primary is already bright (L >= 0.55), gently boost lightness up to 0.92
  const targetL = l < 0.55 ? Math.min(0.88, Math.max(l + 0.22, 0.68)) : Math.min(0.92, l + 0.12)

  // Maintain or gently boost saturation for vibrant neon pop
  const targetS = Math.min(1.0, Math.max(0.15, s * 1.05))

  const [outR, outG, outB] = hslToRgb(h, targetS, targetL)
  return rgbToHex(outR, outG, outB)
}

function sRgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const rLin = sRgbToLinear(rgb[0])
  const gLin = sRgbToLinear(rgb[1])
  const bLin = sRgbToLinear(rgb[2])
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

export function getContrastRatio(fgHex: string, bgHex: string = '#1c1b22'): number {
  const l1 = getRelativeLuminance(fgHex)
  const l2 = getRelativeLuminance(bgHex)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(1))
}
