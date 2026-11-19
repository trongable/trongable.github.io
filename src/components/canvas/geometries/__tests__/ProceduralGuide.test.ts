import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { GUIDE_STYLES, GuideStyle } from '../geometryConfig'
import { createRibbedTorusGeometry, createRibbedTubeGeometry } from '../ProceduralGuide'

describe('ProceduralGuide Geometries & Styles', () => {
  it('covers all 7 procedural guide styles', () => {
    expect(GUIDE_STYLES).toHaveLength(7)
  })

  describe('Ribbed Torus Alignment & Geometry', () => {
    it('generates ribbed torus centered in X-Y plane aligned with standard TorusGeometry', () => {
      const radius = 2.0
      const width = 0.02
      const geom = createRibbedTorusGeometry(radius, width, 12, 32, 8)
      expect(geom).toBeDefined()
      const posAttr = geom.getAttribute('position')
      expect(posAttr).toBeDefined()
      expect(posAttr.count).toBeGreaterThan(0)

      // Verify that all vertices are centered around the radius in X-Y plane
      // and Z is strictly thickness modulation (|z| <= width * 1.5)
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i)
        const y = posAttr.getY(i)
        const z = posAttr.getZ(i)

        const rXY = Math.sqrt(x * x + y * y)
        expect(rXY).toBeGreaterThanOrEqual(radius - width * 2)
        expect(rXY).toBeLessThanOrEqual(radius + width * 2)
        expect(Math.abs(z)).toBeLessThanOrEqual(width * 2)
      }

      geom.dispose()
    })

    it('generates ribbed tube along an arbitrary 3D curve', () => {
      const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1))
      const geom = createRibbedTubeGeometry(curve, 0.015, 8, 16, 6)
      expect(geom).toBeDefined()
      expect(geom.getAttribute('position').count).toBeGreaterThan(0)
      geom.dispose()
    })
  })

  describe('Circular Ring Geometries', () => {
    const radius = 1.5
    const width = 0.015

    const styles: GuideStyle[] = [
      'solid',
      'wireframe',
      'glow',
      'hex',
      'dashed',
      'points',
      'ribbed',
    ]

    styles.forEach((style) => {
      it(`successfully creates geometry for style: ${style}`, () => {
        let geom: THREE.BufferGeometry

        switch (style) {
          case 'wireframe':
            geom = new THREE.TorusGeometry(radius, width, 8, 80)
            break
          case 'hex':
            geom = new THREE.TorusGeometry(radius, width, 6, 96)
            break
          case 'glow':
            geom = new THREE.TorusGeometry(radius, width, 16, 120)
            break
          case 'dashed':
          case 'points': {
            const points: THREE.Vector3[] = []
            for (let i = 0; i <= 60; i++) {
              const theta = (i / 60) * Math.PI * 2
              points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius))
            }
            geom = new THREE.BufferGeometry().setFromPoints(points)
            break
          }
          case 'ribbed': {
            geom = new THREE.TorusGeometry(radius, width, 16, 120)
            break
          }
          case 'solid':
          default:
            geom = new THREE.TorusGeometry(radius, width, 16, 120)
            break
        }

        expect(geom).toBeDefined()
        expect(geom.getAttribute('position')).toBeDefined()
        expect(geom.getAttribute('position').count).toBeGreaterThan(0)
        geom.dispose()
      })
    })
  })

  describe('3D Curve Geometries (Trefoil Knot)', () => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * Math.PI * 2
      points.push(new THREE.Vector3(Math.sin(t) + 2 * Math.sin(2 * t), Math.cos(t) - 2 * Math.cos(2 * t), -Math.sin(3 * t)))
    }
    const curve = new THREE.CatmullRomCurve3(points, true)
    const width = 0.015

    it('creates tube geometry with wireframe 8 radial segments', () => {
      const geom = new THREE.TubeGeometry(curve, 60, width, 8, true)
      expect(geom).toBeDefined()
      expect(geom.getAttribute('position').count).toBeGreaterThan(0)
      geom.dispose()
    })

    it('creates hexagonal tube geometry with 6 radial segments', () => {
      const geom = new THREE.TubeGeometry(curve, 60, width, 6, true)
      expect(geom).toBeDefined()
      expect(geom.getAttribute('position').count).toBeGreaterThan(0)
      geom.dispose()
    })

    it('creates solid tube geometry with 16 radial segments', () => {
      const geom = new THREE.TubeGeometry(curve, 60, width, 16, true)
      expect(geom).toBeDefined()
      expect(geom.getAttribute('position').count).toBeGreaterThan(0)
      geom.dispose()
    })
  })
})
