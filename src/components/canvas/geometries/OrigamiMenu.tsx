import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { OrigamiParams } from './geometryConfig'

export interface OrigamiMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  theme?: ThemeColor
  params: OrigamiParams
}

export interface OrigamiItem {
  label: string
  path: string
  normal: THREE.Vector3
}

// 3 primary facet centers on the upper hemisphere of an icosahedron
export const ORIGAMI_ITEMS: OrigamiItem[] = [
  { label: 'about', path: '/about', normal: new THREE.Vector3(-0.85, 0.45, 0.40).normalize() },
  { label: 'more', path: '/more', normal: new THREE.Vector3(0.85, 0.45, 0.40).normalize() },
  { label: 'dchc', path: 'https://dc-hardcore.com', normal: new THREE.Vector3(0.0, -0.75, 0.65).normalize() },
]

export const OrigamiMenu: React.FC<OrigamiMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  theme,
  params,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null)
  const tumbleGroupRef = useRef<THREE.Group>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const wireMatRef = useRef<THREE.LineBasicMaterial>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const currentUnfold = useRef(0)

  const responsiveBase = Math.min(viewport.width * 0.42, viewport.height * 0.40, 2.2)
  const primaryColorHex = theme?.primary ?? '#e2f872'

  // Central geometric wireframe core
  const coreGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.55 * responsiveBase, 0), [responsiveBase])
  const wireGeometry = useMemo(() => new THREE.WireframeGeometry(coreGeometry), [coreGeometry])

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      wireGeometry.dispose()
      coreGeometry.dispose()
      wireMatRef.current?.dispose()
    }
  }, [coreGeometry, wireGeometry])

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return

    const targetScale = isExpanded ? 1 : 0.05
    const targetOpacity = isExpanded ? 1 : 0
    const targetUnfold = isExpanded ? params.unfold : 0.0

    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, Math.min(delta * 4.5, 1))
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, Math.min(delta * 4.5, 1))
    currentUnfold.current = THREE.MathUtils.lerp(currentUnfold.current, targetUnfold, Math.min(delta * 4.0, 1))

    rootGroupRef.current.scale.setScalar(currentScale.current)
    rootGroupRef.current.visible = currentScale.current > 0.06

    // Slow tumble of the crystal core
    if (tumbleGroupRef.current) {
      const isAnyHovered = hoveredIdx !== null
      const tumbleMult = isAnyHovered ? 0.2 : 1.0
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.02) : 0

      tumbleGroupRef.current.rotation.y += (params.tumbleSpeed * tumbleMult * delta + glitchJitter)
      tumbleGroupRef.current.rotation.x += params.tumbleSpeed * 0.5 * tumbleMult * delta
    }

    if (wireMatRef.current) {
      wireMatRef.current.opacity = currentOpacity.current * (1.1 - currentUnfold.current * 0.6) * 0.4
    }

    // Unfolding facet badge positions in real-time
    const closedRadius = 0.55 * responsiveBase
    const openRadiusBase = responsiveBase * params.facetScale
    ORIGAMI_ITEMS.forEach((item, index) => {
      const openRadius = (1.45 + (index === 2 ? 0.2 : 0)) * openRadiusBase
      const r = THREE.MathUtils.lerp(closedRadius, openRadius, currentUnfold.current)
      const itemGroup = itemGroupRefs.current[index]
      if (itemGroup) {
        itemGroup.position.set(item.normal.x * r, item.normal.y * r, item.normal.z * r)
      }
    })
  })

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      <group ref={tumbleGroupRef}>
        {/* Central Tumbling Crystalline Wireframe */}
        {params.showWires && (
          <lineSegments geometry={wireGeometry} visible={isExpanded}>
            <lineBasicMaterial
              ref={wireMatRef}
              color={primaryColorHex}
              transparent={true}
              opacity={0.4}
            />
          </lineSegments>
        )}

        {/* Unfolding Facet Panels holding Badges */}
        {ORIGAMI_ITEMS.map((item, index) => {
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
    </group>
  )
}
