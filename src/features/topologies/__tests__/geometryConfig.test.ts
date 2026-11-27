import { describe, it, expect } from 'vitest'
import {
  GEOMETRY_MODES,
  DEFAULT_GEOMETRY_PARAMS,
  DEFAULT_GEOMETRY_MODE,
  isValidGeometryMode,
  GeometryMode,
  GUIDE_STYLES,
} from '@/features/topologies/config/geometryConfig'

describe('geometryConfig', () => {
  it('defines 7 procedural guide styles', () => {
    expect(GUIDE_STYLES).toHaveLength(7)
    expect(GUIDE_STYLES.map((s) => s.id)).toEqual([
      'solid',
      'wireframe',
      'glow',
      'hex',
      'dashed',
      'points',
      'ribbed',
    ])
  })

  it('ensures all 8 geometries have guides enabled by default with their native style', () => {
    expect(DEFAULT_GEOMETRY_PARAMS.halo.showGuide).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.halo.guideStyle).toBe('solid')
    expect(DEFAULT_GEOMETRY_PARAMS.halo.guideWidth).toBe(0.015)

    expect(DEFAULT_GEOMETRY_PARAMS.trefoil.showTrack).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.trefoil.trackStyle).toBe('wireframe')
    expect(DEFAULT_GEOMETRY_PARAMS.trefoil.tubeRadius).toBe(0.015)

    expect(DEFAULT_GEOMETRY_PARAMS.astrolabe.showRings).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.astrolabe.ringStyle).toBe('solid')
    expect(DEFAULT_GEOMETRY_PARAMS.astrolabe.ringWidth).toBe(0.012)

    expect(DEFAULT_GEOMETRY_PARAMS.helix.showCoil).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.helix.coilStyle).toBe('solid')
    expect(DEFAULT_GEOMETRY_PARAMS.helix.coilWidth).toBe(0.012)

    expect(DEFAULT_GEOMETRY_PARAMS.slingshot.showOrbits).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.slingshot.orbitStyle).toBe('solid')
    expect(DEFAULT_GEOMETRY_PARAMS.slingshot.orbitWidth).toBe(0.012)

    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.showWires).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.wireStyle).toBe('solid')

    expect(DEFAULT_GEOMETRY_PARAMS.lorenz.showParticles).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.lorenz.trailStyle).toBe('solid')

    expect(DEFAULT_GEOMETRY_PARAMS.origami.showWires).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.origami.wireStyle).toBe('wireframe')
  })
  it('sets tesseract as the default geometry mode with wireframe visible', () => {
    expect(DEFAULT_GEOMETRY_MODE).toBe('tesseract')
    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.showWires).toBe(true)
    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.speed4D).toBe(0.25)
    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.cubeSize).toBe(1.15)
    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.distance).toBe(2.2)
  })

  it('sets default origami facet scale to 0.60x', () => {
    expect(DEFAULT_GEOMETRY_PARAMS.origami.facetScale).toBe(0.60)
  })
  it('defines all 8 geometry modes with unique ids and descriptions', () => {
    expect(GEOMETRY_MODES).toHaveLength(8)

    const expectedModes: GeometryMode[] = [
      'halo',
      'trefoil',
      'tesseract',
      'astrolabe',
      'lorenz',
      'origami',
      'slingshot',
      'helix',
    ]

    expectedModes.forEach((mode) => {
      const found = GEOMETRY_MODES.find((m) => m.id === mode)
      expect(found).toBeDefined()
      expect(found?.name).toBeTruthy()
      expect(found?.label).toBe(mode)
      expect(found?.description).toBeTruthy()
    })
  })

  it('validates geometry modes via isValidGeometryMode', () => {
    expect(isValidGeometryMode('halo')).toBe(true)
    expect(isValidGeometryMode('trefoil')).toBe(true)
    expect(isValidGeometryMode('tesseract')).toBe(true)
    expect(isValidGeometryMode('astrolabe')).toBe(true)
    expect(isValidGeometryMode('lorenz')).toBe(true)
    expect(isValidGeometryMode('origami')).toBe(true)
    expect(isValidGeometryMode('slingshot')).toBe(true)
    expect(isValidGeometryMode('helix')).toBe(true)

    expect(isValidGeometryMode('invalid')).toBe(false)
    expect(isValidGeometryMode('')).toBe(false)
    expect(isValidGeometryMode('circle')).toBe(false)
  })

  it('provides default parameters for all 8 modes', () => {
    expect(DEFAULT_GEOMETRY_PARAMS.halo.speed).toBeGreaterThan(0)
    expect(DEFAULT_GEOMETRY_PARAMS.trefoil.speed).toBeGreaterThan(0)
    expect(DEFAULT_GEOMETRY_PARAMS.tesseract.speed4D).toBeGreaterThan(0)
    expect(DEFAULT_GEOMETRY_PARAMS.astrolabe.speed).toBeGreaterThan(0)
    expect(DEFAULT_GEOMETRY_PARAMS.lorenz.rho).toBe(28)
    expect(DEFAULT_GEOMETRY_PARAMS.origami.unfold).toBe(1.0)
    expect(DEFAULT_GEOMETRY_PARAMS.slingshot.eccentricity).toBe(0.68)
    expect(DEFAULT_GEOMETRY_PARAMS.helix.coils).toBe(6)
  })
})
