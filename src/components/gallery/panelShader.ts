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
varying vec2 vUv;
void main() {
  gl_FragColor = uHasMap ? texture2D(uMap, vUv, -0.75) : vec4(0.09, 0.086, 0.114, 1.0);
}
`

export interface CurvedPanelGeometries {
  screenGeo: THREE.PlaneGeometry
  borderGeo: THREE.BufferGeometry
  playRingGeo: THREE.BufferGeometry | null
  playTriangleGeo: THREE.BufferGeometry | null
}

/**
 * Builds the curved screen, perimeter border, and optional video play-icon
 * geometries aligned to the sphere latitude radius `Rh`.
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

  for (let i = 0; i < posAttr.count; i++) {
    const u = posAttr.getX(i)
    const alpha = (u / hw) * alphaMax
    posAttr.setX(i, Rh * Math.sin(alpha))
    posAttr.setZ(i, Rh * (1 - Math.cos(alpha)))
  }
  posAttr.needsUpdate = true
  screenGeo.computeVertexNormals()

  const borderPoints: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const alpha = -alphaMax + (i / segments) * (2 * alphaMax)
    borderPoints.push(new THREE.Vector3(Rh * Math.sin(alpha), -hh, Rh * (1 - Math.cos(alpha))))
  }
  for (let i = segments; i >= 0; i--) {
    const alpha = -alphaMax + (i / segments) * (2 * alphaMax)
    borderPoints.push(new THREE.Vector3(Rh * Math.sin(alpha), hh, Rh * (1 - Math.cos(alpha))))
  }
  const zCorner = Rh * (1 - Math.cos(-alphaMax))
  borderPoints.push(new THREE.Vector3(-clampedHw, -hh, zCorner))

  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints)

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

  return { screenGeo, borderGeo, playRingGeo, playTriangleGeo }
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
