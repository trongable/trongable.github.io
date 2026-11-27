import React, { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from '@/features/topologies/badge/MenuItemBadge'
import { ProceduralGuide } from '@/features/topologies/ProceduralGuide'
import type { HelixParams } from '@/features/topologies/config/geometryConfig'
import { MENU_ITEMS } from '@/features/topologies/config/menuItems'
import { updateExpandCollapse } from '@/features/topologies/math/topologyHelpers'
import { computeToroidalHelixPoint } from '@/features/topologies/math/helixMath'

export { computeToroidalHelixPoint }

export interface HelixMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: HelixParams
}

const ITEMS = MENU_ITEMS

export const HelixMenu: React.FC<HelixMenuProps> = ({
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

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const currentTheta = useRef(0)

  const responsiveBase = Math.min(viewport.width * 0.42, viewport.height * 0.40, 2.0)
  const R = params.radius * 0.85 * responsiveBase
  const r = R * 0.32
  const n = Math.round(params.coils)

  const primaryColorHex = theme?.primary ?? '#e2f872'

  const itemPositions = useRef<THREE.Vector3[]>(ITEMS.map(() => new THREE.Vector3()))

  const helixCurve = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 240
    for (let i = 0; i <= segments; i++) {
      const th = (i / segments) * Math.PI * 2
      points.push(computeToroidalHelixPoint(th, R, r, n))
    }
    return new THREE.CatmullRomCurve3(points, true)
  }, [R, r, n])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (updateExpandCollapse(groupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    const isAnyHovered = hoveredIdx !== null
    const speed = isAnyHovered ? params.speed * 0.25 : params.speed
    const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.02) : 0

    if (!isPaused) {
      currentTheta.current += speed * delta + glitchJitter
    }

    ITEMS.forEach((_, index) => {
      const offset = (index / ITEMS.length) * Math.PI * 2
      const theta = currentTheta.current + offset
      computeToroidalHelixPoint(theta, R, r, n, itemPositions.current[index])
      const itemGroup = itemGroupRefs.current[index]
      if (itemGroup) {
        itemGroup.position.copy(itemPositions.current[index])
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {params.showCoil && (
        <ProceduralGuide
          style={params.coilStyle ?? 'solid'}
          curve={helixCurve}
          width={params.coilWidth ?? 0.012}
          color={primaryColorHex}
          highlightColor={theme?.highlight ?? '#f5ff9e'}
          opacity={currentOpacity}
          visible={isExpanded}
        />
      )}

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
