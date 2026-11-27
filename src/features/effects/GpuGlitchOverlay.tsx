import React, { useState, useEffect } from 'react'
import {
  GlitchFrame,
  GlitchShape,
  LoadCurve,
  generateBlockyShape,
  computeLoadProgress,
  generateRandomFrame,
} from '@/features/effects/glitchGenerators'
import { isReducedMotionEnabled } from '@/utils/mediaQueries'

export type { GlitchShape, LoadCurve }

export const GLITCH_MEMORY_IMAGES = [
  '/images/glitch/memory-01.jpg',
  '/images/glitch/memory-02.jpg',
  '/images/angel.png',
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
    if (!isActive || isReducedMotionEnabled()) {
      setFrame(null)
      setActiveImage(null)
      return
    }

    if (forceImage !== undefined) {
      setActiveImage(forceImage)
    } else if (glitchImages.length > 0 && Math.random() < imageProbability) {
      const chosen = glitchImages[Math.floor(Math.random() * glitchImages.length)]
      setActiveImage(chosen)
    } else {
      setActiveImage(null)
    }

    const startTime = Date.now()
    setShape(generateBlockyShape())

    const curves: LoadCurve[] = ['surge', 'creep', 'stepped', 'linear', 'surge', 'creep']
    const loadCurve = curves[Math.floor(Math.random() * curves.length)]
    const frameInterval = 55 + Math.floor(Math.random() * 70)

    setFrame(generateRandomFrame(0.1, primaryColor))

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
      {activeImage && (
        <div
          data-testid="glitch-memory-image"
          className="absolute inset-0 pointer-events-none overflow-hidden select-none"
          style={{
            opacity: 0.16 + (Math.abs(frame.screenShiftX) % 5) * 0.025,
            mixBlendMode: 'difference',
            filter: 'grayscale(100%) contrast(150%) brightness(75%)',
            transform: `translateX(${frame.screenShiftX * 1.5}px) scale(1.03)`,
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

      {frame.showInversionFlash && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: primaryColor, mixBlendMode: 'difference', opacity: 0.65 }}
        />
      )}

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

      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_4px)] opacity-35" />
    </div>
  )
}
