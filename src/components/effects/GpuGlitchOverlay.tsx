import React, { useState, useEffect } from 'react'

interface GlitchBlock {
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

interface GlitchSlice {
  id: string
  top: string
  height: string
  transform: string
  background: string
  mixBlendMode: 'difference' | 'screen' | 'normal'
}

interface GlitchFrame {
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
  // Solid corrupted primary
  (primary: string) => primary,
  // Solid corrupted hot magenta
  () => '#ff0055',
  // Solid electric cyan
  () => '#00f0ff',
  // Solid stark white
  () => '#ffffff',
  // Solid pitch void block
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
function generateBlockyShape(): GlitchShape {
  const shapeType = Math.random()

  // 1. Multi-Tier Stepped Staircase Blocks (~40% of triggers)
  if (shapeType < 0.40) {
    const quadrant = Math.floor(Math.random() * 4)

    if (quadrant === 0) {
      // Bottom-Right stepped staircase (e.g. user's bottom-right quadrant example)
      const x1 = Math.round(25 + Math.random() * 20)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(20 + Math.random() * 25)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)

      // Strictly alternating orthogonal steps: dx=0 or dy=0 (100% 90-degree right angles)
      const poly = `polygon(${x1}% 100%, ${x1}% ${y2}%, ${x2}% ${y2}%, ${x2}% ${y1}%, 100% ${y1}%, 100% 100%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else if (quadrant === 1) {
      // Bottom-Left stepped staircase
      const x1 = Math.round(35 + Math.random() * 25)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(20 + Math.random() * 25)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)

      const poly = `polygon(0% 100%, 0% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y2}%, ${x2}% ${y2}%, ${x2}% 100%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else if (quadrant === 2) {
      // Top-Right stepped staircase
      const x1 = Math.round(25 + Math.random() * 20)
      const x2 = Math.round(x1 + 20 + Math.random() * 20)
      const y1 = Math.round(35 + Math.random() * 20)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)

      const poly = `polygon(${x1}% 0%, 100% 0%, 100% ${y2}%, ${x2}% ${y2}%, ${x2}% ${y1}%, ${x1}% ${y1}%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else {
      // Top-Left stepped staircase
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
      // Orthogonal L-block
      const x0 = Math.round(10 + Math.random() * 30)
      const x1 = Math.round(x0 + 25 + Math.random() * 20)
      const x2 = Math.round(x1 + 25 + Math.random() * 20)
      const y0 = Math.round(15 + Math.random() * 30)
      const y1 = Math.round(y0 + 25 + Math.random() * 20)
      const y2 = Math.round(y1 + 25 + Math.random() * 20)

      const poly = `polygon(${x0}% ${y0}%, ${x2}% ${y0}%, ${x2}% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y2}%, ${x0}% ${y2}%)`
      return { clipPath: poly, top: '0%', left: '0%', width: '100%', height: '100%' }
    } else {
      // Orthogonal T-block
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
function computeLoadProgress(elapsed: number, duration: number, curve: LoadCurve): number {
  const linear = Math.min(Math.max(elapsed / duration, 0), 1.0)
  switch (curve) {
    case 'surge': // Fast-attack surge: hits full saturation within first 15-20% of duration
      return Math.pow(linear, 0.25)
    case 'creep': // Slow creep: slowly builds up over 70% of duration before peaking
      return Math.pow(linear, 2.6)
    case 'stepped': // Quantized memory bank jumps
      return Math.floor(linear * 4) / 3
    case 'linear':
    default:
      return linear
  }
}

function generateRandomFrame(progress: number = 0.5, primaryColor: string = '#e2f872'): GlitchFrame {
  // Number of blocks scales progressively as the glitch loads in
  const baseCount = Math.floor(6 + progress * 18) // 6 blocks early on, up to 24 at peak
  const blockCount = baseCount + Math.floor(Math.random() * 6)
  const blocks: GlitchBlock[] = []

  for (let i = 0; i < blockCount; i++) {
    const texGen = TEXTURE_GENERATORS[Math.floor(Math.random() * TEXTURE_GENERATORS.length)]
    const blendModes: Array<'difference' | 'screen' | 'normal' | 'exclusion'> = [
      'difference',
      'difference',
      'normal',
      'screen',
      'exclusion',
    ]

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

  // Horizontal screen tear slices
  const sliceCount = Math.floor(2 + progress * 4) // 2 early on, up to 6 at peak
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

export const GLITCH_MEMORY_IMAGES = [
  '/images/glitch/memory-01.jpg',
  '/images/glitch/memory-02.jpg',
  '/images/sonny.png',
]

export interface GpuGlitchOverlayProps {
  isActive: boolean
  duration?: number
  primaryColor?: string
  imageProbability?: number
  glitchImages?: string[]
  forceImage?: string | null
}

export const GpuGlitchOverlay: React.FC<GpuGlitchOverlayProps> = ({
  isActive,
  duration = 360,
  primaryColor = '#e2f872',
  imageProbability = 1.0,
  glitchImages = GLITCH_MEMORY_IMAGES,
  forceImage,
}) => {
  const [frame, setFrame] = useState<GlitchFrame | null>(null)
  const [shape, setShape] = useState<GlitchShape>(() => generateBlockyShape())
  const [activeImage, setActiveImage] = useState<string | null>(null)

  // Preload memory images on client mount for zero-latency display
  useEffect(() => {
    if (typeof window !== 'undefined' && glitchImages.length > 0) {
      glitchImages.forEach((src) => {
        const img = new Image()
        img.src = src
      })
    }
  }, [glitchImages])

  useEffect(() => {
    if (!isActive) {
      setFrame(null)
      setActiveImage(null)
      return
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      setFrame(null)
      setActiveImage(null)
      return
    }

    // Determine whether to display a memory photo (default 100% chance)
    if (forceImage !== undefined) {
      setActiveImage(forceImage)
    } else if (glitchImages.length > 0 && Math.random() < imageProbability) {
      const chosen = glitchImages[Math.floor(Math.random() * glitchImages.length)]
      setActiveImage(chosen)
    } else {
      setActiveImage(null)
    }

    const startTime = Date.now()

    // Pick a fresh strictly orthogonal blocky shape for this glitch burst
    setShape(generateBlockyShape())

    // Randomize load-in speed curve profile for this event
    const curves: LoadCurve[] = ['surge', 'creep', 'stepped', 'linear', 'surge', 'creep']
    const loadCurve = curves[Math.floor(Math.random() * curves.length)]

    // Randomize mutation refresh interval (55ms hyper-strobe to 125ms crunchy VRAM stutter)
    const frameInterval = 55 + Math.floor(Math.random() * 70)

    // Generate initial frame
    setFrame(generateRandomFrame(0.1, primaryColor))

    // Advance through randomized frames and progress "load in" over the duration
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = computeLoadProgress(elapsed, duration, loadCurve)
      setFrame(generateRandomFrame(progress, primaryColor))
    }, frameInterval)

    return () => clearInterval(interval)
  }, [isActive, duration, primaryColor, imageProbability, glitchImages, forceImage])

  if (!isActive || !frame) return null

  return (
    <div
      data-testid="gpu-glitch-overlay"
      className="fixed z-50 pointer-events-none overflow-hidden select-none"
      style={{
        top: shape.top,
        left: shape.left,
        width: shape.width,
        height: shape.height,
        clipPath: shape.clipPath,
        transform: `translateX(${frame.screenShiftX}px)`,
      }}
      aria-hidden="true"
    >
      {/* Easter Egg Corrupted Memory Photo (distorted, difference-blended, hard to make out) */}
      {activeImage && (
        <div
          data-testid="glitch-memory-image"
          className="absolute inset-0 pointer-events-none overflow-hidden select-none"
          style={{
            opacity: frame ? 0.16 + (Math.abs(frame.screenShiftX) % 5) * 0.025 : 0.20,
            mixBlendMode: 'difference',
            filter: 'grayscale(100%) contrast(150%) brightness(75%)',
            transform: `translateX(${frame ? frame.screenShiftX * 1.5 : 0}px) scale(1.03)`,
          }}
          aria-hidden="true"
        >
          <img
            src={activeImage}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* Momentary Color Inversion Mask within Blocky Zone */}
      {frame.showInversionFlash && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: primaryColor, mixBlendMode: 'difference', opacity: 0.65 }}
        />
      )}

      {/* Horizontal Tear Slices within Blocky Zone */}
      {frame.slices.map((slice) => (
        <div
          key={slice.id}
          className="absolute left-0 right-0 border-y border-cyan-400/40"
          style={{
            top: slice.top,
            height: slice.height,
            background: slice.background,
            transform: slice.transform,
            mixBlendMode: slice.mixBlendMode,
          }}
        />
      ))}

      {/* Large Chunky Corrupted VRAM Blocks within Blocky Zone */}
      {frame.blocks.map((block) => (
        <div
          key={block.id}
          className="absolute shadow-lg"
          style={{
            top: block.top,
            left: block.left,
            width: block.width,
            height: block.height,
            background: block.background,
            mixBlendMode: block.mixBlendMode,
            opacity: block.opacity,
            transform: block.transform,
          }}
        />
      ))}

      {/* Rapid Horizontal Laser Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)] opacity-35" />
    </div>
  )
}
