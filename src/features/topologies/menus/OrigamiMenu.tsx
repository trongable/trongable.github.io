import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from '@/features/topologies/badge/MenuItemBadge'
import type { OrigamiParams } from '@/features/topologies/config/geometryConfig'
import { updateExpandCollapse } from '@/features/topologies/math/topologyHelpers'

export interface OrigamiMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: OrigamiParams
}

export interface OrigamiItem {
  label: string
  path: string
  imageUrl?: string
  normal: THREE.Vector3
}

// Facet centers on the hemisphere of an icosahedron
export const ORIGAMI_ITEMS: OrigamiItem[] = [
  { label: 'about', path: '/about', normal: new THREE.Vector3(-0.85, 0.45, 0.40).normalize() },
  { label: 'gallery', path: '/gallery', normal: new THREE.Vector3(0.0, 0.85, 0.50).normalize() },
  { label: 'more', path: '/more', normal: new THREE.Vector3(0.85, 0.45, 0.40).normalize() },
  { label: 'angel', path: '/angel', imageUrl: '/images/angel.png', normal: new THREE.Vector3(-0.45, -0.65, 0.60).normalize() },
  { label: 'dchc', path: 'https://dc-hardcore.com', normal: new THREE.Vector3(0.0, -0.75, 0.65).normalize() },
]

export const OrigamiMenu: React.FC<OrigamiMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  isPaused = false,
  theme,
  params,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null)
  const tumbleGroupRef = useRef<THREE.Group>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const wireMatRef = useRef<THREE.LineBasicMaterial>(null)
  const solidMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const pointsMatRef = useRef<THREE.PointsMaterial>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const currentUnfold = useRef(0)

  const responsiveBase = Math.min(viewport.width * 0.42, viewport.height * 0.40, 2.2)
  const primaryColorHex = theme?.primary ?? '#e2f872'

  const coreGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.55 * responsiveBase, 0), [responsiveBase])
  const wireGeometry = useMemo(() => new THREE.WireframeGeometry(coreGeometry), [coreGeometry])

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      wireGeometry.dispose()
      coreGeometry.dispose()
      wireMatRef.current?.dispose()
      solidMatRef.current?.dispose()
      pointsMatRef.current?.dispose()
    }
  }, [coreGeometry, wireGeometry])

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return
    if (updateExpandCollapse(rootGroupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    const targetUnfold = isExpanded ? params.unfold : 0.0
    currentUnfold.current = THREE.MathUtils.lerp(currentUnfold.current, targetUnfold, Math.min(delta * 4.0, 1))

    if (!isPaused && tumbleGroupRef.current) {
      const isAnyHovered = hoveredIdx !== null
      const tumbleMult = isAnyHovered ? 0.2 : 1.0
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.02) : 0

      tumbleGroupRef.current.rotation.y += params.tumbleSpeed * tumbleMult * delta + glitchJitter
      tumbleGroupRef.current.rotation.x += params.tumbleSpeed * 0.5 * tumbleMult * delta
    }

    const wireOpacity = currentOpacity.current * (1.1 - currentUnfold.current * 0.6)
    if (wireMatRef.current) {
      wireMatRef.current.opacity = wireOpacity * 0.4
      wireMatRef.current.color.set(primaryColorHex)
    }
    if (solidMatRef.current) {
      solidMatRef.current.opacity = wireOpacity * 0.25
      solidMatRef.current.color.set(primaryColorHex)
    }
    if (pointsMatRef.current) {
      pointsMatRef.current.opacity = wireOpacity * 0.85
      pointsMatRef.current.color.set(primaryColorHex)
    }

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
        {params.showWires && (
          <>
            {params.wireStyle === 'solid' && (
              <mesh geometry={coreGeometry} visible={isExpanded}>
                <meshBasicMaterial
                  ref={solidMatRef}
                  color={primaryColorHex}
                  transparent={true}
                  opacity={0.25}
                />
              </mesh>
            )}
            {params.wireStyle === 'points' && (
              <points geometry={coreGeometry} visible={isExpanded}>
                <pointsMaterial
                  ref={pointsMatRef}
                  color={primaryColorHex}
                  size={0.06}
                  sizeAttenuation={true}
                  transparent={true}
                  opacity={0.8}
                />
              </points>
            )}
            {(params.wireStyle === 'wireframe' || params.wireStyle === 'glow' || (!['solid', 'points'].includes(params.wireStyle))) && (
              <lineSegments geometry={wireGeometry} visible={isExpanded}>
                <lineBasicMaterial
                  ref={wireMatRef}
                  color={primaryColorHex}
                  transparent={true}
                  opacity={0.4}
                />
              </lineSegments>
            )}
            {params.wireStyle === 'glow' && (
              <mesh geometry={coreGeometry} visible={isExpanded}>
                <meshBasicMaterial
                  ref={solidMatRef}
                  color={primaryColorHex}
                  transparent={true}
                  opacity={0.18}
                />
              </mesh>
            )}
          </>
        )}

        {ORIGAMI_ITEMS.map((item, index) => (
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
    </group>
  )
}
