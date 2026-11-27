import React, { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from '@/features/topologies/badge/MenuItemBadge'
import { ProceduralGuide } from '@/features/topologies/ProceduralGuide'
import type { TrefoilParams } from '@/features/topologies/config/geometryConfig'
import { MENU_ITEMS } from '@/features/topologies/config/menuItems'
import { updateExpandCollapse } from '@/features/topologies/math/topologyHelpers'
import { getTrefoilPoint } from '@/features/topologies/math/trefoilMath'

export { getTrefoilPoint }

export interface GeometryProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: TrefoilParams
}

const ITEMS = MENU_ITEMS

export const TrefoilMenu: React.FC<GeometryProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  isPaused = false,
  theme,
  params,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentT = useRef(0)
  const currentScale = useRef(0)
  const currentOpacity = useRef(0)

  // Pre-allocated vector cache for zero-allocation useFrame updates
  const itemPositions = useRef<THREE.Vector3[]>(ITEMS.map(() => new THREE.Vector3()))

  // Responsive scale base
  const responsiveScale = Math.min(viewport.width * 0.45, viewport.height * 0.42, 2.0) * params.scale

  // Procedural 3D Knot Curve for the track
  const curvePoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 160
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2
      points.push(getTrefoilPoint(t, responsiveScale))
    }
    return new THREE.CatmullRomCurve3(points, true)
  }, [responsiveScale])

  const primaryColorHex = theme?.primary ?? '#e2f872'

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (updateExpandCollapse(groupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    // Advance motion along the knot loop in real time
    if (!isPaused) {
      const speed = hoveredIdx !== null ? params.speed * 0.25 : params.speed
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.02) : 0
      currentT.current += speed * delta + glitchJitter
    }

    // Update each item's 3D position directly in-place every frame
    ITEMS.forEach((_, index) => {
      const itemGroup = itemGroupRefs.current[index]
      if (!itemGroup) return
      const offset = (index / ITEMS.length) * Math.PI * 2
      const t = currentT.current + offset
      getTrefoilPoint(t, responsiveScale, itemPositions.current[index])
      itemGroup.position.copy(itemPositions.current[index])
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 3D Luminous Guide Track via ProceduralGuide */}
      {params.showTrack && (
        <ProceduralGuide
          style={params.trackStyle ?? 'wireframe'}
          curve={curvePoints}
          width={params.tubeRadius}
          color={primaryColorHex}
          highlightColor={theme?.highlight ?? '#f5ff9e'}
          opacity={currentOpacity}
          visible={isExpanded}
        />
      )}

      {/* Orbiting Badges */}
      {ITEMS.map((item, index) => (
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
            onHover={(hover) => setHoveredIdx(hover ? index : null)}
          />
        </group>
      ))}
    </group>
  )
}
