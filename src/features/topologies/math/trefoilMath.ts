import * as THREE from 'three'

/**
 * Evaluates a classic (2, 3) torus knot point in R^3.
 * Mutates `target` in-place when provided to avoid per-frame allocations.
 */
export function getTrefoilPoint(t: number, scale = 1, target?: THREE.Vector3): THREE.Vector3 {
  const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.48 * scale
  const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.42 * scale
  const z = -Math.sin(3 * t) * 0.75 * scale
  if (target) {
    return target.set(x, y, z)
  }
  return new THREE.Vector3(x, y, z)
}
