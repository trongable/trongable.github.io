export interface GlitchBlock {
  id: string
  top: string
  left: string
  width: string
  height: string
  background: string
  mixBlendMode: 'difference' | 'screen' | 'normal' | 'exclusion'
  opacity: number
  transform: string
}

export interface GlitchSlice {
  id: string
  top: string
  height: string
  transform: string
  background: string
  mixBlendMode: 'difference' | 'screen' | 'normal'
}

export interface GlitchFrame {
  blocks: GlitchBlock[]
  slices: GlitchSlice[]
  showInversionFlash: boolean
  screenShiftX: number
}

export interface GlitchShape {
  clipPath?: string
  top: string
  left: string
  width: string
  height: string
}

export type LoadCurve = 'surge' | 'creep' | 'stepped' | 'linear'

// Procedural texture generators for corrupted GPU VRAM
const TEXTURE_GENERATORS = [
  // High-frequency neon primary & dark barcode
  (primary: string) =>
    `repeating-linear-gradient(90deg, ${primary} 0px, ${primary} ${2 + Math.floor(Math.random() * 3)}px, #1c1b22 ${2 + Math.floor(Math.random() * 3)}px, #1c1b22 ${6 + Math.floor(Math.random() * 4)}px)`,
  // Cyan & hot magenta VRAM memory stripe
  () =>
    `repeating-linear-gradient(90deg, #00f0ff 0px, #00f0ff ${2 + Math.floor(Math.random() * 3)}px, #ff0055 ${2 + Math.floor(Math.random() * 3)}px, #ff0055 ${5 + Math.floor(Math.random() * 4)}px, #1c1b22 ${5 + Math.floor(Math.random() * 4)}px, #1c1b22 ${9 + Math.floor(Math.random() * 4)}px)`,
  // High-contrast black & white binary stream
  () =>
    `repeating-linear-gradient(90deg, #ffffff 0px, #ffffff ${1 + Math.floor(Math.random() * 3)}px, #000000 ${1 + Math.floor(Math.random() * 3)}px, #000000 ${4 + Math.floor(Math.random() * 4)}px)`,
  // Horizontal CRT scanline drop
  (primary: string) =>
    `repeating-linear-gradient(0deg, ${primary} 0px, ${primary} 2px, transparent 2px, transparent ${4 + Math.floor(Math.random() * 6)}px)`,
  (primary: string) => primary,
  () => '#ff0055',
  () => '#00f0ff',
  () => '#ffffff',
  () => '#1c1b22',
  // Micro checkerboard artifact tile
  (primary: string) =>
    `repeating-conic-gradient(${primary} 0% 25%, #1c1b22 0% 50%) 50% / ${6 + Math.floor(Math.random() * 12)}px ${6 + Math.floor(Math.random() * 12)}px`,
]

/**
 * Generates strictly orthogonal (rectilinear) blocky overtake shapes.
 * Every edge is strictly horizontal (dy = 0) or vertical (dx = 0).
 * Absolutely ZERO diagonals, ZERO trapezoids, ZERO hexagons.
 */
export function generateBlockyShape(): GlitchShape {
  const shapeType = Math.random()

  // 1. Multi-Tier Stepped Staircase Blocks (~40% of triggers)
  if (shapeType < 0.40) {
    const quadrant = Math.floor(Math.random() * 4)

    if (quadrant === 0) {
      const x1 = Math.round(25 + Math.random() * 20)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(20 + Math.random() * 25)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)
      const poly = `polygon(${x1}% 100%, ${x1}% ${y2}%, ${x2}% ${y2}%, ${x2}% ${y1}%, 100% ${y1}%, 100% 100%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else if (quadrant === 1) {
      const x1 = Math.round(35 + Math.random() * 25)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(20 + Math.random() * 25)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)
      const poly = `polygon(0% 100%, 0% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y2}%, ${x2}% ${y2}%, ${x2}% 100%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else if (quadrant === 2) {
      const x1 = Math.round(25 + Math.random() * 20)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(35 + Math.random() * 20)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)
      const poly = `polygon(${x1}% 0%, 100% 0%, 100% ${y2}%, ${x2}% ${y2}%, ${x2}% ${y1}%, ${x1}% ${y1}%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else {
      const x1 = Math.round(35 + Math.random() * 20)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(30 + Math.random() * 20)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)
      const poly = `polygon(0% 0%, ${x2}% 0%, ${x2}% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y2}%, 0% ${y2}%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    }
  }

  // 2. Orthogonal L-Shaped & T-Shaped Block Clusters (~30% of triggers)
  if (shapeType < 0.70) {
    const isL = Math.random() > 0.5
    if (isL) {
      const x0 = Math.round(10 + Math.random() * 30)
      const x1 = Math.round(x0 + 25 + Math.random() * 20)
      const x2 = Math.round(x1 + 25 + Math.random() * 20)
      const y0 = Math.round(15 + Math.random() * 30)
      const y1 = Math.round(y0 + 25 + Math.random() * 20)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)
      const poly = `polygon(${x0}% ${y0}%, ${x2}% ${y0}%, ${x2}% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y2}%, ${x0}% ${y2}%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else {
      const x0 = Math.round(15 + Math.random() * 20)
      const x1 = Math.round(x0 + 20 + Math.random() * 15)
      const x2 = Math.round(x1 + 25 + Math.random() * 15)
      const x3 = Math.round(x2 + 20 + Math.random() * 15)
      const y0 = Math.round(15 + Math.random() * 25)
      const y1 = Math.round(y0 + 25 + Math.random() * 15)
      const y2 = Math.round(y1 + 35 + Math.random() * 20)
      const poly = `polygon(${x0}% ${y0}%, ${x3}% ${y0}%, ${x3}% ${y1}%, ${x2}% ${y1}%, ${x2}% ${y2}%, ${x1}% ${y2}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    }
  }

  // 3. Staggered Horizontal Memory Row Clusters (~15% of triggers)
  if (shapeType < 0.85) {
    const y0 = Math.round(20 + Math.random() * 30)
    const y1 = Math.round(y0 + 20 + Math.random() * 15)
    const y2 = Math.round(y1 + 20 + Math.random() * 15)
    const xMid = Math.round(35 + Math.random() * 30)
    const poly = `polygon(0% ${y0}%, 100% ${y0}%, 100% ${y1}%, ${xMid}% ${y1}%, ${xMid}% ${y2}%, 0% ${y2}%)`
    return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
  }

  // 4. Arbitrary Rectilinear Bounding Box (~15% of triggers)
  const top = Math.round(8 + Math.random() * 45)
  const left = Math.round(8 + Math.random() * 45)
  const width = Math.round(35 + Math.random() * 55)
  const height = Math.round(30 + Math.random() * 55)

  return {
    top: `${top}%`,
    left: `${left}%`,
    width: `${width}%`,
    height: `${height}%`,
  }
}

/**
 * Computes progressive load-in progress (0.0 to 1.0) based on randomized speed profile.
 */
export function computeLoadProgress(elapsed: number, duration: number, curve: LoadCurve): number {
  const linear = Math.min(Math.max(elapsed / duration, 0), 1.0)
  switch (curve) {
    case 'surge':
      return Math.pow(linear, 0.25)
    case 'creep':
      return Math.pow(linear, 2.6)
    case 'stepped':
      return Math.floor(linear * 4) / 3
    case 'linear':
    default:
      return linear
  }
}

/**
 * Generates a single randomized VRAM corruption frame with blocks and tear slices.
 */
export function generateRandomFrame(progress = 0.5, primaryColor = '#e2f872'): GlitchFrame {
  const baseCount = Math.floor(6 + progress * 18)
  const blockCount = baseCount + Math.floor(Math.random() * 6)
  const blocks: GlitchBlock[] = []

  const blendModes: Array<'difference' | 'screen' | 'normal' | 'exclusion'> = [
    'difference',
    'difference',
    'normal',
    'screen',
    'exclusion',
  ]

  for (let i = 0; i < blockCount; i++) {
    const texGen = TEXTURE_GENERATORS[Math.floor(Math.random() * TEXTURE_GENERATORS.length)]
    blocks.push({
      id: `block-${i}-${Math.random()}`,
      top: `${Math.floor(Math.random() * 88)}%`,
      left: `${Math.floor(Math.random() * 82)}%`,
      width: `${10 + Math.floor(Math.random() * 60)}%`,
      height: `${3 + Math.floor(Math.random() * 26)}%`,
      background: texGen(primaryColor),
      mixBlendMode: blendModes[Math.floor(Math.random() * blendModes.length)],
      opacity: 0.8 + Math.random() * 0.2,
      transform: `translateX(${Math.floor((Math.random() - 0.5) * 60)}px)`,
    })
  }

  const sliceCount = Math.floor(2 + progress * 4)
  const slices: GlitchSlice[] = []
  const sliceColors = [
    primaryColor,
    'rgba(0, 240, 255, 0.4)',
    'rgba(255, 0, 85, 0.35)',
    'rgba(255, 255, 255, 0.5)',
  ]

  for (let i = 0; i < sliceCount; i++) {
    slices.push({
      id: `slice-${i}-${Math.random()}`,
      top: `${Math.floor(Math.random() * 90)}%`,
      height: `${2 + Math.floor(Math.random() * 12)}%`,
      transform: `translateX(${Math.floor((Math.random() - 0.5) * 90)}px)`,
      background: sliceColors[Math.floor(Math.random() * sliceColors.length)],
      mixBlendMode: Math.random() > 0.5 ? 'difference' : 'screen',
    })
  }

  return {
    blocks,
    slices,
    showInversionFlash: progress > 0.35 && Math.random() > 0.45,
    screenShiftX: Math.floor((Math.random() - 0.5) * 16),
  }
}
