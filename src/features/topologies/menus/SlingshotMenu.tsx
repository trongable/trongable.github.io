import React, { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from '@/features/topologies/badge/MenuItemBadge'
import { ProceduralGuide } from '@/features/topologies/ProceduralGuide'
import type { SlingshotParams } from '@/features/topologies/config/geometryConfig'
import { updateExpandCollapse } from '@/features/topologies/math/topologyHelpers'
import {
  KeplerCoord,
  KeplerCurve,
  computeKeplerPosition,
} from '@/features/topologies/math/keplerMath'

export { KeplerCurve, computeKeplerPosition }
export type { KeplerCoord }

export interface SlingshotMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: SlingshotParams
}

const ITEMS = [
  { label: 'about', path: '/about', orbitTilt: [25, 0, 15], phaseOffset: 0 },
  { label: 'gallery', path: '/gallery', orbitTilt: [10, 25, -20], phaseOffset: (Math.PI * 2) / 5 },
  { label: 'more', path: '/more', orbitTilt: [-30, 40, -10], phaseOffset: (Math.PI * 4) / 5 },
  { label: 'angel', path: '/angel', imageUrl: '/images/angel.png', orbitTilt: [-15, -50, 35], phaseOffset: (Math.PI * 6) / 5 },
  { label: 'dchc', path: 'https://dc-hardcore.com', orbitTilt: [50, -45, 30], phaseOffset: (Math.PI * 8) / 5 },
]

const STATIC_TILT_EULERS = ITEMS.map(
  (item) =>
    new THREE.Euler(
      (item.orbitTilt[0] * Math.PI) / 180,
      (item.orbitTilt[1] * Math.PI) / 180,
      (item.orbitTilt[2] * Math.PI) / 180
    )
)

export const SlingshotMenu: React.FC<SlingshotMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  isPaused = false,
  theme,
  params,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const meanAnomalies = useRef<number[]>(ITEMS.map((item) => item.phaseOffset))

  const responsiveBase = Math.min(viewport.width * 0.44, viewport.height * 0.40, 2.0)
  const semiMajorAxis = params.axis * 0.75 * responsiveBase
  const e = THREE.MathUtils.clamp(params.eccentricity, 0.1, 0.88)

  const primaryColorHex = theme?.primary ?? '#e2f872'
  const highlightColorHex = theme?.highlight ?? '#ffffff'

  const coordCache = useRef<KeplerCoord[]>(ITEMS.map(() => ({ x: 0, y: 0, r: 0 })))
  const keplerCurve = useMemo(() => new KeplerCurve(semiMajorAxis, e), [semiMajorAxis, e])

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return
    if (updateExpandCollapse(rootGroupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    // Advance orbital angle using Kepler velocity: dTheta/dt ~ 1 / r^2
    ITEMS.forEach((_, idx) => {
      const isThisHovered = hoveredIdx === idx
      const speedMult = isThisHovered ? 0.2 : 1.0

      const currentTheta = meanAnomalies.current[idx]
      const cached = coordCache.current[idx]
      computeKeplerPosition(currentTheta, semiMajorAxis, e, cached)

      const normalizedR = Math.max(0.3, cached.r / semiMajorAxis)
      const angularSpeed = (0.28 * params.acceleration * speedMult) / (normalizedR * normalizedR)
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.04) : 0

      if (!isPaused) {
        meanAnomalies.current[idx] += angularSpeed * delta + glitchJitter
      }

      computeKeplerPosition(meanAnomalies.current[idx], semiMajorAxis, e, cached)
      const itemGroup = itemGroupRefs.current[idx]
      if (itemGroup) {
        itemGroup.position.set(cached.x, cached.y, 0)
      }
    })
  })

  return (
    <group ref={rootGroupRef} position={[0, 0, 0]}>
      {ITEMS.map((item, index) => (
        <group key={item.label} rotation={STATIC_TILT_EULERS[index]}>
          {params.showOrbits && (
            <ProceduralGuide
              curve={keplerCurve}
              style={params.orbitStyle}
              width={params.orbitWidth}
              color={primaryColorHex}
              highlightColor={highlightColorHex}
              opacity={currentOpacity}
              visible={isExpanded && params.showOrbits}
            />
          )}

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
      ))}
    </group>
  )
}
