import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { ProceduralGuide } from './ProceduralGuide'
import { AstrolabeParams } from './geometryConfig'
import { updateExpandCollapse } from './shared/topologyHelpers'

export interface AstrolabeMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: AstrolabeParams
}

export interface AstrolabeItem {
  label: string
  path: string
  imageUrl?: string
  baseRadius: number
  speedMult: number
  tilt: [number, number, number]
}

export const ASTROLABE_ITEMS: AstrolabeItem[] = [
  { label: 'about', path: '/about', baseRadius: 2.1, speedMult: 0.85, tilt: [35, 10, 20] },
  { label: 'gallery', path: '/gallery', baseRadius: 1.85, speedMult: 1.05, tilt: [20, -25, 15] },
  { label: 'more', path: '/more', baseRadius: 1.65, speedMult: -1.15, tilt: [-40, 45, -15] },
  { label: 'sonny', path: '/sonny', imageUrl: '/images/sonny.png', baseRadius: 1.30, speedMult: -1.35, tilt: [15, -60, -25] },
  { label: 'dchc', path: 'https://dc-hardcore.com', baseRadius: 0.95, speedMult: 1.65, tilt: [65, -30, 40] },
]

export const AstrolabeMenu: React.FC<AstrolabeMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  isPaused = false,
  theme,
  params,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null)
  const gimbalRefs = useRef<(THREE.Group | null)[]>([])
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const orbitAngles = useRef<number[]>(ASTROLABE_ITEMS.map(() => 0))
  const currentTilts = useRef<THREE.Euler[]>(
    ASTROLABE_ITEMS.map((item) => new THREE.Euler(
      (item.tilt[0] * Math.PI) / 180,
      (item.tilt[1] * Math.PI) / 180,
      (item.tilt[2] * Math.PI) / 180
    ))
  )

  const responsiveBase = Math.min(viewport.width * 0.42, viewport.height * 0.38, 2.0)
  const primaryColorHex = theme?.primary ?? '#e2f872'

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return
    if (updateExpandCollapse(rootGroupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    const baseSpeed = hoveredIdx !== null ? params.speed * 0.25 : params.speed
    const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.02) : 0

    // Magnetic lock alignment when hovered
    const isLocked = hoveredIdx !== null

    ASTROLABE_ITEMS.forEach((item, index) => {
      const gimbal = gimbalRefs.current[index]
      if (!gimbal) return

      // Advance individual orbital angular velocities
      if (!isPaused) {
        orbitAngles.current[index] += (baseSpeed * item.speedMult * delta + glitchJitter)
      }

      // Target Euler rotation for this gimbal
      let targetX = (item.tilt[0] * Math.PI) / 180 * (params.tiltAngle / 45)
      let targetY = (item.tilt[1] * Math.PI) / 180 * (params.tiltAngle / 45)
      let targetZ = (item.tilt[2] * Math.PI) / 180 * (params.tiltAngle / 45)

      if (isLocked) {
        // Coplanar magnetic lock: align all 3 rings toward a shared plane
        targetX = THREE.MathUtils.degToRad(20)
        targetY = 0
        targetZ = 0
      }

      currentTilts.current[index].x = THREE.MathUtils.lerp(currentTilts.current[index].x, targetX, 0.08)
      currentTilts.current[index].y = THREE.MathUtils.lerp(currentTilts.current[index].y, targetY, 0.08)
      currentTilts.current[index].z = THREE.MathUtils.lerp(currentTilts.current[index].z, targetZ, 0.08)

      gimbal.rotation.copy(currentTilts.current[index])

      // Real-time update of badge position along this gimbal
      const radius = (item.baseRadius / 2.1) * responsiveBase * params.ringSpread
      const angle = orbitAngles.current[index]
      const itemGroup = itemGroupRefs.current[index]
      if (itemGroup) {
        itemGroup.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
      }
    })
  })

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      {ASTROLABE_ITEMS.map((item, index) => {
        const radius = (item.baseRadius / 2.1) * responsiveBase * params.ringSpread
        return (
          <group
            key={item.label}
            ref={(el) => {
              gimbalRefs.current[index] = el
            }}
          >
            {/* Gimbal Ring Wireframe via ProceduralGuide */}
            {params.showRings && (
              <ProceduralGuide
                style={params.ringStyle ?? 'solid'}
                radius={radius}
                width={params.ringWidth ?? 0.012}
                color={primaryColorHex}
                highlightColor={theme?.highlight ?? '#f5ff9e'}
                opacity={currentOpacity}
                visible={isExpanded}
                rotation={[0, 0, 0]}
              />
            )}

            {/* Orbiting Badge on this Gimbal */}
            <group
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
                onHover={(hover) => setHoveredIdx(hover ? index : null)}
              />
            </group>
          </group>
        )
      })}
    </group>
  )
}
