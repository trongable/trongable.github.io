import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { SlingshotParams } from './geometryConfig'

export interface SlingshotMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  theme?: ThemeColor
  params: SlingshotParams
}

const ITEMS = [
  { label: 'about', path: '/about', orbitTilt: [25, 0, 15], phaseOffset: 0 },
  { label: 'more', path: '/more', orbitTilt: [-30, 40, -10], phaseOffset: (Math.PI * 2) / 3 },
  { label: 'dchc', path: 'https://dc-hardcore.com', orbitTilt: [50, -45, 30], phaseOffset: (Math.PI * 4) / 3 },
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

export const SlingshotMenu: React.FC<SlingshotMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  theme,
  params,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)
  const meanAnomalies = useRef<number[]>([0, (Math.PI * 2) / 3, (Math.PI * 4) / 3])

  const responsiveBase = Math.min(viewport.width * 0.44, viewport.height * 0.40, 2.0)
  const semiMajorAxis = (params.axis * 0.75) * responsiveBase
  const e = THREE.MathUtils.clamp(params.eccentricity, 0.1, 0.88)

  const primaryColorHex = theme?.primary ?? '#e2f872'

  // Pre-allocated coordinate targets for zero-allocation useFrame updates
  const coordCache = useRef<KeplerCoord[]>(ITEMS.map(() => ({ x: 0, y: 0, r: 0 })))

  // Pre-generate Elliptical Wireframe Lines for each orbit
  const orbitLines = useMemo(() => {
    return ITEMS.map(() => {
      const points: THREE.Vector3[] = []
      const segments = 120
      for (let i = 0; i <= segments; i++) {
        const th = (i / segments) * Math.PI * 2
        const pos = computeKeplerPosition(th, semiMajorAxis, e)
        points.push(new THREE.Vector3(pos.x, pos.y, 0))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(primaryColorHex),
        transparent: true,
        opacity: 0.2,
      })
      return new THREE.LineLoop(geom, mat)
    })
  }, [semiMajorAxis, e, primaryColorHex])

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      orbitLines.forEach((line) => {
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      })
    }
  }, [orbitLines])

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return

    const targetScale = isExpanded ? 1 : 0.05
    const targetOpacity = isExpanded ? 1 : 0
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, Math.min(delta * 4.5, 1))
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, Math.min(delta * 4.5, 1))

    rootGroupRef.current.scale.setScalar(currentScale.current)
    rootGroupRef.current.visible = currentScale.current > 0.06

    orbitLines.forEach((line, idx) => {
      line.visible = isExpanded && params.showOrbits
      const mat = line.material as THREE.LineBasicMaterial
      mat.opacity = currentOpacity.current * (hoveredIdx === idx ? 0.5 : 0.2)
      mat.color.set(primaryColorHex)
    })

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

      meanAnomalies.current[idx] += angularSpeed * delta + glitchJitter

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
            {/* Eccentric Orbital Path Wireframe */}
            {params.showOrbits && <primitive object={orbitLines[index]} />}

            {/* Cometary Slingshot Badge */}
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
