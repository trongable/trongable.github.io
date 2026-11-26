import React, { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { ProceduralGuide } from './ProceduralGuide'
import { HaloParams, GuideStyle } from './geometryConfig'
import { MENU_ITEMS, MenuItemConfig } from './shared/menuItems'
import { updateExpandCollapse } from './shared/topologyHelpers'
import { scrambleGlyphs, SCRAMBLE_GLYPHS } from '@/utils/glyphUtils'

export { scrambleGlyphs, SCRAMBLE_GLYPHS }

export type HaloItem = MenuItemConfig

export const HALO_ITEMS: HaloItem[] = MENU_ITEMS

export const SHOW_DEBUG_RING_DEFAULT = false
export const CONSTANT_ANGULAR_VELOCITY = 0.0825

export interface HaloMenuRingProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  debugRing?: boolean
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  speed?: number
  radiusScale?: number
  tilt?: number
  yaw?: number
  guideWidth?: number
  guideStyle?: GuideStyle
  params?: HaloParams
}

export const HaloMenuRing: React.FC<HaloMenuRingProps> = ({
  isExpanded,
  onSelect,
  debugRing,
  isGlitching,
  isPaused = false,
  theme,
  speed,
  radiusScale = 1,
  tilt,
  yaw,
  guideWidth,
  guideStyle,
  params,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const activeSpeed = typeof speed === 'number' ? speed : (params?.speed ?? CONSTANT_ANGULAR_VELOCITY)
  const activeRadiusScale = typeof radiusScale === 'number' ? radiusScale : (params?.radius ?? 1)
  const activeDebugRing = typeof debugRing === 'boolean' ? debugRing : (params?.showGuide ?? false)
  const activeTilt = typeof tilt === 'number' ? tilt : (params?.tilt ?? 0)
  const activeYaw = typeof yaw === 'number' ? yaw : (params?.yaw ?? 0)
  const activeGuideWidth = typeof guideWidth === 'number' ? guideWidth : (params?.guideWidth ?? 0.015)
  const activeGuideStyle = guideStyle ?? params?.guideStyle ?? 'solid'

  const [keyboardDebugRing, setKeyboardDebugRing] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.has('debug')) return true
    }
    return SHOW_DEBUG_RING_DEFAULT
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'd' || e.key === 'D') {
        setKeyboardDebugRing((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const ringRadius = Math.min(viewport.width * 0.36, viewport.height * 0.34, 2.2) * activeRadiusScale
  const ringCenterY = 0

  const currentAngle = useRef(0)
  const currentScale = useRef(0)
  const currentOpacity = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (updateExpandCollapse(groupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    if (!isPaused) {
      const velocity = activeSpeed
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.015) : 0
      currentAngle.current += (velocity * delta + glitchJitter)
    }

    // Apply 3D upright tilt and yaw rotation
    const tiltRad = THREE.MathUtils.degToRad(activeTilt)
    const yawRad = THREE.MathUtils.degToRad(activeYaw)
    groupRef.current.rotation.set(tiltRad, yawRad, 0)

    // Position orbiting badges along the circular orbit
    HALO_ITEMS.forEach((_, index) => {
      const group = itemGroupRefs.current[index]
      if (group) {
        const itemAngle = (index / HALO_ITEMS.length) * Math.PI * 2 + currentAngle.current
        const x = Math.cos(itemAngle) * ringRadius
        const z = Math.sin(itemAngle) * ringRadius
        group.position.set(x, 0, z)
      }
    })
  })

  const isRingVisible = activeDebugRing || keyboardDebugRing

  return (
    <group ref={groupRef} position={[0, ringCenterY, 0]}>
      {/* Structural orbital guide ring via ProceduralGuide */}
      <ProceduralGuide
        style={activeGuideStyle}
        radius={ringRadius}
        width={activeGuideWidth}
        color={theme?.primary ?? '#e2f872'}
        highlightColor={theme?.highlight ?? '#f5ff9e'}
        opacity={currentOpacity}
        visible={isRingVisible && isExpanded}
      />

      {/* Orbiting text badges using unified MenuItemBadge */}
      {HALO_ITEMS.map((item, index) => {
        return (
          <group
            key={item.label}
            ref={(el) => {
              itemGroupRefs.current[index] = el
            }}
          >
            <MenuItemBadge
              label={item.label}
              path={item.path}
              imageUrl={item.imageUrl}
              opacity={currentOpacity}
              isHovered={hoveredIdx === index}
              isExpanded={isExpanded}
              isGlitching={isGlitching}
              theme={theme}
              onSelect={onSelect}
              onHover={(hover) => {
                setHoveredIdx(hover ? index : null)
                document.body.style.cursor = hover ? 'pointer' : 'auto'
              }}
            />
          </group>
        )
      })}
    </group>
  )
}
