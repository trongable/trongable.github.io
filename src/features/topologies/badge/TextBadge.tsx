import React from 'react'
import { Text, Billboard } from '@react-three/drei'
import type * as THREE from 'three'

interface TextBadgeProps {
  itemGroupRef: React.RefObject<THREE.Group | null>
  textGroupRef: React.RefObject<THREE.Group | null>
  bgMeshRef: React.RefObject<THREE.Mesh | null>
  bgMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textRef: React.RefObject<any>
  boxWidth: number
  primaryColorHex: string
  displayLabel: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSync: (troika: any) => void
  onClick: (e: { stopPropagation: () => void }) => void
  onPointerOver: (e: { stopPropagation: () => void }) => void
  onPointerOut: (e: { stopPropagation: () => void }) => void
}

/**
 * Standard rectangular cyber text navigation badge with billboarded label.
 */
export const TextBadge: React.FC<TextBadgeProps> = ({
  itemGroupRef,
  textGroupRef,
  bgMeshRef,
  bgMaterialRef,
  textRef,
  boxWidth,
  primaryColorHex,
  displayLabel,
  onSync,
  onClick,
  onPointerOver,
  onPointerOut,
}) => (
  <group key="text-badge-mode" ref={itemGroupRef}>
    <Billboard follow={true}>
      <group ref={textGroupRef} rotation={[0, 0, 0]}>
        <mesh
          ref={bgMeshRef}
          position={[0, 0, -0.005]}
          onClick={onClick}
          onPointerDown={onPointerOver}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
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
          onSync={onSync}
        >
          {displayLabel}
        </Text>
      </group>
    </Billboard>
  </group>
)
