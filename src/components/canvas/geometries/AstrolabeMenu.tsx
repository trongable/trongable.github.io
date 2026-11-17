import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { AstrolabeParams } from './geometryConfig'

export interface AstrolabeMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  theme?: ThemeColor
  params: AstrolabeParams
}

export interface AstrolabeItem {
  label: string
  path: string
  baseRadius: number
  speedMult: number
  tilt: [number, number, number]
}

export const ASTROLABE_ITEMS: AstrolabeItem[] = [
  { label: 'about', path: '/about', baseRadius: 2.1, speedMult: 0.85, tilt: [35, 10, 20] },
  { label: 'more', path: '/more', baseRadius: 1.55, speedMult: -1.15, tilt: [-40, 45, -15] },
  { label: 'dchc', path: 'https://dc-hardcore.com', baseRadius: 1.05, speedMult: 1.45, tilt: [65, -30, 40] },
]

export const AstrolabeMenu: React.FC<AstrolabeMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  theme,
  params,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null)
  const gimbalRefs = useRef<(THREE.Group | null)[]>([])
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const ringMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const orbitAngles = useRef<number[]>([0, 0, 0])
  const currentTilts = useRef<THREE.Euler[]>(
    ASTROLABE_ITEMS.map((item) => new THREE.Euler(
      (item.tilt[0] * Math.PI) / 180,
      (item.tilt[1] * Math.PI) / 180,
      (item.tilt[2] * Math.PI) / 180
    ))
  )

  const responsiveBase = Math.min(viewport.width * 0.42, viewport.height * 0.38, 2.0)
  const primaryColorHex = theme?.primary ?? '#e2f872'

  // Procedural Ring Geometries
  const torusGeometries = useMemo(() => {
    return ASTROLABE_ITEMS.map((item) => {
      const r = (item.baseRadius / 2.1) * responsiveBase * params.ringSpread
      return new THREE.TorusGeometry(r, 0.012, 16, 120)
    })
  }, [responsiveBase, params.ringSpread])

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      torusGeometries.forEach((geom) => geom.dispose())
      ringMatRefs.current.forEach((mat) => mat?.dispose())
    }
  }, [torusGeometries])

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return

    const targetScale = isExpanded ? 1 : 0.05
    const targetOpacity = isExpanded ? 1 : 0
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, Math.min(delta * 4.5, 1))
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, Math.min(delta * 4.5, 1))

    rootGroupRef.current.scale.setScalar(currentScale.current)
    rootGroupRef.current.visible = currentScale.current > 0.06

    // Update each gimbal ring
    ASTROLABE_ITEMS.forEach((item, index) => {
      const gimbal = gimbalRefs.current[index]
      if (!gimbal) return

      // Orbital progress along its own ring
      const speed = params.speed * item.speedMult
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.03) : 0

      // When hovered, slow orbit and magnetically align rings toward front-facing plane
      const isAnyHovered = hoveredIdx !== null
      const lerpFactor = Math.min(delta * 3.5, 1)

      if (isAnyHovered) {
        orbitAngles.current[index] += speed * delta * 0.15
        // Magnetic lock: align toward camera plane (tilt -> 0)
        currentTilts.current[index].x = THREE.MathUtils.lerp(currentTilts.current[index].x, 0, lerpFactor)
        currentTilts.current[index].y = THREE.MathUtils.lerp(currentTilts.current[index].y, 0, lerpFactor)
        currentTilts.current[index].z = THREE.MathUtils.lerp(currentTilts.current[index].z, 0, lerpFactor)
      } else {
        orbitAngles.current[index] += speed * delta + glitchJitter
        const targetTiltX = (item.tilt[0] * (params.tiltAngle / 45) * Math.PI) / 180
        const targetTiltY = (item.tilt[1] * (params.tiltAngle / 45) * Math.PI) / 180
        const targetTiltZ = (item.tilt[2] * (params.tiltAngle / 45) * Math.PI) / 180

        currentTilts.current[index].x = THREE.MathUtils.lerp(currentTilts.current[index].x, targetTiltX, lerpFactor)
        currentTilts.current[index].y = THREE.MathUtils.lerp(currentTilts.current[index].y, targetTiltY, lerpFactor)
        currentTilts.current[index].z = THREE.MathUtils.lerp(currentTilts.current[index].z, targetTiltZ, lerpFactor)
      }

      gimbal.rotation.copy(currentTilts.current[index])

      const ringMat = ringMatRefs.current[index]
      if (ringMat) {
        ringMat.opacity = currentOpacity.current * (hoveredIdx === index ? 0.6 : 0.22)
      }

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
        return (
          <group
            key={item.label}
            ref={(el) => {
              gimbalRefs.current[index] = el
            }}
          >
            {/* Gimbal Ring Wireframe */}
            {params.showRings && (
              <mesh geometry={torusGeometries[index]} visible={isExpanded}>
                <meshBasicMaterial
                  ref={(el) => {
                    ringMatRefs.current[index] = el
                  }}
                  color={primaryColorHex}
                  transparent={true}
                  opacity={0.22}
                />
              </mesh>
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
