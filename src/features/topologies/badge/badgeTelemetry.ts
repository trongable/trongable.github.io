import * as THREE from 'three'
import type { DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'

const CYAN_GLITCH = '#00f0ff'
const MAGENTA_GLITCH = '#ff0055'
const WHITE_GLITCH = '#ffffff'

export interface TelemetryScratch {
  viewPos: THREE.Vector3
  originViewPos: THREE.Vector3
  camDir: THREE.Vector3
  toBadge: THREE.Vector3
  lastDist: number
  lastX: number
  lastY: number
  lastZ: number
}

/**
 * Computes camera-to-badge distance using either Euclidean distance or forward-axis depth.
 * Mutates scratch vectors in-place (zero allocations).
 */
export function computeBadgeCameraDistance(
  camera: THREE.Camera | undefined,
  worldPos: THREE.Vector3,
  metric: DistanceMetric,
  scratch: TelemetryScratch
): number {
  if (!camera?.position) return 5.0
  if (metric === 'depth' && typeof camera.getWorldDirection === 'function') {
    camera.getWorldDirection(scratch.camDir)
    scratch.toBadge.subVectors(worldPos, camera.position)
    return Math.max(0.1, scratch.toBadge.dot(scratch.camDir))
  }
  if (typeof camera.position.distanceTo === 'function') {
    return camera.position.distanceTo(worldPos)
  }
  return 5.0
}

/**
 * Formats and syncs the 3D telemetry distance/coordinate label when delta >= 0.01.
 */
export function syncTelemetryLabel(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  distText: any,
  camera: THREE.Camera | undefined,
  worldPos: THREE.Vector3,
  distToCamera: number,
  metric: DistanceMetric,
  showCoords: boolean,
  coordFrame: CoordFrame,
  vertexTag: string | undefined,
  scratch: TelemetryScratch
): void {
  let xVal = worldPos.x
  let yVal = worldPos.y
  let zVal = worldPos.z

  if (coordFrame === 'view' && camera?.matrixWorldInverse) {
    scratch.viewPos.copy(worldPos).applyMatrix4(camera.matrixWorldInverse)
    scratch.originViewPos.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse)
    xVal = scratch.viewPos.x
    yVal = scratch.viewPos.y
    zVal = scratch.viewPos.z - scratch.originViewPos.z
  }

  const distDelta = Math.abs(distToCamera - scratch.lastDist)
  const xDelta = Math.abs(xVal - scratch.lastX)
  const yDelta = Math.abs(yVal - scratch.lastY)
  const zDelta = Math.abs(zVal - scratch.lastZ)

  if (
    distDelta < 0.01 &&
    !(showCoords && (xDelta >= 0.01 || yDelta >= 0.01 || zDelta >= 0.01))
  ) {
    return
  }

  scratch.lastDist = distToCamera
  scratch.lastX = xVal
  scratch.lastY = yVal
  scratch.lastZ = zVal

  const prefix = metric === 'depth' ? 'depth:' : 'd:'
  const tagPrefix = vertexTag ? `[${vertexTag}] ` : ''
  const distStr = `${tagPrefix}${prefix} ${distToCamera.toFixed(2)}`

  if (showCoords) {
    const xStr = xVal.toFixed(2)
    const yStr = yVal.toFixed(2)
    const zStr = coordFrame === 'view' && zVal > 0.005 ? `+${zVal.toFixed(2)}` : zVal.toFixed(2)
    distText.text = `${distStr}\nx: ${xStr}  y: ${yStr}  z: ${zStr}`
  } else {
    distText.text = distStr
  }

  if (typeof distText.sync === 'function') {
    distText.sync()
  }
}

export function pickRandomGlitchHex(): string {
  return Math.random() > 0.5 ? CYAN_GLITCH : MAGENTA_GLITCH
}

export function applyTextBadgeTint(
  mat: THREE.MeshBasicMaterial,
  alpha: number,
  isGlitching: boolean,
  isHovered: boolean,
  highlightColorHex: string,
  dimBadgeColor: THREE.Color,
  baseBadgeColor: THREE.Color,
  currentDepth: number
): void {
  mat.opacity = alpha
  mat.transparent = alpha < 0.99
  mat.depthWrite = true
  mat.depthTest = true

  if (isGlitching && Math.random() > 0.45) {
    mat.color.set(pickRandomGlitchHex())
  } else if (isHovered) {
    const flick = Math.random()
    if (flick < 0.10) {
      mat.color.set(CYAN_GLITCH)
    } else if (flick < 0.16) {
      mat.color.set(MAGENTA_GLITCH)
    } else if (flick < 0.24) {
      mat.color.set(WHITE_GLITCH)
    } else {
      mat.color.set(highlightColorHex)
    }
  } else {
    mat.color.lerpColors(dimBadgeColor, baseBadgeColor, currentDepth)
  }
}
