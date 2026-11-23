import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { VIDEOS_DATA, computeSphericalPosition, CEREBRO_RADIUS } from '../videoData'

describe('videoData module', () => {
  it('contains exactly 7 videos matching user requirements', () => {
    expect(VIDEOS_DATA).toHaveLength(7)
  })

  it('contains all specified YouTube video IDs', () => {
    const expectedIds = [
      'qopBymi9FYY',
      'q_25b9zlUa0',
      '5qR27jBSYaE',
      '7ZCbvoHtwSY',
      '_ZMbKpKUmsU',
      'OPB3AVjlPyg',
      'NXck93vKCpQ',
    ]
    const actualIds = VIDEOS_DATA.map((v) => v.youtubeId)
    expect(actualIds).toEqual(expectedIds)
  })

  it('has valid YouTube thumbnail URLs for each video', () => {
    VIDEOS_DATA.forEach((video) => {
      expect(video.thumbnailUrl).toContain('img.youtube.com/vi/')
      expect(video.thumbnailUrl).toContain(video.youtubeId)
    })
  })

  it('correctly partitions videos into 4 upper tier and 3 lower tier', () => {
    const upper = VIDEOS_DATA.filter((v) => v.tier === 'upper')
    const lower = VIDEOS_DATA.filter((v) => v.tier === 'lower')

    expect(upper).toHaveLength(4)
    expect(lower).toHaveLength(3)

    upper.forEach((v) => expect(v.elevationDeg).toBeGreaterThan(0))
    lower.forEach((v) => expect(v.elevationDeg).toBeLessThan(0))
  })

  it('computes distinct non-overlapping spherical positions on radius R', () => {
    const positions = VIDEOS_DATA.map((v) =>
      computeSphericalPosition(CEREBRO_RADIUS, v.azimuthDeg, v.elevationDeg)
    )

    // Check that every pair of positions has a minimum separation distance
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j])
        expect(dist).toBeGreaterThan(1.5) // Sufficient clearance between panels
      }
    }
  })

  it('computes radial distance equal to radius R', () => {
    const target = new THREE.Vector3()
    const pos = computeSphericalPosition(5.0, 30, 20, target)
    expect(pos).toBe(target)
    expect(pos.length()).toBeCloseTo(5.0, 4)
  })
})
