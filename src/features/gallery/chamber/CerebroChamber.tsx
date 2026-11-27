import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { CerebroSphereWall } from '@/features/gallery/chamber/CerebroSphereWall'
import { CurvedMediaPanel } from '@/features/gallery/chamber/CurvedMediaPanel'
import {
  ChamberCameraController,
  PanelDirectionEntry,
} from '@/features/gallery/chamber/ChamberCameraController'
import { useChamberInput } from '@/features/gallery/chamber/useChamberInput'
import {
  CHAMBER_FOV_DEG,
  GalleryItem,
  GALLERY_DATA,
  computePanelSphericalAngles,
  computeSphericalPosition,
} from '@/features/gallery/data/galleryData'
import {
  GalleryChamberParams,
  DEFAULT_GALLERY_CHAMBER_PARAMS,
} from '@/features/gallery/data/galleryTunerConfig'
import { useTheme } from '@/context/ThemeContext'

export interface CerebroChamberProps {
  activeVideo?: GalleryItem | null
  selectedVideo?: GalleryItem | null
  activeItem?: GalleryItem | null
  selectedItem?: GalleryItem | null
  items?: GalleryItem[]
  params?: GalleryChamberParams
  onSelectVideo?: (item: GalleryItem) => void
  onSelectItem?: (item: GalleryItem) => void
}

export const CerebroChamber: React.FC<CerebroChamberProps> = ({
  activeVideo,
  selectedVideo,
  activeItem,
  selectedItem,
  items = GALLERY_DATA,
  params = DEFAULT_GALLERY_CHAMBER_PARAMS,
  onSelectVideo,
  onSelectItem,
}) => {
  const { currentTheme } = useTheme()
  const effectiveActive = activeItem ?? activeVideo ?? null
  const effectiveSelected = selectedItem ?? selectedVideo ?? null
  const currentSelected = effectiveSelected ?? effectiveActive
  const isDimmed = Boolean(currentSelected)

  const handleSelect = onSelectItem ?? onSelectVideo ?? (() => {})
  const containerRef = useRef<HTMLDivElement>(null)

  const [centeredId, setCenteredId] = useState<string | null>(() => items[0]?.id ?? null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const activeFocusId = hoveredId ?? (params.centerZoom ? centeredId : null)

  const clearHover = useCallback(() => setHoveredId(null), [])
  const handleHoverChange = useCallback((id: string, hovered: boolean) => {
    setHoveredId((prev) => (hovered ? id : prev === id ? null : prev))
  }, [])

  const {
    isDraggingRef,
    dragDeltaRef,
    releaseVelocityRef,
    wheelDeltaRef,
    activeKeysRef,
    handlePointerDown,
  } = useChamberInput({
    containerRef,
    isDimmed,
    params,
    onClearHover: clearHover,
  })

  const panelDirections = useMemo<PanelDirectionEntry[]>(
    () =>
      items.map((item) => {
        const { azimuthDeg, elevationDeg } = computePanelSphericalAngles(
          item,
          params.tierCount,
          params.arcDegrees,
          params.sphereRadius,
          params.rowSeparation
        )
        return {
          id: item.id,
          dir: computeSphericalPosition(1, azimuthDeg, elevationDeg),
        }
      }),
    [items, params.arcDegrees, params.tierCount, params.rowSeparation, params.sphereRadius]
  )

  const selectedTarget = useMemo(() => {
    if (!currentSelected) return null
    const { azimuthDeg, elevationDeg } = computePanelSphericalAngles(
      currentSelected,
      params.tierCount,
      params.arcDegrees,
      params.sphereRadius,
      params.rowSeparation
    )
    return { id: currentSelected.id, azimuthDeg, elevationDeg }
  }, [currentSelected, params.arcDegrees, params.tierCount, params.rowSeparation, params.sphereRadius])

  // Page visibility 0% GPU sleep management
  const [isTabVisible, setIsTabVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState !== 'hidden')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (isDimmed) {
      setHoveredId(null)
    }
  }, [isDimmed])

  return (
    <div
      ref={containerRef}
      data-testid="cerebro-chamber-container"
      className="relative w-full h-full min-h-dvh flex items-center justify-center overflow-hidden overscroll-none touch-none select-none bg-[#0c0b10]"
      onPointerDown={handlePointerDown}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: CHAMBER_FOV_DEG }}
        dpr={[1, 2]}
        frameloop={isTabVisible ? 'always' : 'never'}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <color attach="background" args={['#0c0b10']} />

        <ChamberCameraController
          isDimmed={isDimmed}
          isDraggingRef={isDraggingRef}
          dragDeltaRef={dragDeltaRef}
          releaseVelocityRef={releaseVelocityRef}
          wheelDeltaRef={wheelDeltaRef}
          activeKeysRef={activeKeysRef}
          panelDirections={panelDirections}
          selectedTarget={selectedTarget}
          onCenteredItemChange={setCenteredId}
          params={params}
        />

        <ambientLight intensity={isDimmed ? 0.05 : 0.4} color={currentTheme.primary} />
        <pointLight
          position={[0, 0, 0]}
          intensity={isDimmed ? 0.2 : 1.2}
          color={currentTheme.highlight}
          distance={8}
        />

        <CerebroSphereWall
          radius={params.sphereRadius + 0.3}
          isDimmed={isDimmed}
          dimIntensity={params.dimIntensity}
          particleCount={params.particleCount}
        />

        {items.map((item) => (
          <CurvedMediaPanel
            key={item.id}
            video={item}
            isDimmed={isDimmed}
            isSelected={currentSelected?.id === item.id}
            isFocused={!isDimmed && activeFocusId === item.id}
            onHoverChange={handleHoverChange}
            introCollapse={params.introCollapse}
            scatterOnSelect={params.scatterOnSelect}
            ambientFloat={params.ambientFloat}
            focusReticles={params.focusReticles}
            motionBlur={params.motionBlur}
            thumbnailScale={params.thumbnailScale}
            transitSpeed={params.transitSpeed}
            tierCount={params.tierCount}
            sphereRadius={params.sphereRadius}
            arcDegrees={params.arcDegrees}
            rowSeparation={params.rowSeparation}
            onSelect={handleSelect}
          />
        ))}
      </Canvas>
      <div
        data-testid="cerebro-vignette-overlay"
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ${
          params.vignette && !isDimmed ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 70% 68% at 50% 50%, rgba(12, 11, 16, 0) 42%, rgba(12, 11, 16, 0.55) 74%, rgba(12, 11, 16, 0.94) 100%)',
        }}
      />
    </div>
  )
}
