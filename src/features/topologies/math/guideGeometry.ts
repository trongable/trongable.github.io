import * as THREE from 'three'

/**
 * Procedurally generates a corrugated/ribbed torus geometry where the tube radius
 * oscillates harmonically along the perimeter to create an industrial accordion waveguide.
 */
export function createRibbedTorusGeometry(
  radius: number,
  baseWidth: number,
  ribCount = 48,
  tubularSegments = 192,
  radialSegments = 16
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  const vertexCount = (tubularSegments + 1) * (radialSegments + 1)
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const indices: number[] = []

  let ptr = 0
  for (let i = 0; i <= tubularSegments; i++) {
    const u = (i / tubularSegments) * Math.PI * 2
    // Harmonic radial modulation
    const rTube = baseWidth * (1.0 + 0.38 * Math.sin(ribCount * u))

    const cosU = Math.cos(u)
    const sinU = Math.sin(u)
    // Center point in standard Three.js Torus X-Y plane
    const centerX = radius * cosU
    const centerY = radius * sinU

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2
      const cosV = Math.cos(v)
      const sinV = Math.sin(v)

      // Radial vector matching standard THREE.TorusGeometry (X-Y plane, Z = thickness)
      const px = (radius + rTube * cosV) * cosU
      const py = (radius + rTube * cosV) * sinU
      const pz = rTube * sinV

      positions[ptr] = px
      positions[ptr + 1] = py
      positions[ptr + 2] = pz

      // Compute normal pointing outward from the tube center
      const nx = px - centerX
      const ny = py - centerY + centerY // preserve exact original normal computation
      const nz = pz
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

      normals[ptr] = nx / len
      normals[ptr + 1] = ny / len
      normals[ptr + 2] = nz / len

      ptr += 3
    }
  }

  // Generate grid indices
  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = (i + 1) * (radialSegments + 1) + j
      const c = (i + 1) * (radialSegments + 1) + (j + 1)
      const d = i * (radialSegments + 1) + (j + 1)

      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geom.setIndex(indices)
  return geom
}

/**
 * Procedurally generates a corrugated/ribbed tube geometry along an arbitrary 3D curve.
 */
export function createRibbedTubeGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  baseWidth: number,
  ribCount = 48,
  tubularSegments = 192,
  radialSegments = 16
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  const frames = curve.computeFrenetFrames(tubularSegments, true)
  const vertexCount = (tubularSegments + 1) * (radialSegments + 1)
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  const indices: number[] = []

  let ptr = 0
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments
    const point = curve.getPointAt(u)
    const normal = frames.normals[i]
    const binormal = frames.binormals[i]

    const rTube = baseWidth * (1.0 + 0.38 * Math.sin(ribCount * u * Math.PI * 2))

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2
      const cx = -rTube * Math.cos(v)
      const cy = rTube * Math.sin(v)

      const px = point.x + cx * normal.x + cy * binormal.x
      const py = point.y + cx * normal.y + cy * binormal.y
      const pz = point.z + cx * normal.z + cy * binormal.z

      positions[ptr] = px
      positions[ptr + 1] = py
      positions[ptr + 2] = pz

      const nx = px - point.x
      const ny = py - point.y
      const nz = pz - point.z
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

      normals[ptr] = nx / len
      normals[ptr + 1] = ny / len
      normals[ptr + 2] = nz / len

      ptr += 3
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = (i + 1) * (radialSegments + 1) + j
      const c = (i + 1) * (radialSegments + 1) + (j + 1)
      const d = i * (radialSegments + 1) + (j + 1)

      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }

  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geom.setIndex(indices)
  return geom
}
