import React from 'react'
import { Billboard } from '@react-three/drei'
import type * as THREE from 'three'
import type { AngelContainerStyle } from '@/features/angel/AngelContainerContext'
import { AngelContainers } from '@/features/angel/AngelContainers'

interface ImageBadgeProps {
  itemGroupRef: React.RefObject<THREE.Group | null>
  textGroupRef: React.RefObject<THREE.Group | null>
  bgMeshRef: React.RefObject<THREE.Mesh | null>
  bgMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  floorMeshRef: React.RefObject<THREE.Mesh | null>
  floorMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  accentMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  glassMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  imgMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  effectiveContainer: AngelContainerStyle
  primaryColorHex: string
  highlightColorHex: string
  initialTexture: THREE.Texture | null
  onClick: (e: { stopPropagation: () => void }) => void
  onPointerOver: (e: { stopPropagation: () => void }) => void
  onPointerOut: (e: { stopPropagation: () => void }) => void
}

/**
 * Renders an image/flipbook navigation badge inside its selected 3D Angel container.
 */
export const ImageBadge: React.FC<ImageBadgeProps> = ({
  itemGroupRef,
  textGroupRef,
  bgMeshRef,
  bgMaterialRef,
  floorMeshRef,
  floorMaterialRef,
  accentMaterialRef,
  glassMaterialRef,
  imgMaterialRef,
  effectiveContainer,
  primaryColorHex,
  highlightColorHex,
  initialTexture,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const spriteZ = effectiveContainer === 'diorama' ? 0.19 : 0.0

  return (
    <group key="image-badge-mode" ref={itemGroupRef}>
      <Billboard follow={true}>
        <group
          ref={textGroupRef}
          rotation={[0.22, 0, 0]}
          onClick={onClick}
          onPointerDown={onPointerOver}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
        >
          <AngelContainers
            containerStyle={effectiveContainer}
            primaryColorHex={primaryColorHex}
            highlightColorHex={highlightColorHex}
            bgMeshRef={bgMeshRef}
            bgMaterialRef={bgMaterialRef}
            floorMeshRef={floorMeshRef}
            floorMaterialRef={floorMaterialRef}
            accentMaterialRef={accentMaterialRef}
            glassMaterialRef={glassMaterialRef}
          />

          <mesh position={[0, 0, spriteZ]}>
            <planeGeometry args={[0.39, 0.69]} />
            <meshBasicMaterial
              ref={imgMaterialRef}
              map={initialTexture}
              transparent={true}
              alphaTest={0.02}
              depthWrite={false}
              depthTest={true}
            />
          </mesh>
        </group>
      </Billboard>
    </group>
  )
}
