import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { scrambleGlyphs } from '@/utils/glyphUtils'

const INITIAL_WIDTHS: Record<string, number> = {
  about: 0.48,
  more: 0.44,
  dchc: 0.41,
}

export interface MenuItemBadgeProps {
  label: string
  path: string
  position?: [number, number, number] | THREE.Vector3
  scale?: number
  opacity?: number | React.MutableRefObject<number>
  normalizedDepth?: number // 0 (furthest back) to 1 (closest front)
  isHovered: boolean
  isExpanded: boolean
  isGlitching?: boolean
  theme?: ThemeColor
  onSelect: (path: string) => void
  onHover: (hover: boolean) => void
}

export const MenuItemBadge: React.FC<MenuItemBadgeProps> = ({
  label,
  path,
  position,
  scale = 1,
  opacity = 1,
  normalizedDepth,
  isHovered,
  isExpanded,
  isGlitching = false,
  theme,
  onSelect,
  onHover,
}) => {
  const itemGroupRef = useRef<THREE.Group>(null)
  const textGroupRef = useRef<THREE.Group>(null)
  const bgMeshRef = useRef<THREE.Mesh>(null)
  const bgMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)
  const [displayLabel, setDisplayLabel] = useState(label)
  const [boxWidth, setBoxWidth] = useState<number>(() => INITIAL_WIDTHS[label] || label.length * 0.08 + 0.14)

  const primaryColorHex = theme?.primary ?? '#e2f872'
  const highlightColorHex = theme?.highlight ?? '#f5ff9e'

  const baseBadgeColor = useMemo(() => new THREE.Color(primaryColorHex), [primaryColorHex])
  const dimBadgeColor = useMemo(
    () => new THREE.Color(primaryColorHex).multiplyScalar(0.40),
    [primaryColorHex]
  )

  const worldPos = useRef(new THREE.Vector3())

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      bgMaterialRef.current?.dispose()
    }
  }, [])

  // Dynamic bounding measurement on font sync
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSync = (troika: any) => {
    if (troika?.geometry?.boundingBox) {
      const { min, max } = troika.geometry.boundingBox
      const measured = max.x - min.x
      if (measured > 0) {
        setBoxWidth(measured + 0.12)
      }
    }
  }

  // Glyph Scrambling (Dimension 6): cyber glyph swaps on hover and during glitch
  useEffect(() => {
    if (!isHovered && !isGlitching) {
      setDisplayLabel(label)
      return
    }

    const intervalTime = isGlitching ? 60 : 90

    const interval = setInterval(() => {
      if (isGlitching) {
        const count = Math.min(label.length, Math.floor(Math.random() * 3) + 1)
        setDisplayLabel(scrambleGlyphs(label, count))
      } else if (isHovered) {
        if (Math.random() < 0.30) {
          setDisplayLabel(label)
        } else {
          const count = label.length > 4 && Math.random() < 0.35 ? 2 : 1
          setDisplayLabel(scrambleGlyphs(label, count))
        }
      }
    }, intervalTime)

    return () => {
      clearInterval(interval)
      setDisplayLabel(label)
    }
  }, [isHovered, isGlitching, label])

  useFrame(() => {
    if (!itemGroupRef.current) return

    // Position and scale
    if (position !== undefined) {
      if (Array.isArray(position)) {
        itemGroupRef.current.position.set(position[0], position[1], position[2])
      } else {
        itemGroupRef.current.position.copy(position)
      }
    }

    itemGroupRef.current.getWorldPosition(worldPos.current)
    const computedDepth = THREE.MathUtils.clamp((worldPos.current.z / 2.2 + 1) * 0.5, 0, 1)
    const currentDepth = typeof normalizedDepth === 'number' ? normalizedDepth : computedDepth

    const depthScale = scale * (0.85 + currentDepth * 0.35)
    itemGroupRef.current.scale.setScalar(depthScale)
    itemGroupRef.current.renderOrder = Math.round(currentDepth * 100)

    // Dynamic shearing and translation distortion (strictly upright, NO angular tilt)
    if (textGroupRef.current) {
      if (isGlitching) {
        textGroupRef.current.position.set(
          THREE.MathUtils.randFloatSpread(0.19),
          THREE.MathUtils.randFloatSpread(0.08),
          0
        )
        textGroupRef.current.rotation.set(0, 0, 0)
        textGroupRef.current.scale.set(
          1 + THREE.MathUtils.randFloatSpread(0.75),
          1 + THREE.MathUtils.randFloatSpread(0.35),
          1
        )
      } else if (isHovered) {
        const shouldTwitch = Math.random() > 0.30
        if (shouldTwitch) {
          textGroupRef.current.position.set(
            THREE.MathUtils.randFloatSpread(0.038),
            THREE.MathUtils.randFloatSpread(0.016),
            0
          )
          textGroupRef.current.scale.set(
            1 + THREE.MathUtils.randFloatSpread(0.24),
            1 + THREE.MathUtils.randFloatSpread(0.10),
            1
          )
        } else {
          textGroupRef.current.position.set(0, 0, 0)
          textGroupRef.current.scale.set(1, 1, 1)
        }
        textGroupRef.current.rotation.set(0, 0, 0)
      } else {
        textGroupRef.current.position.set(0, 0, 0)
        textGroupRef.current.rotation.set(0, 0, 0)
        textGroupRef.current.scale.set(1, 1, 1)
      }
    }

    // 100% Opaque Text Background (No transparency when expanded)
    const resolvedOpacity =
      typeof opacity === 'object' && opacity !== null && 'current' in opacity
        ? (opacity as React.MutableRefObject<number>).current
        : typeof opacity === 'number'
        ? opacity
        : 1
    const alpha = resolvedOpacity

    if (bgMaterialRef.current) {
      bgMaterialRef.current.opacity = alpha
      bgMaterialRef.current.transparent = alpha < 0.99
      bgMaterialRef.current.depthWrite = true
      bgMaterialRef.current.depthTest = true

      if (isGlitching && Math.random() > 0.45) {
        bgMaterialRef.current.color.set(Math.random() > 0.5 ? '#00f0ff' : '#ff0055')
      } else if (isHovered) {
        const flick = Math.random()
        if (flick < 0.10) {
          bgMaterialRef.current.color.set('#00f0ff')
        } else if (flick < 0.16) {
          bgMaterialRef.current.color.set('#ff0055')
        } else if (flick < 0.24) {
          bgMaterialRef.current.color.set('#ffffff')
        } else {
          bgMaterialRef.current.color.set(highlightColorHex)
        }
      } else {
        bgMaterialRef.current.color.lerpColors(dimBadgeColor, baseBadgeColor, currentDepth)
      }
    }

    if (textRef.current) {
      textRef.current.fillOpacity = alpha
      textRef.current.color = '#1c1b22'
      if (textRef.current.material) {
        textRef.current.material.toneMapped = false
      }
    }
  })

  return (
    <group ref={itemGroupRef}>
      <Billboard follow={true}>
        <group ref={textGroupRef} rotation={[0, 0, 0]}>
          {/* Rectangular Toxic Neon Background Badge */}
          <mesh
            ref={bgMeshRef}
            position={[0, 0, -0.005]}
            onClick={(e) => {
              if (!isExpanded) return
              e.stopPropagation()
              onSelect(path)
            }}
            onPointerOver={(e) => {
              if (!isExpanded) return
              e.stopPropagation()
              onHover(true)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              onHover(false)
            }}
          >
            <planeGeometry args={[boxWidth, 0.22]} />
            <meshBasicMaterial
              ref={bgMaterialRef}
              color={primaryColorHex}
              transparent={false}
              opacity={1}
              depthWrite={true}
              depthTest={true}
            />
          </mesh>

          {/* Inverted Dark Space Text Cutout */}
          <Text
            ref={textRef}
            fontSize={0.15}
            letterSpacing={0.04}
            color="#1c1b22"
            strokeWidth={0}
            strokeOpacity={0}
            depthOffset={-1}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Newsreader-Italic.ttf"
            fontStyle="italic"
            onSync={handleSync}
          >
            {displayLabel}
          </Text>
        </group>
      </Billboard>
    </group>
  )
}
