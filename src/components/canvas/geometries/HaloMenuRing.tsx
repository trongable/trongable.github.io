import React, { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { scrambleGlyphs, SCRAMBLE_GLYPHS } from '@/utils/glyphUtils'

export { scrambleGlyphs, SCRAMBLE_GLYPHS }

export interface HaloItem {
  label: string
  path: string
  isExternal?: boolean
}

export const HALO_ITEMS: HaloItem[] = [
  { label: 'about', path: '/about' },
  { label: 'more', path: '/more' },
  { label: 'dchc', path: 'https://dc-hardcore.com', isExternal: true },
]

export const SHOW_DEBUG_RING_DEFAULT = false
export const CONSTANT_ANGULAR_VELOCITY = 0.0825

export const HaloMenuRing: React.FC<{
  isExpanded: boolean
  onSelect: (path: string) => void
  debugRing?: boolean
  isGlitching?: boolean
  theme?: ThemeColor
  speed?: number
  radiusScale?: number
}> = ({ isExpanded, onSelect, debugRing, isGlitching, theme, speed, radiusScale = 1 }) => {
  const groupRef = useRef<THREE.Group>(null)
  const ringMeshRef = useRef<THREE.Mesh>(null)
  const ringGeomRef = useRef<THREE.TorusGeometry>(null)
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const { viewport } = useThree()

  const [showDebugRing, setShowDebugRing] = useState<boolean>(() => {
    if (typeof debugRing === 'boolean') return debugRing
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.has('debug')) return true
    }
    return SHOW_DEBUG_RING_DEFAULT
  })

  useEffect(() => {
    if (typeof debugRing === 'boolean') {
      setShowDebugRing(debugRing)
    }
  }, [debugRing])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'd' || e.key === 'D') {
        setShowDebugRing((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      ringGeomRef.current?.dispose()
      ringMatRef.current?.dispose()
    }
  }, [])

  const ringRadius = Math.min(viewport.width * 0.36, viewport.height * 0.34, 2.2) * radiusScale
  const ringCenterY = 0

  const currentAngle = useRef(0)
  const currentScale = useRef(0)
  const currentOpacity = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const targetScale = isExpanded ? 1 : 0.05
    const targetOpacity = isExpanded ? 1 : 0
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, Math.min(delta * 4.5, 1))
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, Math.min(delta * 4.5, 1))

    groupRef.current.scale.setScalar(currentScale.current)
    groupRef.current.visible = currentScale.current > 0.06

    const velocity = typeof speed === 'number' ? speed : CONSTANT_ANGULAR_VELOCITY
    const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.015) : 0
    currentAngle.current += (velocity * delta + glitchJitter)

    groupRef.current.rotation.set(0, 0, 0)

    if (ringMeshRef.current && showDebugRing) {
      ringMeshRef.current.visible = true
      if (ringMatRef.current) {
        ringMatRef.current.opacity = currentOpacity.current * 0.35
      }
    } else if (ringMeshRef.current) {
      ringMeshRef.current.visible = false
    }

    // Position orbiting badges along the planar circular ring
    HALO_ITEMS.forEach((_, index) => {
      const group = itemGroupRefs.current[index]
      if (group) {
        const itemAngle = (index / HALO_ITEMS.length) * Math.PI * 2 + currentAngle.current
        const x = Math.cos(itemAngle) * ringRadius
        const z = Math.sin(itemAngle) * ringRadius
        group.position.set(x, 0, z)
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, ringCenterY, 0]}>
      {/* Structural orbital guide ring */}
      <mesh ref={ringMeshRef} rotation={[Math.PI / 2, 0, 0]} visible={showDebugRing}>
        <torusGeometry ref={ringGeomRef} args={[ringRadius, 0.015, 16, 160]} />
        <meshBasicMaterial ref={ringMatRef} color="#a1a1aa" transparent opacity={0} />
      </mesh>

      {/* Orbiting text badges using unified MenuItemBadge */}
      {HALO_ITEMS.map((item, index) => {
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
              onHover={(hover) => {
                setHoveredIdx(hover ? index : null)
                document.body.style.cursor = hover ? 'pointer' : 'auto'
              }}
            />
          </group>
        )
      })}
    </group>
  )
}
