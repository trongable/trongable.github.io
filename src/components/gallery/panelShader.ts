import * as THREE from 'three'
import type { MediaKind } from './galleryData'

/**
 * Raw sRGB passthrough shaders for CurvedMediaPanel.
 * Keeps `NoColorSpace` textures in sRGB space (`GL_RGBA8` + `-0.75` LOD bias)
 * to prevent `GL_SRGB8_ALPHA8` linear-light mipmap contrast washout and match
 * the 2D theater viewer 1:1.
 */
export const SCREEN_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const SCREEN_FRAGMENT_SHADER = `
uniform sampler2D uMap;
uniform bool uHasMap;
uniform float uOpacity;
uniform vec2 uBlurVec;
varying vec2 vUv;
void main() {
  vec4 texel;
  if (!uHasMap) {
    texel = vec4(0.09, 0.086, 0.114, 1.0);
  } else if (dot(uBlurVec, uBlurVec) < 0.000001) {
    texel = texture2D(uMap, vUv, -0.75);
  } else {
    // 10-tap asymmetric front-weighted directional blur trailing behind panel motion
    vec4 sum = vec4(0.0);
    float totalWeight = 0.0;
    for (int i = 0; i < 10; i++) {
      float t = float(i) / 9.0;
      float w = 1.0 - 0.65 * t;
      vec2 sampleUv = clamp(vUv + uBlurVec * t, vec2(0.004), vec2(0.996));
      sum += texture2D(uMap, sampleUv, -0.35) * w;
      totalWeight += w;
    }
    texel = sum / totalWeight;
  }
  gl_FragColor = vec4(texel.rgb, texel.a * uOpacity);
}
`

export interface CurvedPanelGeometries {
  screenGeo: THREE.PlaneGeometry
  borderGeo: THREE.BufferGeometry
  reticleGeo: THREE.BufferGeometry
  playRingGeo: THREE.BufferGeometry | null
  playTriangleGeo: THREE.BufferGeometry | null
  screenFlatX: Float32Array
  screenCurvedX: Float32Array
  screenCurvedZ: Float32Array
  borderFlatX: Float32Array
  borderCurvedX: Float32Array
  borderCurvedZ: Float32Array
}

/**
 * Interpolates a panel's screen and perimeter border geometries between planar
 * (`curveFactor = 0`) and cylindrical sphere curvature `Rh` (`curveFactor = 1`)
 * with zero per-frame heap allocations.
 */
export function applyPanelCurvature(geos: CurvedPanelGeometries, curveFactor: number): void {
  const c = Math.max(0, Math.min(1, curveFactor))

  const screenPos = geos.screenGeo.attributes.position
  const screenLen = Math.min(screenPos.count, geos.screenFlatX.length)
  for (let i = 0; i < screenLen; i++) {
    const fx = geos.screenFlatX[i]
    const cx = geos.screenCurvedX[i]
    const cz = geos.screenCurvedZ[i]
    screenPos.setX(i, fx + c * (cx - fx))
    screenPos.setZ(i, c * cz)
  }
  screenPos.needsUpdate = true

  const borderPos = geos.borderGeo.attributes.position
  const borderLen = Math.min(borderPos.count, geos.borderFlatX.length)
  for (let i = 0; i < borderLen; i++) {
    const fx = geos.borderFlatX[i]
    const cx = geos.borderCurvedX[i]
    const cz = geos.borderCurvedZ[i]
    borderPos.setX(i, fx + c * (cx - fx))
    borderPos.setZ(i, c * cz)
  }
  borderPos.needsUpdate = true
}

/**
 * Builds the curved screen, perimeter border, and optional video play-icon
 * geometries aligned to the sphere latitude radius `Rh`, caching planar/curved
 * coordinates for allocation-free runtime un-curving.
 */
export function buildCurvedPanelGeometries(
  panelWidth: number,
  panelHeight: number,
  Rh: number,
  mediaType: MediaKind
): CurvedPanelGeometries {
  const segments = 32
  const screenGeo = new THREE.PlaneGeometry(panelWidth, panelHeight, segments, 1)
  const posAttr = screenGeo.attributes.position

  const hw = panelWidth / 2
  const hh = panelHeight / 2
  const clampedHw = Math.min(hw, Rh * 0.99)
  const alphaMax = Math.asin(clampedHw / Rh)

  const screenFlatX = new Float32Array(posAttr.count)
  const screenCurvedX = new Float32Array(posAttr.count)
  const screenCurvedZ = new Float32Array(posAttr.count)

  for (let i = 0; i < posAttr.count; i++) {
    const u = posAttr.getX(i)
    const alpha = (u / hw) * alphaMax
    const fx = (alpha / alphaMax) * clampedHw
    const cx = Rh * Math.sin(alpha)
    const cz = Rh * (1 - Math.cos(alpha))
    screenFlatX[i] = fx
    screenCurvedX[i] = cx
    screenCurvedZ[i] = cz
    posAttr.setX(i, cx)
    posAttr.setZ(i, cz)
  }
  posAttr.needsUpdate = true
  screenGeo.computeVertexNormals()

  const borderPoints: THREE.Vector3[] = []
  const borderFlatArr: number[] = []
  const borderCurvedXArr: number[] = []
  const borderCurvedZArr: number[] = []

  const pushBorderPt = (flatX: number, y: number, curvedX: number, curvedZ: number) => {
    borderPoints.push(new THREE.Vector3(curvedX, y, curvedZ))
    borderFlatArr.push(flatX)
    borderCurvedXArr.push(curvedX)
    borderCurvedZArr.push(curvedZ)
  }

  for (let i = 0; i <= segments; i++) {
    const alpha = -alphaMax + (i / segments) * (2 * alphaMax)
    const fx = (alpha / alphaMax) * clampedHw
    pushBorderPt(fx, -hh, Rh * Math.sin(alpha), Rh * (1 - Math.cos(alpha)))
  }
  for (let i = segments; i >= 0; i--) {
    const alpha = -alphaMax + (i / segments) * (2 * alphaMax)
    const fx = (alpha / alphaMax) * clampedHw
    pushBorderPt(fx, hh, Rh * Math.sin(alpha), Rh * (1 - Math.cos(alpha)))
  }
  const zCorner = Rh * (1 - Math.cos(-alphaMax))
  pushBorderPt(-clampedHw, -hh, -clampedHw, zCorner)

  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints)
  const borderFlatX = new Float32Array(borderFlatArr)
  const borderCurvedX = new Float32Array(borderCurvedXArr)
  const borderCurvedZ = new Float32Array(borderCurvedZArr)

  // 4 orthogonal 90° L-bracket corner reticles curved along Rh
  const pad = 0.045
  const leg = 0.14
  const zOffset = 0.012
  const outerHw = Math.min(hw + pad, Rh * 0.99)
  const innerHw = Math.max(0, outerHw - leg)
  const alphaPad = Math.asin(outerHw / Rh)
  const alphaInner = Math.asin(innerHw / Rh)
  const yOuter = hh + pad
  const yInner = Math.max(0, yOuter - leg)

  const reticlePoints: THREE.Vector3[] = []
  const signs = [-1, 1] as const
  for (const sx of signs) {
    for (const sy of signs) {
      const aOut = sx * alphaPad
      const aIn = sx * alphaInner
      const xOut = Rh * Math.sin(aOut)
      const zOut = Rh * (1 - Math.cos(aOut)) + zOffset
      const xIn = Rh * Math.sin(aIn)
      const zIn = Rh * (1 - Math.cos(aIn)) + zOffset

      // Vertical bracket leg
      reticlePoints.push(
        new THREE.Vector3(xOut, sy * yOuter, zOut),
        new THREE.Vector3(xOut, sy * yInner, zOut)
      )
      // Horizontal bracket leg
      reticlePoints.push(
        new THREE.Vector3(xOut, sy * yOuter, zOut),
        new THREE.Vector3(xIn, sy * yOuter, zIn)
      )
    }
  }
  const reticleGeo = new THREE.BufferGeometry().setFromPoints(reticlePoints)

  let playRingGeo: THREE.BufferGeometry | null = null
  let playTriangleGeo: THREE.BufferGeometry | null = null

  if (mediaType === 'video') {
    const ringPts: THREE.Vector3[] = []
    const rSegs = 32
    for (let i = 0; i <= rSegs; i++) {
      const a = (i / rSegs) * Math.PI * 2
      ringPts.push(new THREE.Vector3(0.20 * Math.cos(a), 0.20 * Math.sin(a), 0.02))
    }
    playRingGeo = new THREE.BufferGeometry().setFromPoints(ringPts)

    playTriangleGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.06, 0.085, 0.02),
      new THREE.Vector3(0.095, 0, 0.02),
      new THREE.Vector3(-0.06, -0.085, 0.02),
    ])
  }

  return {
    screenGeo,
    borderGeo,
    reticleGeo,
    playRingGeo,
    playTriangleGeo,
    screenFlatX,
    screenCurvedX,
    screenCurvedZ,
    borderFlatX,
    borderCurvedX,
    borderCurvedZ,
  }
}

/**
 * Creates a procedural grid fallback CanvasTexture in `NoColorSpace` for offline
 * or pre-load panel rendering.
 */
export function createFallbackPanelTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#17161d'
      ctx.fillRect(0, 0, 320, 180)
      ctx.strokeStyle = '#2a2836'
      ctx.lineWidth = 1
      for (let x = 0; x < 320; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, 180)
        ctx.stroke()
      }
      for (let y = 0; y < 180; y += 18) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(320, y)
        ctx.stroke()
      }
    }
    const fallbackTex = new THREE.CanvasTexture(canvas)
    fallbackTex.colorSpace = THREE.NoColorSpace
    fallbackTex.needsUpdate = true
    return fallbackTex
  } catch {
    return null
  }
}

/**
 * Computes directional UV motion-blur vector trailing behind a panel's apparent
 * tangent-plane velocity. Mutates `out` in place (zero allocations).
 */
export function computePanelSurfaceBlur(
  deltaPanelLocal: THREE.Vector3,
  delta: number,
  panelWidth: number,
  panelHeight: number,
  sphereRadius: number,
  out: { x: number; y: number }
): void {
  const safeDelta = Math.max(delta, 0.004)
  const uvAngularWidth = Math.max(0.05, panelWidth / sphereRadius)
  const uvAngularHeight = Math.max(0.05, panelHeight / sphereRadius)
  let bx = (-deltaPanelLocal.x / (safeDelta * uvAngularWidth)) * 0.018
  let by = (-deltaPanelLocal.y / (safeDelta * uvAngularHeight)) * 0.018

  const rawMag = Math.hypot(bx, by)
  if (rawMag < 0.003) {
    bx = 0
    by = 0
  } else if (rawMag > 0.18) {
    const clampRatio = 0.18 / rawMag
    bx *= clampRatio
    by *= clampRatio
  }

  out.x = bx
  out.y = by
}
