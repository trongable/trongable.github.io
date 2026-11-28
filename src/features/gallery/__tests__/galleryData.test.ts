import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import {
  VIDEOS_DATA,
  GALLERY_DATA,
  layoutGalleryTiers,
  randomizeGallery,
  computeSphericalPosition,
  computePanelAzimuthDeg,
  CEREBRO_RADIUS,
} from '@/features/gallery/data/galleryData'

describe('galleryData module', () => {
  it('contains all 29 videos (7 original + 22 B-roll playlist)', () => {
    expect(VIDEOS_DATA).toHaveLength(29)
  })

  it('contains all 60 gallery items (29 videos + 31 photos)', () => {
    expect(GALLERY_DATA).toHaveLength(60)
    const videos = GALLERY_DATA.filter((i) => i.type === 'video')
    const photos = GALLERY_DATA.filter((i) => i.type === 'photo')
    expect(videos).toHaveLength(29)
    expect(photos).toHaveLength(31)
  })

  it('uses consistent lowercase casing across all gallery titles', () => {
    GALLERY_DATA.forEach((item) => {
      expect(item.title).toBe(item.title.toLowerCase())
    })
  })

  it('randomizeGallery produces a valid 60-item permutation across 4 spherical tiers by default', () => {
    const shuffled = randomizeGallery(GALLERY_DATA)
    expect(shuffled).toHaveLength(60)

    // All original items preserved
    const originalIds = new Set(GALLERY_DATA.map((i) => i.id))
    const shuffledIds = new Set(shuffled.map((i) => i.id))
    expect(shuffledIds).toEqual(originalIds)

    // 15 in upper, 15 in upper-mid, 15 in lower-mid, 15 in lower
    const upper = shuffled.filter((i) => i.tier === 'upper')
    const upperMid = shuffled.filter((i) => i.tier === 'upper-mid')
    const lowerMid = shuffled.filter((i) => i.tier === 'lower-mid')
    const lower = shuffled.filter((i) => i.tier === 'lower')
    expect(upper).toHaveLength(15)
    expect(upperMid).toHaveLength(15)
    expect(lowerMid).toHaveLength(15)
    expect(lower).toHaveLength(15)

    // Indices and slots properly configured
    shuffled.forEach((item, idx) => {
      expect(item.index).toBe(idx + 1)
      expect(item.totalInTier).toBe(15)
      expect(item.indexInTier).toBeGreaterThanOrEqual(0)
      expect(item.indexInTier).toBeLessThan(15)
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
      '1CorPsJtwM8',
      'LrvfELsyZVY',
      'r6YJfytbRE8',
      'Qv4f0Z9UyBc',
      'jbsUj8ZGJ0Q',
      'FZkjZuTGTWk',
      'EJ9YCugHMfI',
      'AglZHPEcqnc',
      'ARlMMjH9S6U',
      'JgRafkC2D9w',
      'wBb8EO6GWMQ',
      '76yTpY6OEJA',
      'I6nAwyrAr0s',
      'AqUk9zJXt_M',
      'xZz_ZF7bIEs',
      'DD-5Qr_u_mE',
      '9k0ml1YD3I4',
      '5Htdp2kELys',
      'DjuyoTjaEBY',
      'Rk2zJAotf2o',
      'QPG8lMWOphs',
      'Vk0l7fatwbA',
    ]
    const actualIds = VIDEOS_DATA.map((v) => v.youtubeId)
    expect(actualIds).toEqual(expectedIds)
  })

  it('has valid highest-resolution YouTube thumbnail URLs for each video', () => {
    VIDEOS_DATA.forEach((video) => {
      expect(video.thumbnailUrl).toContain('img.youtube.com/vi/')
      expect(video.thumbnailUrl).toContain(video.youtubeId)
    })
  })

  it('correctly partitions total gallery items into 4 spherical tiers (15 per tier)', () => {
    const upper = GALLERY_DATA.filter((v) => v.tier === 'upper')
    const upperMid = GALLERY_DATA.filter((v) => v.tier === 'upper-mid')
    const lowerMid = GALLERY_DATA.filter((v) => v.tier === 'lower-mid')
    const lower = GALLERY_DATA.filter((v) => v.tier === 'lower')

    expect(upper).toHaveLength(15)
    expect(upperMid).toHaveLength(15)
    expect(lowerMid).toHaveLength(15)
    expect(lower).toHaveLength(15)

    upper.forEach((v) => expect(v.elevationDeg).toBeGreaterThan(15))
    upperMid.forEach((v) => expect(v.elevationDeg).toBeGreaterThan(0))
    lowerMid.forEach((v) => expect(v.elevationDeg).toBeLessThan(0))
    lower.forEach((v) => expect(v.elevationDeg).toBeLessThan(-15))
  })

  it('partitions custom subsets cleanly across the 4-tier spherical layout', () => {
    const fourTier = layoutGalleryTiers(GALLERY_DATA.slice(0, 40), 340, 6.0, 1.8)
    const upper = fourTier.filter((v) => v.tier === 'upper')
    const upperMid = fourTier.filter((v) => v.tier === 'upper-mid')
    const lowerMid = fourTier.filter((v) => v.tier === 'lower-mid')
    const lower = fourTier.filter((v) => v.tier === 'lower')

    expect(upper).toHaveLength(10)
    expect(upperMid).toHaveLength(10)
    expect(lowerMid).toHaveLength(10)
    expect(lower).toHaveLength(10)

    upper.forEach((v) => expect(v.elevationDeg).toBeGreaterThan(15))
    upperMid.forEach((v) => expect(v.elevationDeg).toBeGreaterThan(0))
    lowerMid.forEach((v) => expect(v.elevationDeg).toBeLessThan(0))
    lower.forEach((v) => expect(v.elevationDeg).toBeLessThan(-15))
  })

  it('computes distinct non-overlapping spherical positions on radius R', () => {
    const positions = GALLERY_DATA.map((v) =>
      computeSphericalPosition(CEREBRO_RADIUS, v.azimuthDeg, v.elevationDeg)
    )

    // Check that every pair of positions has a minimum separation distance
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j])
        expect(dist).toBeGreaterThan(1.4) // Sufficient clearance between panels
      }
    }
  })

  it('computes radial distance equal to radius R', () => {
    const target = new THREE.Vector3()
    const pos = computeSphericalPosition(5.0, 30, 20, target)
    expect(pos).toBe(target)
    expect(pos.length()).toBeCloseTo(5.0, 4)
  })

  it('distributes closed 360-degree rings evenly with zero overlap across the ±180 seam', () => {
    const count = 15
    const azimuths = Array.from({ length: count }, (_, idx) =>
      computePanelAzimuthDeg(idx, count, 360)
    )
    expect(azimuths[0]).toBeCloseTo(-168, 4)
    expect(azimuths[count - 1]).toBeCloseTo(168, 4)
    for (let i = 1; i < azimuths.length; i++) {
      expect(azimuths[i] - azimuths[i - 1]).toBeCloseTo(24, 4)
    }
    // Wrap-around gap between last (168) and first (-168 + 360 = 192) is also 24 deg
    expect(azimuths[0] + 360 - azimuths[count - 1]).toBeCloseTo(24, 4)
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
