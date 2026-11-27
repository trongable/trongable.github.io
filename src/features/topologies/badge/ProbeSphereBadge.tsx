import React from 'react'
import { Text, Billboard } from '@react-three/drei'
import type * as THREE from 'three'
import type { DistanceMetric } from '@/context/DebugDistanceContext'

interface ProbeSphereBadgeProps {
  itemGroupRef: React.RefObject<THREE.Group | null>
  textGroupRef: React.RefObject<THREE.Group | null>
  sphereMeshRef: React.RefObject<THREE.Mesh | null>
  sphereMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  sphereWireMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  distTextRef: React.RefObject<any>
  primaryColorHex: string
  highlightColorHex: string
  effectiveMetric: DistanceMetric
  effectiveShowCoords: boolean
  vertexTag?: string
  onClick: (e: { stopPropagation: () => void }) => void
  onPointerOver: (e: { stopPropagation: () => void }) => void
  onPointerOut: (e: { stopPropagation: () => void }) => void
}

/**
 * Telemetry probe sphere badge displaying live Euclidean/depth distance and XYZ coordinates.
 */
export const ProbeSphereBadge: React.FC<ProbeSphereBadgeProps> = ({
  itemGroupRef,
  textGroupRef,
  sphereMeshRef,
  sphereMaterialRef,
  sphereWireMaterialRef,
  distTextRef,
  primaryColorHex,
  highlightColorHex,
  effectiveMetric,
  effectiveShowCoords,
  vertexTag,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const metricPrefix = effectiveMetric === 'depth' ? 'depth:' : 'd:'
  const tagPrefix = vertexTag ? `[${vertexTag}] ` : ''
  const initialLabel = effectiveShowCoords
    ? `${tagPrefix}${metricPrefix} 5.00\nx: 0.00  y: 0.00  z: 0.00`
    : `${tagPrefix}${metricPrefix} 5.00`

  return (
    <group key="probe-sphere-mode" ref={itemGroupRef}>
      <Billboard follow={true}>
        <group
          ref={textGroupRef}
          onClick={onClick}
          onPointerDown={onPointerOver}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <mesh ref={sphereMeshRef} data-testid="translucent-sphere">
            <sphereGeometry args={[0.15, 24, 24]} />
            <meshBasicMaterial
              ref={sphereMaterialRef}
              color={primaryColorHex}
              transparent={true}
              opacity={0.35}
              depthWrite={false}
              depthTest={true}
            />
          </mesh>

          <mesh data-testid="translucent-sphere-wire">
            <sphereGeometry args={[0.152, 12, 12]} />
            <meshBasicMaterial
              ref={sphereWireMaterialRef}
              color={highlightColorHex}
              wireframe={true}
              transparent={true}
              opacity={0.25}
              depthWrite={false}
              depthTest={true}
            />
          </mesh>

          <group
            position={[0, effectiveShowCoords ? 0.30 : 0.26, 0]}
            data-testid="distance-badge"
          >
            <mesh position={[0, 0, -0.002]}>
              <planeGeometry
                args={[
                  effectiveShowCoords ? (vertexTag ? 0.66 : 0.54) : vertexTag ? 0.44 : 0.30,
                  effectiveShowCoords ? 0.13 : 0.08,
                ]}
              />
              <meshBasicMaterial
                color="#1c1b22"
                transparent={true}
                opacity={0.88}
                depthTest={true}
              />
            </mesh>
            <Text
              ref={distTextRef}
              fontSize={effectiveShowCoords ? (vertexTag ? 0.043 : 0.048) : 0.065}
              lineHeight={1.22}
              textAlign="center"
              color={highlightColorHex}
              anchorX="center"
              anchorY="middle"
              font="/fonts/JetBrainsMono-Regular.ttf"
            >
              {initialLabel}
            </Text>
          </group>
        </group>
      </Billboard>
    </group>
  )
}
