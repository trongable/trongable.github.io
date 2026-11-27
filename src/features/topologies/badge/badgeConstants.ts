import type React from 'react'
import type * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import type { AngelContainerStyle } from '@/features/angel/AngelContainerContext'
import type { DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'

export const INITIAL_WIDTHS: Record<string, number> = {
  about: 0.48,
  more: 0.44,
  dchc: 0.41,
}

export const ANGEL_FRAMES: string[] = [
  '/images/angel.png',
  '/images/angel/frame-01.png',
  '/images/angel/frame-02.png',
  '/images/angel/frame-03.png',
  '/images/angel/frame-04.png',
  '/images/angel/frame-05.png',
  '/images/angel/frame-06.png',
  '/images/angel/frame-07.png',
  '/images/angel/frame-08.png',
  '/images/angel/frame-09.png',
  '/images/angel/frame-10.png',
  '/images/angel/frame-11.png',
  '/images/angel/frame-12.png',
  '/images/angel/frame-13.png',
  '/images/angel/frame-14.png',
]

export interface MenuItemBadgeProps {
  label: string
  path: string
  imageUrl?: string
  imageFrames?: string[]
  containerStyle?: AngelContainerStyle
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
