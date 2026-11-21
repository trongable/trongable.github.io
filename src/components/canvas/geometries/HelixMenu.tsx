import React, { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { ProceduralGuide } from './ProceduralGuide'
import { HelixParams } from './geometryConfig'

export interface HelixMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  theme?: ThemeColor
  params: HelixParams
}

const ITEMS = [
  { label: 'about', path: '/about' },
  { label: 'more', path: '/more' },
  { label: 'sonny', path: '/sonny', imageUrl: '/images/sonny.png' },
  { label: 'dchc', path: 'https://dc-hardcore.com' },
]

export function computeToroidalHelixPoint(
  theta: number,
  R: number,
  r: number,
  n: number,
  target?: THREE.Vector3
): THREE.Vector3 {
  const cosN = Math.cos(n * theta)
  const sinN = Math.sin(n * theta)
  const rad = R + r * cosN

  const x = rad * Math.cos(theta)
  const y = r * sinN
  const z = rad * Math.sin(theta)

  if (target) {
    return target.set(x, y, z)
  }
  return new THREE.Vector3(x, y, z)
}

export const HelixMenu: React.FC<HelixMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
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

  // Pre-allocated vector cache for zero-allocation useFrame updates
  const itemPositions = useRef<THREE.Vector3[]>(ITEMS.map(() => new THREE.Vector3()))

  // 3D Parametric Curve along the Toroidal Helix for ProceduralGuide
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

    const targetScale = isExpanded ? 1 : 0.05
    const targetOpacity = isExpanded ? 1 : 0
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, Math.min(delta * 4.5, 1))
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, Math.min(delta * 4.5, 1))

    groupRef.current.scale.setScalar(currentScale.current)
    groupRef.current.visible = currentScale.current > 0.06

    // Sleep guard: bypass calculations when collapsed and fully shrunk
    if (!isExpanded && currentScale.current <= 0.051) {
      if (groupRef.current.visible) groupRef.current.visible = false
      return
    }

    // Advance transit angle along the corkscrew
    const isAnyHovered = hoveredIdx !== null
    const speed = isAnyHovered ? params.speed * 0.25 : params.speed
    const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.02) : 0

    currentTheta.current += speed * delta + glitchJitter

    // Update badge positions continuously along the toroidal helix (in-place)
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
      {/* Glowing Corkscrew Accelerator Coil via ProceduralGuide */}
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

      {/* Badges spiraling along the toroidal helix */}
      {ITEMS.map((item, index) => {
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
              onHover={(hover) => setHoveredIdx(hover ? index : null)}
            />
          </group>
        )
      })}
    </group>
  )
}
