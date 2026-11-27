import * as THREE from 'three'

export interface KeplerCoord {
  x: number
  y: number
  r: number
}

/**
 * Evaluates the polar Keplerian orbit r = a(1 - e^2) / (1 + e*cos(theta)).
 * Mutates `target` in-place when provided.
 */
export function computeKeplerPosition(
  theta: number,
  a: number,
  e: number,
  target?: KeplerCoord
): KeplerCoord {
  const p = a * (1 - e * e)
  const r = p / (1 + e * Math.cos(theta))
  const x = r * Math.cos(theta)
  const y = r * Math.sin(theta)

  if (target) {
    target.x = x
    target.y = y
    target.r = r
    return target
  }
  return { x, y, r }
}

/**
 * Closed parametric 3D curve describing a Keplerian orbital ellipse for ProceduralGuide.
 */
export class KeplerCurve extends THREE.Curve<THREE.Vector3> {
  a: number
  e: number

  constructor(a: number, e: number) {
    super()
    this.a = a
    this.e = e
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const theta = t * Math.PI * 2
    const p = this.a * (1 - this.e * this.e)
    const r = p / (1 + this.e * Math.cos(theta))
    return optionalTarget.set(r * Math.cos(theta), r * Math.sin(theta), 0)
  }
}
