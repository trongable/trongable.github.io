import type React from 'react'
import type * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import type { SonnyContainerStyle } from '@/context/SonnyContainerContext'
import type { DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'

export const INITIAL_WIDTHS: Record<string, number> = {
  about: 0.48,
  more: 0.44,
  dchc: 0.41,
}

export const SONNY_FRAMES: string[] = [
  '/images/sonny.png',
  '/images/sonny/frame-01.png',
  '/images/sonny/frame-02.png',
  '/images/sonny/frame-03.png',
  '/images/sonny/frame-04.png',
  '/images/sonny/frame-05.png',
  '/images/sonny/frame-06.png',
  '/images/sonny/frame-07.png',
  '/images/sonny/frame-08.png',
  '/images/sonny/frame-09.png',
  '/images/sonny/frame-10.png',
  '/images/sonny/frame-11.png',
  '/images/sonny/frame-12.png',
  '/images/sonny/frame-13.png',
  '/images/sonny/frame-14.png',
]

export interface MenuItemBadgeProps {
  label: string
  path: string
  imageUrl?: string
  imageFrames?: string[]
  containerStyle?: SonnyContainerStyle
  position?: [number, number, number] | THREE.Vector3
  scale?: number
  opacity?: number | React.MutableRefObject<number>
  normalizedDepth?: number // 0 (furthest back) to 1 (closest front)
  isHovered: boolean
  isExpanded: boolean
  isGlitching?: boolean
  theme?: ThemeColor
  showDistance?: boolean
  distanceMetric?: DistanceMetric
  showCoordinates?: boolean
  coordFrame?: CoordFrame
  vertexTag?: string
  onSelect: (path: string) => void
  onHover: (hover: boolean) => void
}
