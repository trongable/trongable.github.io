import React from 'react'
import { Text, Billboard } from '@react-three/drei'
import { useAngelContainer, AngelContainerStyle } from '@/context/AngelContainerContext'
import { useDebugDistance, DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'
import { ANGEL_FRAMES, MenuItemBadgeProps } from './badge/badgeConstants'
import { AngelContainers } from './badge/AngelContainers'
import { useBadgeAnimation } from './badge/useBadgeAnimation'

export { ANGEL_FRAMES }
export type { MenuItemBadgeProps }

export const MenuItemBadge: React.FC<MenuItemBadgeProps> = ({
  label,
  path,
  imageUrl,
  imageFrames,
  containerStyle,
  position,
  scale = 1,
  opacity = 1,
  normalizedDepth,
  isHovered,
  isExpanded,
  isGlitching = false,
  theme,
  showDistance,
  distanceMetric,
  showCoordinates,
  coordFrame,
  vertexTag,
  onSelect,
  onHover,
}) => {
  const { containerStyle: globalContainerStyle } = useAngelContainer()
  const effectiveContainer: AngelContainerStyle = containerStyle ?? globalContainerStyle ?? 'capsule'
  const {
    showDistance: globalShowDistance,
    distanceMetric: globalMetric,
    showCoordinates: globalShowCoords,
    coordFrame: globalCoordFrame,
  } = useDebugDistance()

  const effectiveShowDistance = showDistance ?? globalShowDistance ?? false
  const effectiveMetric: DistanceMetric = distanceMetric ?? globalMetric ?? 'euclid'
  const effectiveShowCoords = showCoordinates ?? globalShowCoords ?? true
  const effectiveCoordFrame: CoordFrame = coordFrame ?? globalCoordFrame ?? 'view'

  const primaryColorHex = theme?.primary ?? '#e2f872'
  const highlightColorHex = theme?.highlight ?? '#f5ff9e'

  const {
    itemGroupRef,
    textGroupRef,
    bgMeshRef,
    bgMaterialRef,
    floorMeshRef,
    floorMaterialRef,
    accentMaterialRef,
    glassMaterialRef,
    imgMaterialRef,
    sphereMeshRef,
    sphereMaterialRef,
    sphereWireMaterialRef,
    textRef,
    distTextRef,
    displayLabel,
    boxWidth,
    isImageBadge,
    imageTextures,
    handleSync,
  } = useBadgeAnimation({
    label,
    imageUrl,
    imageFrames,
    position,
    scale,
    opacity,
    normalizedDepth,
    isHovered,
    isGlitching,
    primaryColorHex,
    highlightColorHex,
    effectiveShowDistance,
    effectiveMetric,
    effectiveShowCoords,
    effectiveCoordFrame,
    vertexTag,
  })

  const handleBadgeClick = (e: { stopPropagation: () => void }) => {
    if (!isExpanded) return
    e.stopPropagation()
    onSelect(path)
  }

  const handleBadgePointerOver = (e: { stopPropagation: () => void }) => {
    if (!isExpanded) return
    e.stopPropagation()
    onHover(true)
  }

  const handleBadgePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    onHover(false)
  }

  // Telemetry Probe Mode: replaces all link badges with interactive translucent 3D spheres
  if (effectiveShowDistance) {
    return (
      <group key="probe-sphere-mode" ref={itemGroupRef}>
        <Billboard follow={true}>
          <group
            ref={textGroupRef}
            onClick={handleBadgeClick}
            onPointerDown={handleBadgePointerOver}
            onPointerOver={handleBadgePointerOver}
            onPointerOut={handleBadgePointerOut}
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
                {effectiveShowCoords
                  ? `${vertexTag ? `[${vertexTag}] ` : ''}${effectiveMetric === 'depth' ? 'depth:' : 'd:'} 5.00\nx: 0.00  y: 0.00  z: 0.00`
                  : `${vertexTag ? `[${vertexTag}] ` : ''}${effectiveMetric === 'depth' ? 'depth:' : 'd:'} 5.00`}
              </Text>
            </group>
          </group>
        </Billboard>
      </group>
    )
  }

  if (isImageBadge) {
    const spriteZ = effectiveContainer === 'diorama' ? 0.19 : 0.0

    return (
      <group key="image-badge-mode" ref={itemGroupRef}>
        <Billboard follow={true}>
          <group
            ref={textGroupRef}
            rotation={[0.22, 0, 0]}
            onClick={handleBadgeClick}
            onPointerDown={handleBadgePointerOver}
            onPointerOver={handleBadgePointerOver}
            onPointerOut={handleBadgePointerOut}
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
                map={imageTextures[0] ?? null}
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

  return (
    <group key="text-badge-mode" ref={itemGroupRef}>
      <Billboard follow={true}>
        <group ref={textGroupRef} rotation={[0, 0, 0]}>
          <mesh
            ref={bgMeshRef}
            position={[0, 0, -0.005]}
            onClick={handleBadgeClick}
            onPointerDown={handleBadgePointerOver}
            onPointerOver={handleBadgePointerOver}
            onPointerOut={handleBadgePointerOut}
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
            onSync={handleSync}
          >
            {displayLabel}
          </Text>
        </group>
      </Billboard>
    </group>
  )
}
