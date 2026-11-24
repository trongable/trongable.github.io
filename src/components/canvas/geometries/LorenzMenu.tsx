import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { LorenzParams } from './geometryConfig'

export interface LorenzMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: LorenzParams
}

const ITEMS = [
  { label: 'about', path: '/about', initial: [0.1, 0.0, 0.0] },
  { label: 'gallery', path: '/gallery', initial: [0.05, 0.05, 0.0] },
  { label: 'more', path: '/more', initial: [-0.1, 0.0, 0.0] },
  { label: 'sonny', path: '/sonny', imageUrl: '/images/sonny.png', initial: [0.0, -0.1, 0.0] },
  { label: 'dchc', path: 'https://dc-hardcore.com', initial: [0.0, 0.1, 0.0] },
]

const SIGMA = 10
const BETA = 8 / 3
const TRAIL_LENGTH = 70

export function stepLorenz(
  pos: THREE.Vector3,
  dt: number,
  rho: number,
  target?: THREE.Vector3
): THREE.Vector3 {
  const dx = SIGMA * (pos.y - pos.x)
  const dy = pos.x * (rho - pos.z) - pos.y
  const dz = pos.x * pos.y - BETA * pos.z

  const x = pos.x + dx * dt
  const y = pos.y + dy * dt
  const z = pos.z + dz * dt

  if (target) {
    return target.set(x, y, z)
  }
  return new THREE.Vector3(x, y, z)
}

export const LorenzMenu: React.FC<LorenzMenuProps> = ({
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

  const currentScale = useRef(0)
  const currentOpacity = useRef(0)

  // Live state vectors for the 3 orbiting items
  const stateVectors = useRef<THREE.Vector3[]>(
    ITEMS.map((item) => new THREE.Vector3(item.initial[0], item.initial[1], item.initial[2] + 20))
  )

  // Trails buffer for each item: TRAIL_LENGTH * 3 coordinates
  const trails = useRef<Float32Array[]>(
    ITEMS.map(() => new Float32Array(TRAIL_LENGTH * 3))
  )

  const primaryColorHex = theme?.primary ?? '#e2f872'

  const trailObjects = useMemo(() => {
    return ITEMS.map((_, idx) => {
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.BufferAttribute(trails.current[idx], 3))
      if (params.trailStyle === 'points') {
        const mat = new THREE.PointsMaterial({
          color: new THREE.Color(primaryColorHex),
          size: 0.055,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.7,
        })
        return new THREE.Points(geom, mat)
      } else if (params.trailStyle === 'dashed') {
        const mat = new THREE.LineDashedMaterial({
          color: new THREE.Color(primaryColorHex),
          dashSize: 0.09,
          gapSize: 0.06,
          transparent: true,
          opacity: 0.5,
        })
        return new THREE.Line(geom, mat)
      } else {
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(primaryColorHex),
          transparent: true,
          opacity: 0.4,
        })
        return new THREE.Line(geom, mat)
      }
    })
  }, [primaryColorHex, params.trailStyle])

  // WebGL GPU memory cleanup for lines & materials
  useEffect(() => {
    return () => {
      trailObjects.forEach((obj) => {
        obj.geometry.dispose()
        ;(obj.material as THREE.Material).dispose()
      })
    }
  }, [trailObjects])

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

    const dt = (hoveredIdx !== null ? params.speed * 0.25 : params.speed)
    const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.01) : 0

    if (!isPaused) {
      ITEMS.forEach((_, idx) => {
        // Step attractor differential equations forward in-place
        const currentPos = stateVectors.current[idx]
        stepLorenz(currentPos, dt + glitchJitter, params.rho, currentPos)

        const scaledX = currentPos.x * params.scale
        const scaledY = currentPos.y * params.scale
        const scaledZ = (currentPos.z - 25) * params.scale

        // Update badge 3D position directly in real time
        const itemGroup = itemGroupRefs.current[idx]
        if (itemGroup) {
          itemGroup.position.set(scaledX, scaledY, scaledZ)
        }

        // Shift trail points
        const trail = trails.current[idx]
        trail.copyWithin(3, 0, (TRAIL_LENGTH - 1) * 3)
        trail[0] = scaledX
        trail[1] = scaledY
        trail[2] = scaledZ
      })
    }

    trailObjects.forEach((obj) => {
      obj.visible = isExpanded && params.showParticles
      const mat = obj.material as THREE.Material & { opacity: number; color: THREE.Color }
      mat.opacity = currentOpacity.current * (params.trailStyle === 'points' ? 0.7 : 0.45)
      mat.color.set(primaryColorHex)
      obj.geometry.attributes.position.needsUpdate = true
      if (params.trailStyle === 'dashed' && obj instanceof THREE.Line) {
        obj.computeLineDistances()
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {ITEMS.map((item, index) => {
        return (
          <React.Fragment key={item.label}>
            {/* Luminous Particle Trail Ribbon / Points */}
            {params.showParticles && <primitive object={trailObjects[index]} />}

            {/* Orbiting Badge riding the chaotic lobe */}
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
          </React.Fragment>
        )
      })}
    </group>
  )
}
