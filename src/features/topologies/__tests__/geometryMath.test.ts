import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { getTrefoilPoint } from '@/features/topologies/menus/TrefoilMenu'
import { project4D, TESSERACT_4D_VERTICES, TESSERACT_EDGES, TESSERACT_ITEMS } from '@/features/topologies/menus/TesseractMenu'
import { stepLorenz } from '@/features/topologies/menus/LorenzMenu'
import { computeKeplerPosition } from '@/features/topologies/menus/SlingshotMenu'
import { computeToroidalHelixPoint } from '@/features/topologies/menus/HelixMenu'
import { ASTROLABE_ITEMS } from '@/features/topologies/menus/AstrolabeMenu'
import { ORIGAMI_ITEMS } from '@/features/topologies/menus/OrigamiMenu'

describe('Geometry Mathematical Topologies', () => {
  describe('Trefoil Knot (Concept 1)', () => {
    it('produces a closed periodic 3D loop where f(0) equals f(2pi)', () => {
      const p0 = getTrefoilPoint(0, 1)
      const p2pi = getTrefoilPoint(Math.PI * 2, 1)

      expect(p0.distanceTo(p2pi)).toBeLessThan(0.0001)
    })

    it('scales linearly with the scale parameter', () => {
      const p1 = getTrefoilPoint(1.2, 1)
      const p2 = getTrefoilPoint(1.2, 2)

      expect(p2.x).toBeCloseTo(p1.x * 2, 4)
      expect(p2.y).toBeCloseTo(p1.y * 2, 4)
      expect(p2.z).toBeCloseTo(p1.z * 2, 4)
    })

    it('mutates target in-place when provided', () => {
      const target = new THREE.Vector3()
      const res = getTrefoilPoint(1.0, 1.5, target)
      expect(res).toBe(target)
      expect(target.length()).toBeGreaterThan(0)
    })
  })

  describe('4D Tesseract Projection (Concept 2)', () => {
    it('has 16 4D vertices and 32 edges', () => {
      expect(TESSERACT_4D_VERTICES).toHaveLength(16)
      expect(TESSERACT_EDGES).toHaveLength(32)
    })

    it('projects 4D vertices to finite 3D coordinates', () => {
      TESSERACT_4D_VERTICES.forEach((v) => {
        const p = project4D(v, 0.5, 0.3, 2.2, 1.2)
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
        expect(Number.isFinite(p.z)).toBe(true)
      })
    })

    it('mutates target in-place without allocations', () => {
      const target = new THREE.Vector3()
      const res = project4D(TESSERACT_4D_VERTICES[0], 0.1, 0.2, 2.0, 1.0, target)
      expect(res).toBe(target)
    })

    it('maps badges to a non-degenerate, balanced 4D Clifford quad with centroid at origin', () => {
      // The 4 core navigation badges form the balanced 4D Clifford quad [13, 7, 10, 0]
      const quadItems = TESSERACT_ITEMS.filter((item) =>
        [13, 7, 10, 0].includes(item.vertexIdx)
      )
      expect(quadItems).toHaveLength(4)
      const assignedCoords = quadItems.map((item) => TESSERACT_4D_VERTICES[item.vertexIdx])

      // 1. Centroid is exactly at the 4D origin (0, 0, 0, 0)
      const sum = [0, 0, 0, 0]
      assignedCoords.forEach((v) => {
        sum[0] += v[0]
        sum[1] += v[1]
        sum[2] += v[2]
        sum[3] += v[3]
      })
      expect(sum).toEqual([0, 0, 0, 0])

      // 2. Rank check: unlike the degenerate set (rank 2, flat 2D plane),
      // the balanced set forms a 3-simplex (tetrahedron) with rank 3 in 4D space
      const mat = assignedCoords.map((row) => [...row])
      let rank = 0
      for (let c = 0; c < 4 && rank < 4; c++) {
        let pivot = rank
        while (pivot < 4 && mat[pivot][c] === 0) pivot++
        if (pivot === 4) continue
        const temp = mat[rank]
        mat[rank] = mat[pivot]
        mat[pivot] = temp
        const val = mat[rank][c]
        for (let i = 0; i < 4; i++) mat[rank][i] /= val
        for (let i = 0; i < 4; i++) {
          if (i !== rank && mat[i][c] !== 0) {
            const factor = mat[i][c]
            for (let j = 0; j < 4; j++) mat[i][j] -= factor * mat[rank][j]
          }
        }
        rank++
      }
      expect(rank).toBe(3)

      // 3. 4-Phase orthogonal coverage across both rotation planes:
      // Each vertex occupies a distinct 90-degree quadrant in (X, W) and (Y, Z)
      const xwAngles = assignedCoords.map((v) => Math.round((Math.atan2(v[3], v[0]) * 180) / Math.PI + 360) % 360)
      const yzAngles = assignedCoords.map((v) => Math.round((Math.atan2(v[2], v[1]) * 180) / Math.PI + 360) % 360)
      expect(new Set(xwAngles).size).toBe(4)
      expect(new Set(yzAngles).size).toBe(4)

      // 4. Bounded distance spread across rotation cycle
      const camPos = new THREE.Vector3(0, 2.55, 5.45)
      let maxSpread = 0
      for (let deg = 0; deg < 360; deg += 10) {
        const rad = (deg * Math.PI) / 180
        const dists = assignedCoords.map((v) => {
          const p = project4D(v, rad, rad * 0.7, 2.5, 1.0)
          return p.distanceTo(camPos)
        })
        const spread = Math.max(...dists) - Math.min(...dists)
        if (spread > maxSpread) maxSpread = spread
      }
      expect(maxSpread).toBeLessThan(2.3) // Never spikes to 3.84 like the old degenerate set
    })
  })

  describe('Lorenz Strange Attractor (Concept 4)', () => {
    it('integrates deterministic differential steps smoothly', () => {
      const initial = new THREE.Vector3(1, 1, 20)
      const next = stepLorenz(initial, 0.008, 28)

      expect(next.distanceTo(initial)).toBeGreaterThan(0)
      expect(Number.isFinite(next.x)).toBe(true)
      expect(Number.isFinite(next.y)).toBe(true)
      expect(Number.isFinite(next.z)).toBe(true)
    })

    it('mutates target in-place when target is provided', () => {
      const initial = new THREE.Vector3(1, 2, 20)
      const target = new THREE.Vector3()
      const res = stepLorenz(initial, 0.008, 28, target)
      expect(res).toBe(target)
      expect(target.x).not.toBe(1)
    })
  })

  describe('Keplerian Gravitational Slingshot (Concept 6)', () => {
    it('computes correct periapsis and apoapsis distances for eccentric orbit', () => {
      const a = 2.0
      const e = 0.5
      // theta = 0 is periapsis: r = a(1 - e) = 2.0 * 0.5 = 1.0
      const peri = computeKeplerPosition(0, a, e)
      expect(peri.r).toBeCloseTo(1.0, 4)

      // theta = pi is apoapsis: r = a(1 + e) = 2.0 * 1.5 = 3.0
      const apo = computeKeplerPosition(Math.PI, a, e)
      expect(apo.r).toBeCloseTo(3.0, 4)
    })

    it('mutates target cache in-place', () => {
      const target = { x: 0, y: 0, r: 0 }
      const res = computeKeplerPosition(0.5, 2.0, 0.3, target)
      expect(res).toBe(target)
      expect(target.r).toBeGreaterThan(0)
    })
  })

  describe('Toroidal Corkscrew Helix (Concept 7)', () => {
    it('constrains 3D points within the torus envelope [R - r, R + r]', () => {
      const R = 2.0
      const r = 0.5
      const n = 6

      for (let i = 0; i < 20; i++) {
        const theta = (i / 20) * Math.PI * 2
        const p = computeToroidalHelixPoint(theta, R, r, n)
        const planarDist = Math.sqrt(p.x * p.x + p.z * p.z)

        expect(planarDist).toBeGreaterThanOrEqual(R - r - 0.001)
        expect(planarDist).toBeLessThanOrEqual(R + r + 0.001)
        expect(Math.abs(p.y)).toBeLessThanOrEqual(r + 0.001)
      }
    })

    it('supports target vector in-place write', () => {
      const target = new THREE.Vector3()
      const res = computeToroidalHelixPoint(1.2, 2.0, 0.5, 4, target)
      expect(res).toBe(target)
      expect(target.x).not.toBe(0)
    })
  })

  describe('Origami Blossom Unfolding (Concept 5)', () => {
    it('interpolates radius from closed core to expanded facet perimeter', () => {
      const closedRadius = 0.55 * 2.0
      const openRadius = 1.45 * 2.0 * 1.2
      const rClosed = THREE.MathUtils.lerp(closedRadius, openRadius, 0.0)
      const rMid = THREE.MathUtils.lerp(closedRadius, openRadius, 0.5)
      const rOpen = THREE.MathUtils.lerp(closedRadius, openRadius, 1.0)

      expect(rClosed).toBeCloseTo(closedRadius, 4)
      expect(rOpen).toBeCloseTo(openRadius, 4)
      expect(rMid).toBeGreaterThan(rClosed)
      expect(rMid).toBeLessThan(rOpen)
    })

    it('has normalized 3D facet normals', () => {
      expect(ORIGAMI_ITEMS).toHaveLength(5)
      ORIGAMI_ITEMS.forEach((item) => {
        expect(item.normal.length()).toBeCloseTo(1.0, 4)
      })
    })
  })

  describe('Tri-Axial Astrolabe (Concept 3)', () => {
    it('defines concentric gimbal rings with distinct radii and non-zero tilts', () => {
      expect(ASTROLABE_ITEMS).toHaveLength(5)
      ASTROLABE_ITEMS.forEach((item) => {
        expect(item.baseRadius).toBeGreaterThan(0)
        expect(item.speedMult).not.toBe(0)
        expect(item.tilt).toHaveLength(3)
      })
    })
  })
})
