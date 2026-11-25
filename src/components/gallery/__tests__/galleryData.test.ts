import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { VIDEOS_DATA, GALLERY_DATA, randomizeGallery, computeSphericalPosition, CEREBRO_RADIUS } from '../galleryData'

describe('galleryData module', () => {
  it('contains exactly 7 videos matching user requirements', () => {
    expect(VIDEOS_DATA).toHaveLength(7)
  })

  it('contains all 31 gallery items (7 videos + 24 photos)', () => {
    expect(GALLERY_DATA).toHaveLength(31)
    const videos = GALLERY_DATA.filter((i) => i.type === 'video')
    const photos = GALLERY_DATA.filter((i) => i.type === 'photo')
    expect(videos).toHaveLength(7)
    expect(photos).toHaveLength(24)
  })

  it('randomizeGallery produces a valid 31-item permutation across 3 spherical tiers', () => {
    const shuffled = randomizeGallery(GALLERY_DATA)
    expect(shuffled).toHaveLength(31)

    // All original items preserved
    const originalIds = new Set(GALLERY_DATA.map((i) => i.id))
    const shuffledIds = new Set(shuffled.map((i) => i.id))
    expect(shuffledIds).toEqual(originalIds)

    // 10 in upper, 11 in middle, 10 in lower
    const upper = shuffled.filter((i) => i.tier === 'upper')
    const middle = shuffled.filter((i) => i.tier === 'middle')
    const lower = shuffled.filter((i) => i.tier === 'lower')
    expect(upper).toHaveLength(10)
    expect(middle).toHaveLength(11)
    expect(lower).toHaveLength(10)

    // Indices and slots properly configured
    shuffled.forEach((item, idx) => {
      expect(item.index).toBe(idx + 1)
      const expectedTotal = item.tier === 'middle' ? 11 : 10
      expect(item.totalInTier).toBe(expectedTotal)
      expect(item.indexInTier).toBeGreaterThanOrEqual(0)
      expect(item.indexInTier).toBeLessThan(expectedTotal)
    })
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

  it('correctly partitions total gallery items into 3 spherical tiers (10 upper, 11 middle, 10 lower)', () => {
    const upper = GALLERY_DATA.filter((v) => v.tier === 'upper')
    const middle = GALLERY_DATA.filter((v) => v.tier === 'middle')
    const lower = GALLERY_DATA.filter((v) => v.tier === 'lower')

    expect(upper).toHaveLength(10)
    expect(middle).toHaveLength(11)
    expect(lower).toHaveLength(10)

    upper.forEach((v) => expect(v.elevationDeg).toBeGreaterThan(0))
    middle.forEach((v) => expect(v.elevationDeg).toBe(0))
    lower.forEach((v) => expect(v.elevationDeg).toBeLessThan(0))
  })

  it('correctly partitions videos across 3 tiers (2 upper, 3 middle, 2 lower)', () => {
    const upperVideos = VIDEOS_DATA.filter((v) => v.tier === 'upper')
    const middleVideos = VIDEOS_DATA.filter((v) => v.tier === 'middle')
    const lowerVideos = VIDEOS_DATA.filter((v) => v.tier === 'lower')

    expect(upperVideos).toHaveLength(2)
    expect(middleVideos).toHaveLength(3)
    expect(lowerVideos).toHaveLength(2)
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

  it('provides valid lightweight WebP thumbnail URLs for all photos and YouTube thumbnails for videos', () => {
    GALLERY_DATA.forEach((item) => {
      expect(item.thumbnailUrl).toBeDefined()
      expect(item.thumbnailUrl.length).toBeGreaterThan(0)
      if (item.type === 'photo') {
        expect(item.thumbnailUrl).toContain('/images/gallery/thumbnails/')
        expect(item.thumbnailUrl.endsWith('.webp')).toBe(true)
      } else {
        expect(item.thumbnailUrl).toContain('img.youtube.com/vi/')
      }
    })
  })
})
