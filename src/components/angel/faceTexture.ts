import * as THREE from 'three'
import type { EyeStyle, MouthStyle } from './angelCatalog'

export interface FaceTextureOptions {
  eyeStyle: EyeStyle
  eyeColor: string
  blushIntensity: number
  blushColor: string
  freckles: boolean
  mouthStyle: MouthStyle
}

/**
 * Draws crisp stylized Angel eyes, eyelashes, brows, blush, freckles, and mouth
 * onto an offscreen canvas and wraps it in a `THREE.CanvasTexture`.
 * Callers must `.dispose()` the returned texture when options change or on unmount.
 */
export function createAngelFaceTexture(opts: FaceTextureOptions): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, 512, 512)

  const leftEyeX = 142
  const rightEyeX = 370
  const eyeY = 258

  // Soft low outer-cheek blush
  if (opts.blushIntensity > 0.01) {
    const drawBlush = (cx: number, cy: number) => {
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 68)
      ctx.save()
      ctx.globalAlpha = opts.blushIntensity * 0.50
      grad.addColorStop(0, opts.blushColor)
      grad.addColorStop(1, 'rgba(255, 138, 155, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(cx, cy, 68, 44, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    drawBlush(108, 338)
    drawBlush(404, 338)
  }

  // Optional freckles
  if (opts.freckles) {
    ctx.save()
    ctx.fillStyle = 'rgba(130, 72, 48, 0.55)'
    const dots = [
      [104, 326], [122, 332], [112, 342],
      [408, 326], [390, 332], [400, 342],
    ]
    for (const [dx, dy] of dots) {
      ctx.beginPath()
      ctx.arc(dx, dy, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  // Little filled triangle eyebrows (classic Angel style)
  ctx.save()
  ctx.fillStyle = '#804c28'
  ctx.beginPath()
  ctx.moveTo(leftEyeX - 16, eyeY - 78)
  ctx.lineTo(leftEyeX + 4, eyeY - 81)
  ctx.lineTo(leftEyeX - 4, eyeY - 94)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(rightEyeX - 4, eyeY - 81)
  ctx.lineTo(rightEyeX + 16, eyeY - 78)
  ctx.lineTo(rightEyeX + 4, eyeY - 94)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Eyes
  const drawOpenEye = (
    cx: number,
    cy: number,
    irisOffsetX: number,
    isStarlight: boolean,
    isLeft: boolean
  ) => {
    // Sclera
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(cx, cy, 56, 46, 0, 0, Math.PI * 2)
    ctx.fill()

    // Iris
    ctx.fillStyle = opts.eyeColor
    ctx.beginPath()
    ctx.ellipse(cx + irisOffsetX, cy, 40, 41, 0, 0, Math.PI * 2)
    ctx.fill()

    // Pupil
    ctx.fillStyle = '#0c0a0f'
    ctx.beginPath()
    ctx.arc(cx + irisOffsetX, cy + 1, 23, 0, Math.PI * 2)
    ctx.fill()

    // Glossy highlights
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx + irisOffsetX - 12, cy - 14, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + irisOffsetX + 13, cy + 14, 4.5, 0, Math.PI * 2)
    ctx.fill()

    if (isStarlight) {
      ctx.fillStyle = '#fff9c4'
      ctx.beginPath()
      ctx.arc(cx + irisOffsetX + 11, cy - 11, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Upper lash line + 4 tiny upward outer eyelashes
    ctx.strokeStyle = '#161014'
    ctx.lineWidth = 6.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy + 2, 54, Math.PI * 1.09, Math.PI * 1.91)
    ctx.stroke()

    const side = isLeft ? -1 : 1
    ctx.lineWidth = 4.5
    for (let li = 0; li < 4; li++) {
      const a = Math.PI * (isLeft ? 1.13 + li * 0.075 : 1.87 - li * 0.075)
      const x0 = cx + Math.cos(a) * 53
      const y0 = cy + 2 + Math.sin(a) * 53
      const x1 = x0 + side * (13 - li * 1.6)
      const y1 = y0 - (11 + li * 2.2)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
  }

  const drawHappyArc = (cx: number, cy: number) => {
    ctx.strokeStyle = '#23191e'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(cx, cy + 10, 32, Math.PI * 1.15, Math.PI * 1.85)
    ctx.stroke()
  }

  if (opts.eyeStyle === 'happy') {
    drawHappyArc(leftEyeX, eyeY)
    drawHappyArc(rightEyeX, eyeY)
  } else if (opts.eyeStyle === 'wink') {
    drawOpenEye(leftEyeX, eyeY, 0, false, true)
    drawHappyArc(rightEyeX, eyeY)
  } else {
    const offset = opts.eyeStyle === 'side-glance' ? 12 : 0
    const star = opts.eyeStyle === 'starlight'
    drawOpenEye(leftEyeX, eyeY, offset, star, true)
    drawOpenEye(rightEyeX, eyeY, offset, star, false)
  }

  // Wide gentle rose-peach baby smile (+75% wider)
  ctx.save()
  ctx.strokeStyle = '#d0887c'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  if (opts.mouthStyle === 'smile') {
    ctx.beginPath()
    ctx.moveTo(210, 354)
    ctx.quadraticCurveTo(256, 376, 302, 354)
    ctx.stroke()
  } else if (opts.mouthStyle === 'pout') {
    ctx.beginPath()
    ctx.moveTo(234, 366)
    ctx.quadraticCurveTo(256, 358, 278, 366)
    ctx.stroke()
  } else {
    ctx.fillStyle = '#d47474'
    ctx.beginPath()
    ctx.arc(256, 350, 28, 0, Math.PI)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
