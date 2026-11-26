import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { MenuItemBadge } from './MenuItemBadge'
import { TesseractParams } from './geometryConfig'
import { updateExpandCollapse } from './shared/topologyHelpers'

export interface TesseractMenuProps {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
  params: TesseractParams
}

export const TESSERACT_ITEMS = [
  { label: 'about', path: '/about', vertexIdx: 13 },
  { label: 'gallery', path: '/gallery', vertexIdx: 15 },
  { label: 'more', path: '/more', vertexIdx: 7 },
  { label: 'sonny', path: '/sonny', imageUrl: '/images/sonny.png', vertexIdx: 10 },
  { label: 'dchc', path: 'https://dc-hardcore.com', vertexIdx: 0 },
]

const ITEMS = TESSERACT_ITEMS

// 16 vertices of a 4D Hypercube (+-1, +-1, +-1, +-1)
export const TESSERACT_4D_VERTICES: number[][] = []
for (let i = 0; i < 16; i++) {
  TESSERACT_4D_VERTICES.push([
    (i & 1) ? 1 : -1,
    (i & 2) ? 1 : -1,
    (i & 4) ? 1 : -1,
    (i & 8) ? 1 : -1,
  ])
}

// 32 edges connecting vertices that differ in exactly 1 bit
export const TESSERACT_EDGES: [number, number][] = []
for (let i = 0; i < 16; i++) {
  for (let bit = 0; bit < 4; bit++) {
    const j = i ^ (1 << bit)
    if (i < j) {
      TESSERACT_EDGES.push([i, j])
    }
  }
}

export function project4D(
  v: number[],
  angleXW: number,
  angleYZ: number,
  dist: number,
  size: number,
  target = new THREE.Vector3()
): THREE.Vector3 {
  const [x, y, z, w] = v

  // Rotate in X-W plane
  const cosXW = Math.cos(angleXW)
  const sinXW = Math.sin(angleXW)
  const x1 = x * cosXW - w * sinXW
  const w1 = x * sinXW + w * cosXW

  // Rotate in Y-Z plane
  const cosYZ = Math.cos(angleYZ)
  const sinYZ = Math.sin(angleYZ)
  const y1 = y * cosYZ - z * sinYZ
  const z1 = y * sinYZ + z * cosYZ

  // Perspective 4D to 3D projection
  const denom = Math.max(0.2, dist - w1)
  const factor = (size * 1.5) / denom

  return target.set(x1 * factor, y1 * factor, z1 * factor)
}

export const TesseractMenu: React.FC<TesseractMenuProps> = ({
  isExpanded,
  onSelect,
  isGlitching = false,
  isPaused = false,
  theme,
  params,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const lineMatRef = useRef<THREE.LineBasicMaterial | THREE.LineDashedMaterial>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const pointsGeomRef = useRef<THREE.BufferGeometry>(null)
  const pointsMatRef = useRef<THREE.PointsMaterial>(null)
  const itemGroupRefs = useRef<(THREE.Group | null)[]>([])
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const angleXW = useRef(0)
  const angleYZ = useRef(0)
  const currentScale = useRef(0)
  const currentOpacity = useRef(0)

  // Positions array for the 32 edges (32 * 2 = 64 vertices * 3 coords = 192 floats)
  const linePositions = useMemo(() => new Float32Array(TESSERACT_EDGES.length * 6), [])
  const lineGeomRef = useRef<THREE.BufferGeometry>(null)

  // Positions array for the 16 vertices (16 * 3 = 48 floats) for points mode
  const pointsPositions = useMemo(() => new Float32Array(16 * 3), [])

  const primaryColorHex = theme?.primary ?? '#e2f872'

  // Computed 3D vertex positions for current frame (pre-allocated)
  const projectedVertices = useRef<THREE.Vector3[]>(
    TESSERACT_4D_VERTICES.map(() => new THREE.Vector3())
  )

  // WebGL GPU memory cleanup on unmount
  useEffect(() => {
    return () => {
      lineGeomRef.current?.dispose()
      lineMatRef.current?.dispose()
      pointsGeomRef.current?.dispose()
      pointsMatRef.current?.dispose()
    }
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (updateExpandCollapse(groupRef.current, currentScale, currentOpacity, isExpanded, delta)) {
      return
    }

    // Advance 4D rotation angles
    if (!isPaused) {
      const speed = hoveredIdx !== null ? params.speed4D * 0.25 : params.speed4D
      const glitchJitter = isGlitching ? THREE.MathUtils.randFloatSpread(0.04) : 0
      angleXW.current += (speed * delta + glitchJitter)
      angleYZ.current += (speed * 0.7 * delta + glitchJitter * 0.5)
    }

    // Project all 16 vertices to 3D in-place with zero allocations
    for (let i = 0; i < 16; i++) {
      project4D(
        TESSERACT_4D_VERTICES[i],
        angleXW.current,
        angleYZ.current,
        params.distance,
        params.cubeSize,
        projectedVertices.current[i]
      )
    }

    // Update 3D wireframe / points coordinates
    if (params.showWires) {
      if (params.wireStyle === 'points') {
        if (pointsGeomRef.current) {
          let ptr = 0
          for (let i = 0; i < 16; i++) {
            const p = projectedVertices.current[i]
            pointsPositions[ptr++] = p.x
            pointsPositions[ptr++] = p.y
            pointsPositions[ptr++] = p.z
          }
          pointsGeomRef.current.attributes.position.needsUpdate = true
        }
        if (pointsMatRef.current) {
          pointsMatRef.current.opacity = currentOpacity.current * 0.85
          pointsMatRef.current.color.set(primaryColorHex)
        }
      } else {
        if (lineGeomRef.current) {
          let ptr = 0
          for (let e = 0; e < TESSERACT_EDGES.length; e++) {
            const [v1, v2] = TESSERACT_EDGES[e]
            const p1 = projectedVertices.current[v1]
            const p2 = projectedVertices.current[v2]

            linePositions[ptr++] = p1.x
            linePositions[ptr++] = p1.y
            linePositions[ptr++] = p1.z
            linePositions[ptr++] = p2.x
            linePositions[ptr++] = p2.y
            linePositions[ptr++] = p2.z
          }

          lineGeomRef.current.attributes.position.needsUpdate = true
          if (params.wireStyle === 'dashed' && linesRef.current) {
            linesRef.current.computeLineDistances()
          }
        }

        if (lineMatRef.current) {
          lineMatRef.current.opacity = currentOpacity.current * (params.wireStyle === 'dashed' ? 0.45 : 0.35)
          lineMatRef.current.color.set(primaryColorHex)
        }
      }
    }

    // Update badge positions to match projected 4D vertices
    ITEMS.forEach((item, index) => {
      const p = projectedVertices.current[item.vertexIdx]
      const itemGroup = itemGroupRefs.current[index]
      if (itemGroup && p) {
        itemGroup.position.copy(p)
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 32 Projected 4D-to-3D Hypercube Edges / Points */}
      {params.showWires && (
        params.wireStyle === 'points' ? (
          <points ref={pointsRef}>
            <bufferGeometry ref={pointsGeomRef}>
              <bufferAttribute
                attach="attributes-position"
                args={[pointsPositions, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              ref={pointsMatRef}
              color={primaryColorHex}
              size={0.06}
              sizeAttenuation={true}
              transparent={true}
              opacity={0}
            />
          </points>
        ) : (
          <lineSegments ref={linesRef}>
            <bufferGeometry ref={lineGeomRef}>
              <bufferAttribute
                attach="attributes-position"
                args={[linePositions, 3]}
              />
            </bufferGeometry>
            {params.wireStyle === 'dashed' ? (
              <lineDashedMaterial
                ref={lineMatRef as any}
                color={primaryColorHex}
                dashSize={0.08}
                gapSize={0.05}
                transparent={true}
                opacity={0}
              />
            ) : (
              <lineBasicMaterial
                ref={lineMatRef}
                color={primaryColorHex}
                transparent={true}
                opacity={0}
              />
            )}
          </lineSegments>
        )
      )}

      {/* Badges anchored to 4D projection vertices */}
      {ITEMS.map((item, index) => {
        const v4 = TESSERACT_4D_VERTICES[item.vertexIdx]
        const cellTag = v4 && v4[3] > 0 ? 'outer' : 'inner'
        const vertexTag = `V${item.vertexIdx} ${cellTag}`

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
              vertexTag={vertexTag}
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
