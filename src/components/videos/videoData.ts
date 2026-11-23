import * as THREE from 'three'

export interface VideoItem {
  id: string
  youtubeId: string
  title: string
  author: string
  thumbnailUrl: string
  hqThumbnailUrl: string
  aspectRatio: number
  azimuthDeg: number
  elevationDeg: number
  tier: 'upper' | 'lower'
  index: number
}

export const CEREBRO_RADIUS = 5.2

export const VIDEOS_DATA: VideoItem[] = [
  // Upper Tier (4 videos staggered across [-45°, -15°, +15°, +45°])
  {
    id: 'qopBymi9FYY',
    youtubeId: 'qopBymi9FYY',
    title: 'Attack on Titan: Get Ready For This AMV',
    author: 'Lil Onionette',
    thumbnailUrl: 'https://img.youtube.com/vi/qopBymi9FYY/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/qopBymi9FYY/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: -45,
    elevationDeg: 12,
    tier: 'upper',
    index: 1,
  },
  {
    id: 'q_25b9zlUa0',
    youtubeId: 'q_25b9zlUa0',
    title: 'Trongavitus :: Bells and Whistles - Halo 3 and Reach minitage',
    author: 'trongzor',
    thumbnailUrl: 'https://img.youtube.com/vi/q_25b9zlUa0/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/q_25b9zlUa0/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: -15,
    elevationDeg: 12,
    tier: 'upper',
    index: 2,
  },
  {
    id: '5qR27jBSYaE',
    youtubeId: '5qR27jBSYaE',
    title: 'Aspirations Trailer :: Edited by trongzor media',
    author: 'trongzor',
    thumbnailUrl: 'https://img.youtube.com/vi/5qR27jBSYaE/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/5qR27jBSYaE/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: 15,
    elevationDeg: 12,
    tier: 'upper',
    index: 3,
  },
  {
    id: '7ZCbvoHtwSY',
    youtubeId: '7ZCbvoHtwSY',
    title: 'Trongavitus H3M1 :: Edited by trongzor media',
    author: 'trongzor',
    thumbnailUrl: 'https://img.youtube.com/vi/7ZCbvoHtwSY/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/7ZCbvoHtwSY/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: 45,
    elevationDeg: 12,
    tier: 'upper',
    index: 4,
  },
  // Lower Tier (3 videos nestled in between [-30°, 0°, +30°])
  {
    id: '_ZMbKpKUmsU',
    youtubeId: '_ZMbKpKUmsU',
    title: 'Betatage The Olden Days :: Edited by trongzor media',
    author: 'trongzor',
    thumbnailUrl: 'https://img.youtube.com/vi/_ZMbKpKUmsU/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/_ZMbKpKUmsU/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: -30,
    elevationDeg: -12,
    tier: 'lower',
    index: 5,
  },
  {
    id: 'OPB3AVjlPyg',
    youtubeId: 'OPB3AVjlPyg',
    title: '[Halo 4] Halo 4 Highlights by Trongavitus',
    author: 'Trong Nguyen',
    thumbnailUrl: 'https://img.youtube.com/vi/OPB3AVjlPyg/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/OPB3AVjlPyg/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: 0,
    elevationDeg: -12,
    tier: 'lower',
    index: 6,
  },
  {
    id: 'NXck93vKCpQ',
    youtubeId: 'NXck93vKCpQ',
    title: 'FFA #5 - Round 1, Heat 1 (Trongavitus POV)',
    author: 'DCHaloLANs',
    thumbnailUrl: 'https://img.youtube.com/vi/NXck93vKCpQ/hqdefault.jpg',
    hqThumbnailUrl: 'https://img.youtube.com/vi/NXck93vKCpQ/hqdefault.jpg',
    aspectRatio: 16 / 9,
    azimuthDeg: 30,
    elevationDeg: -12,
    tier: 'lower',
    index: 7,
  },
]

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
  const x = radius * cosPhi * Math.sin(theta)
  const y = radius * Math.sin(phi)
  const z = -radius * cosPhi * Math.cos(theta)

  target.set(x, y, z)
  return target
}
