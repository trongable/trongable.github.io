import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import {
  GlitchFrame,
  GlitchShape,
  LoadCurve,
  computeLoadProgress,
  generateBlockyShape,
  generateRandomFrame,
} from '@/features/effects/glitchGenerators'
import { GLITCH_MEMORY_IMAGES } from '@/features/effects/GpuGlitchOverlay'
import { isReducedMotionEnabled } from '@/utils/mediaQueries'

export interface CerebroGlitchStormProps {
  isActive: boolean
  isPaused?: boolean
  duration?: number
  primaryColor?: string
  imageProbability?: number
  sphereRadius: number
  glitchImages?: string[]
}

const STORM_CELL_COUNT = 3
const CANVAS_W = 1024
const CANVAS_H = 576
const CELL_HORIZ_ARC_DEG = 38
const CELL_VERT_ARC_DEG = 24

interface StormCellResources {
  geo: THREE.PlaneGeometry
  gridU: Float32Array
  gridV: Float32Array
  canvas: HTMLCanvasElement | null
  texture: THREE.CanvasTexture | null
  mat: THREE.MeshBasicMaterial
}

function projectSphericalPatch(
  geo: THREE.PlaneGeometry,
  gridU: Float32Array,
  gridV: Float32Array,
  stormRadius: number,
  thetaCenter: number,
  phiCenter: number
): void {
  const pos = geo.attributes.position
  const vertArcRad = THREE.MathUtils.degToRad(CELL_VERT_ARC_DEG)
  const horizArcRad = THREE.MathUtils.degToRad(CELL_HORIZ_ARC_DEG) / Math.max(0.35, Math.cos(phiCenter))

  for (let i = 0; i < pos.count; i++) {
    const theta = thetaCenter + gridU[i] * horizArcRad
    const phi = THREE.MathUtils.clamp(phiCenter + gridV[i] * vertArcRad, -1.48, 1.48)
    const cosPhi = Math.cos(phi)
    pos.setXYZ(
      i,
      stormRadius * cosPhi * Math.sin(theta),
      stormRadius * Math.sin(phi),
      -stormRadius * cosPhi * Math.cos(theta)
    )
  }
  pos.needsUpdate = true
  geo.computeBoundingSphere()
}

function applyOrthogonalClipPath(
  ctx: CanvasRenderingContext2D,
  shape: GlitchShape
): { x: number; y: number; w: number; h: number } {
  if (shape.clipPath && shape.clipPath.startsWith('polygon(')) {
    const coords = shape.clipPath
      .slice('polygon('.length, -1)
      .split(',')
      .map((pair) => {
        const [xStr, yStr] = pair.trim().split(/\s+/)
        return {
          x: (parseFloat(xStr) / 100) * CANVAS_W,
          y: (parseFloat(yStr) / 100) * CANVAS_H,
        }
      })

    if (coords.length > 0) {
      ctx.beginPath()
      ctx.moveTo(coords[0].x, coords[0].y)
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(coords[i].x, coords[i].y)
      }
      ctx.closePath()
      ctx.clip()
    }
    return { x: 0, y: 0, w: CANVAS_W, h: CANVAS_H }
  }

  const x = (parseFloat(shape.left) / 100) * CANVAS_W
  const y = (parseFloat(shape.top) / 100) * CANVAS_H
  const w = (parseFloat(shape.width) / 100) * CANVAS_W
  const h = (parseFloat(shape.height) / 100) * CANVAS_H
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  return { x, y, w, h }
}

function resolveBlockFill(
  ctx: CanvasRenderingContext2D,
  background: string,
  primaryColor: string,
  bx: number,
  bw: number
): string | CanvasPattern {
  if (background.startsWith('#')) return background
  if (background.includes('#00f0ff') && background.includes('#ff0055')) {
    return (Math.floor(bx + bw) % 2 === 0 ? '#00f0ff' : '#ff0055')
  }
  if (background.includes('#ffffff') && background.includes('#000000')) {
    return (Math.floor(bx) % 2 === 0 ? '#ffffff' : '#1c1b22')
  }
  if (background.includes('repeating-conic-gradient') && typeof ctx.createPattern === 'function') {
    const tile = document.createElement('canvas')
    tile.width = 12
    tile.height = 12
    const tctx = tile.getContext('2d')
    if (tctx) {
      tctx.fillStyle = primaryColor
      tctx.fillRect(0, 0, 6, 6)
      tctx.fillRect(6, 6, 6, 6)
      tctx.fillStyle = '#1c1b22'
      tctx.fillRect(6, 0, 6, 6)
      tctx.fillRect(0, 6, 6, 6)
      const pattern = ctx.createPattern(tile, 'repeat')
      if (pattern) return pattern
    }
  }
  return primaryColor
}

function drawGlitchStormFrame(
  ctx: CanvasRenderingContext2D,
  shape: GlitchShape,
  frame: GlitchFrame,
  primaryColor: string,
  loadedImage: HTMLImageElement | null
): void {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.save()

  const region = applyOrthogonalClipPath(ctx, shape)

  if (loadedImage && loadedImage.complete && loadedImage.naturalWidth > 0) {
    ctx.save()
    ctx.globalAlpha = 0.22 + (Math.abs(frame.screenShiftX) % 5) * 0.03
    ctx.filter = 'grayscale(100%) contrast(150%) brightness(75%)'
    ctx.drawImage(loadedImage, 0, 0, CANVAS_W, CANVAS_H)
    ctx.restore()
  }

  if (frame.showInversionFlash) {
    ctx.save()
    ctx.globalAlpha = 0.55
    ctx.fillStyle = primaryColor
    ctx.fillRect(region.x, region.y, region.w, region.h)
    ctx.restore()
  }

  for (const slice of frame.slices) {
    const sy = (parseFloat(slice.top) / 100) * CANVAS_H
    const sh = Math.max(2, (parseFloat(slice.height) / 100) * CANVAS_H)
    ctx.save()
    ctx.globalAlpha = 0.72
    ctx.fillStyle = slice.background
    ctx.fillRect(0, sy, CANVAS_W, sh)
    ctx.restore()
  }

  for (const block of frame.blocks) {
    const bx = (parseFloat(block.left) / 100) * CANVAS_W + frame.screenShiftX * 0.6
    const by = (parseFloat(block.top) / 100) * CANVAS_H
    const bw = (parseFloat(block.width) / 100) * CANVAS_W
    const bh = Math.max(2, (parseFloat(block.height) / 100) * CANVAS_H)
    ctx.save()
    ctx.globalAlpha = block.opacity * 0.85
    ctx.fillStyle = resolveBlockFill(ctx, block.background, primaryColor, bx, bw)
    ctx.fillRect(bx, by, bw, bh)
    ctx.restore()
  }

  // Orthogonal CRT scanlines across the active lightning region
  ctx.save()
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#000000'
  for (let y = 0; y < CANVAS_H; y += 3) {
    ctx.fillRect(0, y + 2, CANVAS_W, 1)
  }
  ctx.restore()

  ctx.restore()
}

/**
 * Background WebGL chained orthogonal glitch lightning storm rendered behind gallery panels
 * (`r = sphereRadius`) and in front of chamber walls (`r = sphereRadius + 0.3`).
 * Spawns anywhere around the 360° sphere and conforms to local spherical curvature per segment.
 */
export const CerebroGlitchStorm: React.FC<CerebroGlitchStormProps> = ({
  isActive,
  isPaused = false,
  duration = 360,
  primaryColor = '#e2f872',
  imageProbability = 1.0,
  sphereRadius,
  glitchImages = GLITCH_MEMORY_IMAGES,
}) => {
  const { gl } = useThree()
  const maxAnisotropy = Math.min(16, gl?.capabilities?.getMaxAnisotropy?.() ?? 4)
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<Array<THREE.Mesh | null>>([])
  const preloadedImagesRef = useRef<Record<string, HTMLImageElement>>({})
  const stormRadius = sphereRadius + 0.15

  const cells = useMemo<StormCellResources[]>(() => {
    return Array.from({ length: STORM_CELL_COUNT }, () => {
      const geo = new THREE.PlaneGeometry(1, 1, 20, 14)
      const pos = geo.attributes.position
      const gridU = new Float32Array(pos.count)
      const gridV = new Float32Array(pos.count)
      for (let i = 0; i < pos.count; i++) {
        gridU[i] = pos.getX(i)
        gridV[i] = pos.getY(i)
      }
      projectSphericalPatch(geo, gridU, gridV, stormRadius, 0, 0)

      let canvas: HTMLCanvasElement | null = null
      let texture: THREE.CanvasTexture | null = null
      if (typeof document !== 'undefined') {
        canvas = document.createElement('canvas')
        canvas.width = CANVAS_W
        canvas.height = CANVAS_H
        texture = new THREE.CanvasTexture(canvas)
        texture.colorSpace = THREE.NoColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.anisotropy = maxAnisotropy
      }

      const mat = new THREE.MeshBasicMaterial({
        map: texture ?? undefined,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })

      return { geo, gridU, gridV, canvas, texture, mat }
    })
  }, [stormRadius, maxAnisotropy])

  useEffect(() => {
    if (typeof Image === 'undefined') return
    glitchImages.forEach((src) => {
      if (!preloadedImagesRef.current[src]) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = src
        preloadedImagesRef.current[src] = img
      }
    })
  }, [glitchImages])

  useEffect(() => {
    return () => {
      cells.forEach((cell) => {
        cell.geo.dispose()
        cell.mat.dispose()
        cell.texture?.dispose()
      })
    }
  }, [cells])

  useEffect(() => {
    const clearAllCells = () => {
      cells.forEach((cell) => {
        const ctx = cell.canvas?.getContext('2d')
        if (ctx && cell.texture) {
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
          cell.texture.needsUpdate = true
        }
      })
    }

    if (!isActive || isPaused || isReducedMotionEnabled()) {
      clearAllCells()
      return
    }

    // Pick arbitrary root anywhere across the 360° sphere and extend a 3-cell lightning chain
    let theta = (Math.random() * 2 - 1) * Math.PI
    let phi = THREE.MathUtils.degToRad((Math.random() * 2 - 1) * 48)
    const dirSign = Math.random() > 0.5 ? 1 : -1
    const staggerMs = Math.min(100, Math.floor(duration * 0.22))
    const curves: LoadCurve[] = ['surge', 'creep', 'stepped', 'linear', 'surge', 'creep']

    const timers: number[] = []
    const intervals: number[] = []

    clearAllCells()

    cells.forEach((cell, idx) => {
      if (idx > 0) {
        const stepTheta =
          dirSign *
          (THREE.MathUtils.degToRad(26 + Math.random() * 12) / Math.max(0.35, Math.cos(phi)))
        const stepPhi = (Math.random() - 0.5) * THREE.MathUtils.degToRad(24)
        theta += stepTheta
        phi = THREE.MathUtils.clamp(
          phi + stepPhi,
          THREE.MathUtils.degToRad(-54),
          THREE.MathUtils.degToRad(54)
        )
      }

      projectSphericalPatch(cell.geo, cell.gridU, cell.gridV, stormRadius, theta, phi)

      const ctx = cell.canvas?.getContext('2d')
      const texture = cell.texture
      if (!ctx || !texture) return

      let chosenImg: HTMLImageElement | null = null
      if (glitchImages.length > 0 && Math.random() < imageProbability) {
        const chosenSrc = glitchImages[Math.floor(Math.random() * glitchImages.length)]
        chosenImg = preloadedImagesRef.current[chosenSrc] ?? null
      }

      const shape = generateBlockyShape()
      const loadCurve = curves[Math.floor(Math.random() * curves.length)]
      const frameInterval = 55 + Math.floor(Math.random() * 70)

      const startCell = () => {
        const startTime = Date.now()
        drawGlitchStormFrame(ctx, shape, generateRandomFrame(0.1, primaryColor), primaryColor, chosenImg)
        texture.needsUpdate = true

        const intervalId = window.setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = computeLoadProgress(elapsed, duration, loadCurve)
          drawGlitchStormFrame(
            ctx,
            shape,
            generateRandomFrame(progress, primaryColor),
            primaryColor,
            chosenImg
          )
          texture.needsUpdate = true
        }, frameInterval)
        intervals.push(intervalId)
      }

      if (idx === 0) {
        startCell()
      } else {
        const timerId = window.setTimeout(startCell, staggerMs * idx)
        timers.push(timerId)
      }
    })

    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      intervals.forEach((id) => window.clearInterval(id))
    }
  }, [isActive, isPaused, duration, primaryColor, imageProbability, glitchImages, cells, stormRadius])

  const stormVisible = isActive && !isPaused && !isReducedMotionEnabled()

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.visible = stormVisible
    }
    meshRefs.current.forEach((mesh) => {
      if (mesh) mesh.visible = stormVisible
    })
  }, [stormVisible])

  return (
    <group
      ref={groupRef}
      data-testid="cerebro-glitch-storm"
      renderOrder={2}
      visible={stormVisible}
      raycast={() => null}
    >
      {cells.map((cell, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el
          }}
          data-testid={`cerebro-glitch-storm-cell-${idx}`}
          geometry={cell.geo}
          material={cell.mat}
          renderOrder={2}
          visible={stormVisible}
          raycast={() => null}
        />
      ))}
    </group>
  )
}
