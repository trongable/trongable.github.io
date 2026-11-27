import * as THREE from 'three'

const SIGMA = 10
const BETA = 8 / 3

/**
 * Integrates one Euler step of the Lorenz strange attractor ODEs.
 * Mutates `target` in-place when provided to avoid per-frame allocations.
 */
export function stepLorenz(
  pos: THREE.Vector3,
  dt: number,
  rho: number,
  target?: THREE.Vector3
): THREE.Vector3 {
  const dx = SIGMA * (pos.y - pos.x)
  const dy = pos.x * (rho - pos.z) - pos.y
  const dz = pos.x * pos.y - BETA * pos.z

  const x = pos.x + dx * dt
  const y = pos.y + dy * dt
  const z = pos.z + dz * dt

  if (target) {
    return target.set(x, y, z)
  }
  return new THREE.Vector3(x, y, z)
}
