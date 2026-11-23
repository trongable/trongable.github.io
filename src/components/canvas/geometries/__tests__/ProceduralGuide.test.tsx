import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import * as THREE from 'three'
import {
  ProceduralGuide,
  createRibbedTorusGeometry,
  createRibbedTubeGeometry,
} from '../ProceduralGuide'
import { GUIDE_STYLES, GuideStyle } from '../geometryConfig'
import {
  stepFrame,
  clearFrameRegistry,
} from '@/testUtils/r3fTestUtils'

describe('ProceduralGuide Component & Geometries', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  describe('Procedural Geometry Generation', () => {
    it('generates ribbed torus centered in X-Y plane aligned with TorusGeometry', () => {
      // Given: radius and width parameters
      const radius = 2.0
      const width = 0.02

      // When: creating ribbed torus geometry
      const geom = createRibbedTorusGeometry(radius, width, 12, 32, 8)

      // Then: vertices are created and clamped around radius
      const posAttr = geom.getAttribute('position')
      expect(posAttr).toBeDefined()
      expect(posAttr.count).toBeGreaterThan(0)

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
      // Given: 3D line curve
      const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1))

      // When: creating ribbed tube geometry
      const geom = createRibbedTubeGeometry(curve, 0.015, 8, 16, 6)

      // Then: positions exist
      expect(geom.getAttribute('position').count).toBeGreaterThan(0)
      geom.dispose()
    })
  })

  describe('Circular Ring Guide Styles', () => {
    GUIDE_STYLES.forEach((styleObj) => {
      const style = styleObj.id
      it(`renders circular guide for style: "${style}" and updates in useFrame`, () => {
        // Given & When: rendered with specific style
        const { container, unmount } = render(
          <ProceduralGuide
            style={style}
            radius={1.5}
            width={0.015}
            color="#e2f872"
            highlightColor="#ffffff"
            opacity={0.8}
            visible={true}
          />
        )

        // Then: appropriate Three element is rendered
        expect(container.firstChild).toBeInTheDocument()

        // And When: stepping frame
        act(() => {
          stepFrame(0.016)
        })

        // Then: cleans up cleanly on unmount
        unmount()
      })
    })
  })

  describe('3D Curve Guide Styles', () => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 20; i++) {
      const t = (i / 20) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(t), Math.sin(t), Math.sin(t * 2) * 0.5))
    }
    const sampleCurve = new THREE.CatmullRomCurve3(points, true)

    const curveStyles: GuideStyle[] = ['solid', 'wireframe', 'glow', 'dashed', 'points', 'ribbed']

    curveStyles.forEach((style) => {
      it(`renders 3D curve guide for style: "${style}"`, () => {
        // Given & When: rendered with 3D curve
        const { container, unmount } = render(
          <ProceduralGuide
            style={style}
            curve={sampleCurve}
            width={0.015}
            color="#83d4d4"
            opacity={0.9}
            visible={true}
          />
        )

        // Then: element exists
        expect(container.firstChild).toBeInTheDocument()

        // And When: stepping frame
        act(() => {
          stepFrame(0.016)
        })

        unmount()
      })
    })
  })
})
