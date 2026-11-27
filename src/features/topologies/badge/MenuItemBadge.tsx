import React from 'react'
import { useAngelContainer, AngelContainerStyle } from '@/features/angel/AngelContainerContext'
import { useDebugDistance, DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'
import { ANGEL_FRAMES, MenuItemBadgeProps } from '@/features/topologies/badge/badgeConstants'
import { useBadgeAnimation } from '@/features/topologies/badge/useBadgeAnimation'
import { ProbeSphereBadge } from '@/features/topologies/badge/ProbeSphereBadge'
import { ImageBadge } from '@/features/topologies/badge/ImageBadge'
import { TextBadge } from '@/features/topologies/badge/TextBadge'

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

  if (effectiveShowDistance) {
    return (
      <ProbeSphereBadge
        itemGroupRef={itemGroupRef}
        textGroupRef={textGroupRef}
        sphereMeshRef={sphereMeshRef}
        sphereMaterialRef={sphereMaterialRef}
        sphereWireMaterialRef={sphereWireMaterialRef}
        distTextRef={distTextRef}
        primaryColorHex={primaryColorHex}
        highlightColorHex={highlightColorHex}
        effectiveMetric={effectiveMetric}
        effectiveShowCoords={effectiveShowCoords}
        vertexTag={vertexTag}
        onClick={handleBadgeClick}
        onPointerOver={handleBadgePointerOver}
        onPointerOut={handleBadgePointerOut}
      />
    )
  }

  if (isImageBadge) {
    return (
      <ImageBadge
        itemGroupRef={itemGroupRef}
        textGroupRef={textGroupRef}
        bgMeshRef={bgMeshRef}
        bgMaterialRef={bgMaterialRef}
        floorMeshRef={floorMeshRef}
        floorMaterialRef={floorMaterialRef}
        accentMaterialRef={accentMaterialRef}
        glassMaterialRef={glassMaterialRef}
        imgMaterialRef={imgMaterialRef}
        effectiveContainer={effectiveContainer}
        primaryColorHex={primaryColorHex}
        highlightColorHex={highlightColorHex}
        initialTexture={imageTextures[0] ?? null}
        onClick={handleBadgeClick}
        onPointerOver={handleBadgePointerOver}
        onPointerOut={handleBadgePointerOut}
      />
    )
  }

  return (
    <TextBadge
      itemGroupRef={itemGroupRef}
      textGroupRef={textGroupRef}
      bgMeshRef={bgMeshRef}
      bgMaterialRef={bgMaterialRef}
      textRef={textRef}
      boxWidth={boxWidth}
      primaryColorHex={primaryColorHex}
      displayLabel={displayLabel}
      onSync={handleSync}
      onClick={handleBadgeClick}
      onPointerOver={handleBadgePointerOver}
      onPointerOut={handleBadgePointerOut}
    />
  )
}
