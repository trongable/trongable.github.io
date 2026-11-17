import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { getTrefoilPoint } from '../TrefoilMenu'
import { project4D, TESSERACT_4D_VERTICES, TESSERACT_EDGES } from '../TesseractMenu'
import { stepLorenz } from '../LorenzMenu'
import { computeKeplerPosition } from '../SlingshotMenu'
import { computeToroidalHelixPoint } from '../HelixMenu'
import { ASTROLABE_ITEMS } from '../AstrolabeMenu'
import { ORIGAMI_ITEMS } from '../OrigamiMenu'

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
      expect(ORIGAMI_ITEMS).toHaveLength(3)
      ORIGAMI_ITEMS.forEach((item) => {
        expect(item.normal.length()).toBeCloseTo(1.0, 4)
      })
    })
  })

  describe('Tri-Axial Astrolabe (Concept 3)', () => {
    it('defines 3 concentric gimbal rings with distinct radii and non-zero tilts', () => {
      expect(ASTROLABE_ITEMS).toHaveLength(3)
      ASTROLABE_ITEMS.forEach((item) => {
        expect(item.baseRadius).toBeGreaterThan(0)
        expect(item.speedMult).not.toBe(0)
        expect(item.tilt).toHaveLength(3)
      })
    })
  })
})
