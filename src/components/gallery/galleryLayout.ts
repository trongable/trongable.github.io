import * as THREE from 'three'
import { GalleryItem, TierKind, RAW_GALLERY_DATA } from './galleryCatalog'

/**
 * Distributes any number of gallery items evenly across the 3 spherical tiers
 * (upper, middle, lower), assigning extra items to the middle equator first
 * where circumference is largest.
 */
export function layoutGalleryTiers(items: GalleryItem[]): GalleryItem[] {
  const n = items.length
  const base = Math.floor(n / 3)
  const rem = n % 3
  const upperCount = base + (rem === 2 ? 1 : 0)
  const middleCount = base + (rem >= 1 ? 1 : 0)
  const lowerCount = n - upperCount - middleCount

  return items.map((item, idx) => {
    let tier: TierKind = 'middle'
    let elevationDeg = 0
    let indexInTier = 0
    let totalInTier = middleCount

    if (idx < upperCount) {
      tier = 'upper'
      elevationDeg = 23.6
      indexInTier = idx
      totalInTier = upperCount
    } else if (idx < upperCount + middleCount) {
      tier = 'middle'
      elevationDeg = 0
      indexInTier = idx - upperCount
      totalInTier = middleCount
    } else {
      tier = 'lower'
      elevationDeg = -23.6
      indexInTier = idx - upperCount - middleCount
      totalInTier = lowerCount
    }

    const stepRatio = totalInTier > 1 ? indexInTier / (totalInTier - 1) : 0.5
    const azimuthDeg = -110 + stepRatio * 220

    return {
      ...item,
      index: idx + 1,
      tier,
      indexInTier,
      totalInTier,
      azimuthDeg,
      elevationDeg,
    }
  })
}

export const GALLERY_DATA: GalleryItem[] = layoutGalleryTiers(
  RAW_GALLERY_DATA.map((item) => {
    const isVideo = item.type === 'video'
    // Photos use optimized 640px WebP thumbnails for 3D sphere texture; videos use YouTube thumbnail
    const thumb = isVideo
      ? item.imageUrl
      : item.imageUrl.replace('/images/gallery/', '/images/gallery/thumbnails/').replace('.jpg', '.webp')

    return {
      ...item,
      thumbnailUrl: thumb,
      hqThumbnailUrl: item.hqImageUrl || item.imageUrl,
    }
  })
)

// Backward-compatible alias filtering strictly the 7 videos
export const VIDEOS_DATA: GalleryItem[] = GALLERY_DATA.filter((item) => item.type === 'video')

/**
 * Randomizes gallery items across the 3 spherical tiers on page load.
 * Uses Fisher-Yates shuffle and reassigns spatial coordinates (tier, azimuthDeg, elevationDeg).
 */
export function randomizeGallery(items: GalleryItem[]): GalleryItem[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }

  return layoutGalleryTiers(shuffled)
}

/**
 * Computes the 3D position vector on an inward-facing sphere of radius R.
 * Zero-allocation: mutates the optional target vector in place.
 */
export function computeSphericalPosition(
  radius: number,
  azimuthDeg: number,
  elevationDeg: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const theta = THREE.MathUtils.degToRad(azimuthDeg)
  const phi = THREE.MathUtils.degToRad(elevationDeg)
  const cosPhi = Math.cos(phi)

  target.set(
    radius * cosPhi * Math.sin(theta),
    radius * Math.sin(phi),
    -radius * cosPhi * Math.cos(theta)
  )
  return target
}
