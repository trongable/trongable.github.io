import React from 'react'
import * as THREE from 'three'
import type { SonnyContainerStyle } from '@/context/SonnyContainerContext'

export interface SonnyContainersProps {
  containerStyle: SonnyContainerStyle
  primaryColorHex: string
  highlightColorHex: string
  bgMeshRef: React.RefObject<THREE.Mesh | null>
  bgMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  floorMeshRef: React.RefObject<THREE.Mesh | null>
  floorMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  accentMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
  glassMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>
}

/**
 * Renders the selected 3D enclosure around the Sonny character sprite
 * (`diorama`, `pedestal`, `capsule`, `wirebox`, `crystal`, or `none`).
 */
export const SonnyContainers: React.FC<SonnyContainersProps> = ({
  containerStyle,
  primaryColorHex,
  highlightColorHex,
  bgMeshRef,
  bgMaterialRef,
  floorMeshRef,
  floorMaterialRef,
  accentMaterialRef,
  glassMaterialRef,
}) => {
  if (containerStyle === 'diorama') {
    return (
      <>
        <mesh ref={bgMeshRef} position={[0, 0, -0.005]}>
          <planeGeometry args={[0.39, 0.69]} />
          <meshBasicMaterial
            ref={bgMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
        <mesh
          ref={floorMeshRef}
          position={[0, -0.345, 0.19]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.39, 0.39]} />
          <meshBasicMaterial
            ref={floorMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
      </>
    )
  }

  if (containerStyle === 'pedestal') {
    return (
      <>
        <mesh ref={floorMeshRef} position={[0, -0.345, 0]}>
          <cylinderGeometry args={[0.22, 0.24, 0.024, 32]} />
          <meshBasicMaterial
            ref={floorMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, -0.335, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.23, 0.012, 16, 32]} />
          <meshBasicMaterial
            ref={accentMaterialRef}
            color={highlightColorHex}
            transparent={true}
            opacity={1}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </>
    )
  }

  if (containerStyle === 'capsule') {
    return (
      <>
        <mesh ref={floorMeshRef} position={[0, -0.355, 0]}>
          <cylinderGeometry args={[0.23, 0.25, 0.024, 32]} />
          <meshBasicMaterial
            ref={floorMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
        <mesh ref={bgMeshRef} position={[0, 0.355, 0]}>
          <cylinderGeometry args={[0.25, 0.23, 0.024, 32]} />
          <meshBasicMaterial
            ref={bgMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.70, 24, 1, true]} />
          <meshBasicMaterial
            ref={glassMaterialRef}
            color={primaryColorHex}
            transparent={true}
            opacity={0.18}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, -0.345, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.01, 16, 32]} />
          <meshBasicMaterial
            ref={accentMaterialRef}
            color={highlightColorHex}
            transparent={true}
            opacity={1}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0.345, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.01, 16, 32]} />
          <meshBasicMaterial
            color={highlightColorHex}
            transparent={true}
            opacity={0.8}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </>
    )
  }

  if (containerStyle === 'wirebox') {
    return (
      <>
        <mesh ref={floorMeshRef} position={[0, -0.355, 0]}>
          <boxGeometry args={[0.44, 0.02, 0.44]} />
          <meshBasicMaterial
            ref={floorMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.435, 0.715, 0.435]} />
          <meshBasicMaterial
            ref={glassMaterialRef}
            color={primaryColorHex}
            transparent={true}
            opacity={0.12}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.44, 0.72, 0.44]} />
          <meshBasicMaterial
            ref={accentMaterialRef}
            color={highlightColorHex}
            wireframe={true}
            transparent={true}
            opacity={1}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </>
    )
  }

  if (containerStyle === 'crystal') {
    return (
      <>
        <mesh
          ref={floorMeshRef}
          position={[0, -0.345, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.20, 6]} />
          <meshBasicMaterial
            ref={floorMaterialRef}
            color={primaryColorHex}
            transparent={false}
            opacity={1}
            depthWrite={true}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.38, 0]} />
          <meshBasicMaterial
            ref={glassMaterialRef}
            color={primaryColorHex}
            transparent={true}
            opacity={0.15}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[0.382, 0]} />
          <meshBasicMaterial
            ref={accentMaterialRef}
            color={highlightColorHex}
            wireframe={true}
            transparent={true}
            opacity={1}
            depthWrite={false}
            depthTest={true}
          />
        </mesh>
      </>
    )
  }

  return null
}
