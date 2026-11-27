import * as THREE from 'three'

// 16 vertices of a 4D Hypercube (+-1, +-1, +-1, +-1)
export const TESSERACT_4D_VERTICES: number[][] = []
for (let i = 0; i < 16; i++) {
  TESSERACT_4D_VERTICES.push([
    (i & 1) ? 1 : -1,
    (i & 2) ? 1 : -1,
    (i & 4) ? 1 : -1,
    (i & 8) ? 1 : -1,
  ])
}

// 32 edges connecting vertices that differ in exactly 1 bit
export const TESSERACT_EDGES: [number, number][] = []
for (let i = 0; i < 16; i++) {
  for (let bit = 0; bit < 4; bit++) {
    const j = i ^ (1 << bit)
    if (i < j) {
      TESSERACT_EDGES.push([i, j])
    }
  }
}

/**
 * Projects a 4D hypercube vertex into 3D via dual-plane (X-W, Y-Z) rotation
 * and stereographic perspective division. Mutates `target` in-place.
 */
export function project4D(
  v: number[],
  angleXW: number,
  angleYZ: number,
  dist: number,
  size: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const [x, y, z, w] = v

  // Rotate in X-W plane
  const cosXW = Math.cos(angleXW)
  const sinXW = Math.sin(angleXW)
  const x1 = x * cosXW - w * sinXW
  const w1 = x * sinXW + w * cosXW

  // Rotate in Y-Z plane
  const cosYZ = Math.cos(angleYZ)
  const sinYZ = Math.sin(angleYZ)
  const y1 = y * cosYZ - z * sinYZ
  const z1 = y * sinYZ + z * cosYZ

  // Perspective 4D to 3D projection
  const denom = Math.max(0.2, dist - w1)
  const factor = (size * 1.5) / denom

  return target.set(x1 * factor, y1 * factor, z1 * factor)
}
