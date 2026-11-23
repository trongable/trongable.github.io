import React, { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { ProceduralGuide } from './ProceduralGuide'
import { SlingshotParams } from './geometryConfig'

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
  { label: 'videos', path: '/videos', orbitTilt: [10, 25, -20], phaseOffset: (Math.PI * 2) / 5 },
  { label: 'more', path: '/more', orbitTilt: [-30, 40, -10], phaseOffset: (Math.PI * 4) / 5 },
  { label: 'sonny', path: '/sonny', imageUrl: '/images/sonny.png', orbitTilt: [-15, -50, 35], phaseOffset: (Math.PI * 6) / 5 },
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

export interface KeplerCoord {
  x: number
  y: number
  r: number
}

export function computeKeplerPosition(
  theta: number,
  a: number,
  e: number,
  target?: KeplerCoord
): KeplerCoord {
  // Kepler polar equation: r = a(1 - e^2) / (1 + e*cos(theta))
  const p = a * (1 - e * e)
  const r = p / (1 + e * Math.cos(theta))
  const x = r * Math.cos(theta)
  const y = r * Math.sin(theta)

  if (target) {
    target.x = x
    target.y = y
    target.r = r
    return target
  }
  return { x, y, r }
}

export class KeplerCurve extends THREE.Curve<THREE.Vector3> {
  a: number
  e: number
  constructor(a: number, e: number) {
    super()
    this.a = a
    this.e = e
  }
  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const theta = t * Math.PI * 2
    const p = this.a * (1 - this.e * this.e)
    const r = p / (1 + this.e * Math.cos(theta))
    return optionalTarget.set(r * Math.cos(theta), r * Math.sin(theta), 0)
  }
}

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
  const semiMajorAxis = (params.axis * 0.75) * responsiveBase
  const e = THREE.MathUtils.clamp(params.eccentricity, 0.1, 0.88)

  const primaryColorHex = theme?.primary ?? '#e2f872'
  const highlightColorHex = theme?.highlight ?? '#ffffff'

  // Pre-allocated coordinate targets for zero-allocation useFrame updates
  const coordCache = useRef<KeplerCoord[]>(ITEMS.map(() => ({ x: 0, y: 0, r: 0 })))

  // Pre-generate Elliptical Kepler Curve for procedural guide
  const keplerCurve = useMemo(() => new KeplerCurve(semiMajorAxis, e), [semiMajorAxis, e])

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return

    const targetScale = isExpanded ? 1 : 0.05
    const targetOpacity = isExpanded ? 1 : 0
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, Math.min(delta * 4.5, 1))
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, Math.min(delta * 4.5, 1))

    rootGroupRef.current.scale.setScalar(currentScale.current)
    rootGroupRef.current.visible = currentScale.current > 0.06

    // Sleep guard: bypass calculations when collapsed and fully shrunk
    if (!isExpanded && currentScale.current <= 0.051) {
      if (rootGroupRef.current.visible) rootGroupRef.current.visible = false
      return
    }

    // Advance orbital angle using Kepler velocity: dTheta/dt ~ 1 / r^2
    ITEMS.forEach((_, idx) => {
      const isThisHovered = hoveredIdx === idx
      const speedMult = isThisHovered ? 0.2 : 1.0

      const currentTheta = meanAnomalies.current[idx]
      const cached = coordCache.current[idx]
      computeKeplerPosition(currentTheta, semiMajorAxis, e, cached)

      // Inverse square acceleration factor normalized
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
      {ITEMS.map((item, index) => {
        return (
          <group key={item.label} rotation={STATIC_TILT_EULERS[index]}>
            {/* Eccentric Orbital Path Procedural Guide */}
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

            {/* Cometary Slingshot Badge */}
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
