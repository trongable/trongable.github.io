import * as THREE from 'three'
import { GalleryItem, TierKind, RAW_GALLERY_DATA } from '@/features/gallery/data/galleryCatalog'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from '@/features/gallery/data/galleryTunerConfig'

export const CHAMBER_FOV_DEG = 46

/**
 * Returns the vertical row multiplier for a given tier in 3-tier or 4-tier layouts.
 */
export function tierFactorForTier(tier: TierKind): number {
  switch (tier) {
    case 'upper':
      return 1
    case 'upper-mid':
      return 0.5
    case 'middle':
      return 0
    case 'lower-mid':
      return -0.5
    case 'lower':
      return -1
  }
}

/**
 * Computes the vertical row multiplier given both tier name and active tier count.
 */
export function getTierFactor(tier: TierKind, tierCount: 3 | 4): number {
  if (tierCount === 4) {
    if (tier === 'upper') return 1.5
    if (tier === 'lower') return -1.5
  }
  return tierFactorForTier(tier)
}

/**
 * Computes panel azimuth in degrees for a slot within a tier.
 * When arcDegrees >= 360, distributes panels evenly around a closed 360° ring
 * so the first and last panels never overlap at the ±180° seam.
 */
export function computePanelAzimuthDeg(
  indexInTier: number,
  totalInTier: number,
  arcDegrees: number
): number {
  if (totalInTier <= 1) return 0
  if (arcDegrees >= 360) {
    return -180 + ((indexInTier + 0.5) / totalInTier) * 360
  }
  const stepRatio = Math.max(0, Math.min(1, indexInTier / (totalInTier - 1)))
  return -arcDegrees / 2 + stepRatio * arcDegrees
}

/**
 * Computes a gallery panel's azimuth & elevation (degrees) from chamber layout params.
 */
export function computePanelSphericalAngles(
  item: Pick<GalleryItem, 'tier' | 'index' | 'indexInTier' | 'totalInTier'>,
  tierCount: 3 | 4,
  arcDegrees: number,
  sphereRadius: number,
  rowSeparation: number
): { azimuthDeg: number; elevationDeg: number } {
  const totalInTier = item.totalInTier ?? 9
  const indexInTier =
    typeof item.indexInTier === 'number'
      ? item.indexInTier
      : (item.index - 1) % totalInTier
  const azimuthDeg = computePanelAzimuthDeg(indexInTier, totalInTier, arcDegrees)
  const tierFactor = getTierFactor(item.tier, tierCount)
  const clampedRatio = Math.max(-0.95, Math.min(0.95, (tierFactor * rowSeparation) / sphereRadius))
  const elevationDeg = THREE.MathUtils.radToDeg(Math.asin(clampedRatio))
  return { azimuthDeg, elevationDeg }
}

/**
 * Derives vertical & horizontal camera FOV radians for 1:1 drag/wheel angular tracking.
 */
export function computeFovMetrics(
  viewportWidth: number,
  viewportHeight: number,
  fovDeg = CHAMBER_FOV_DEG
): { fovY: number; horizontalFov: number } {
  const aspect = viewportWidth / viewportHeight
  const fovY = THREE.MathUtils.degToRad(fovDeg)
  const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect)
  return { fovY, horizontalFov: Math.max(fovX, fovY) }
}

/**
 * Distributes any number of gallery items evenly across 3 or 4 spherical tiers,
 * assigning extra items to the equatorial rows first where circumference is largest.
 */
export function layoutGalleryTiers(
  items: GalleryItem[],
  tierCount: 3 | 4 = DEFAULT_GALLERY_CHAMBER_PARAMS.tierCount,
  arcDegrees: number = DEFAULT_GALLERY_CHAMBER_PARAMS.arcDegrees,
  sphereRadius: number = DEFAULT_GALLERY_CHAMBER_PARAMS.sphereRadius,
  rowSeparation: number = DEFAULT_GALLERY_CHAMBER_PARAMS.rowSeparation
): GalleryItem[] {
  const n = items.length

  let tiers: Array<{ name: TierKind; factor: number; count: number }>
  if (tierCount === 4) {
    const base = Math.floor(n / 4)
    const rem = n % 4
    // Extra items prioritize the two inner equatorial rows first, then upper
    const upperCount = base + (rem >= 3 ? 1 : 0)
    const upperMidCount = base + (rem >= 1 ? 1 : 0)
    const lowerMidCount = base + (rem >= 2 ? 1 : 0)
    const lowerCount = n - upperCount - upperMidCount - lowerMidCount
    tiers = [
      { name: 'upper', factor: 1.5, count: upperCount },
      { name: 'upper-mid', factor: 0.5, count: upperMidCount },
      { name: 'lower-mid', factor: -0.5, count: lowerMidCount },
      { name: 'lower', factor: -1.5, count: lowerCount },
    ]
  } else {
    const base = Math.floor(n / 3)
    const rem = n % 3
    const upperCount = base + (rem === 2 ? 1 : 0)
    const middleCount = base + (rem >= 1 ? 1 : 0)
    const lowerCount = n - upperCount - middleCount
    tiers = [
      { name: 'upper', factor: 1, count: upperCount },
      { name: 'middle', factor: 0, count: middleCount },
      { name: 'lower', factor: -1, count: lowerCount },
    ]
  }

  return items.map((item, idx) => {
    let remaining = idx
    let chosen = tiers[tiers.length - 1]
    for (const t of tiers) {
      if (remaining < t.count) {
        chosen = t
        break
      }
      remaining -= t.count
    }

    const indexInTier = remaining
    const totalInTier = chosen.count
    const clampedRatio = Math.max(-0.95, Math.min(0.95, (chosen.factor * rowSeparation) / sphereRadius))
    const elevationDeg =
      Math.round(THREE.MathUtils.radToDeg(Math.asin(clampedRatio)) * 100) / 100

    const azimuthDeg = computePanelAzimuthDeg(indexInTier, totalInTier, arcDegrees)

    return {
      ...item,
      index: idx + 1,
      tier: chosen.name,
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

// Backward-compatible alias filtering strictly the videos
export const VIDEOS_DATA: GalleryItem[] = GALLERY_DATA.filter((item) => item.type === 'video')

/**
 * Randomizes gallery items across the spherical tiers on page load.
 * Uses Fisher-Yates shuffle and reassigns spatial coordinates (tier, azimuthDeg, elevationDeg).
 */
export function randomizeGallery(
  items: GalleryItem[],
  tierCount: 3 | 4 = DEFAULT_GALLERY_CHAMBER_PARAMS.tierCount,
  arcDegrees: number = DEFAULT_GALLERY_CHAMBER_PARAMS.arcDegrees,
  sphereRadius: number = DEFAULT_GALLERY_CHAMBER_PARAMS.sphereRadius,
  rowSeparation: number = DEFAULT_GALLERY_CHAMBER_PARAMS.rowSeparation
): GalleryItem[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }

  return layoutGalleryTiers(shuffled, tierCount, arcDegrees, sphereRadius, rowSeparation)
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
