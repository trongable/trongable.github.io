import * as THREE from 'three'

/**
 * Computes a point along a toroidal corkscrew helix of major radius `R`,
 * minor radius `r`, and `n` poloidal coils. Mutates `target` in-place when provided.
 */
export function computeToroidalHelixPoint(
  theta: number,
  R: number,
  r: number,
  n: number,
  target?: THREE.Vector3
): THREE.Vector3 {
  const cosN = Math.cos(n * theta)
  const sinN = Math.sin(n * theta)
  const rad = R + r * cosN

  const x = rad * Math.cos(theta)
  const y = r * sinN
  const z = rad * Math.sin(theta)

  if (target) {
    return target.set(x, y, z)
  }
  return new THREE.Vector3(x, y, z)
}
