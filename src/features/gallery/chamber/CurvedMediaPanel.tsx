import React, { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTheme } from '@/context/ThemeContext'
import {
  GalleryItem,
  computePanelSphericalAngles,
  computeSphericalPosition,
} from '@/features/gallery/data/galleryData'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from '@/features/gallery/data/galleryTunerConfig'
import {
  SCREEN_VERTEX_SHADER,
  SCREEN_FRAGMENT_SHADER,
  buildCurvedPanelGeometries,
  createFallbackPanelTexture,
} from '@/features/gallery/chamber/panelShader'
import { usePanelMotion } from '@/features/gallery/chamber/usePanelMotion'
import { scrambleGlyphs } from '@/utils/glyphUtils'
import { preloadAndDecodeImage } from '@/utils/imagePreload'

export interface CurvedMediaPanelProps {
  video: GalleryItem
  isDimmed?: boolean
  isSelected?: boolean
  isFocused?: boolean
  onHoverChange?: (id: string, hovered: boolean) => void
  introCollapse?: boolean
  scatterOnSelect?: boolean
  ambientFloat?: boolean
  focusReticles?: boolean
  motionBlur?: boolean
  thumbnailScale?: number
  transitSpeed?: number
  tierCount?: 3 | 4
  sphereRadius?: number
  arcDegrees?: number
  rowSeparation?: number
  onSelect: (item: GalleryItem) => void
}

export type CurvedVideoPanelProps = CurvedMediaPanelProps

export const CurvedMediaPanel: React.FC<CurvedMediaPanelProps> = ({
  video,
  isDimmed = false,
  isSelected = false,
  isFocused,
  onHoverChange,
  introCollapse = DEFAULT_GALLERY_CHAMBER_PARAMS.introCollapse,
  scatterOnSelect = DEFAULT_GALLERY_CHAMBER_PARAMS.scatterOnSelect,
  ambientFloat = DEFAULT_GALLERY_CHAMBER_PARAMS.ambientFloat,
  focusReticles = DEFAULT_GALLERY_CHAMBER_PARAMS.focusReticles,
  motionBlur = DEFAULT_GALLERY_CHAMBER_PARAMS.motionBlur,
  thumbnailScale = DEFAULT_GALLERY_CHAMBER_PARAMS.thumbnailScale,
  transitSpeed = DEFAULT_GALLERY_CHAMBER_PARAMS.transitSpeed,
  tierCount = DEFAULT_GALLERY_CHAMBER_PARAMS.tierCount,
  sphereRadius = DEFAULT_GALLERY_CHAMBER_PARAMS.sphereRadius,
  arcDegrees = DEFAULT_GALLERY_CHAMBER_PARAMS.arcDegrees,
  rowSeparation = DEFAULT_GALLERY_CHAMBER_PARAMS.rowSeparation,
  onSelect,
}) => {
  const { currentTheme } = useTheme()
  const { gl } = useThree()
  const maxAnisotropy = Math.min(16, gl?.capabilities?.getMaxAnisotropy?.() ?? 4)
  const themeColorHex = currentTheme.primary
  const highlightColorHex = currentTheme.highlight

  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const backingMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const borderMatRef = useRef<THREE.LineBasicMaterial>(null)
  const reticleMatRef = useRef<THREE.LineBasicMaterial>(null)
  const screenMatRef = useRef<THREE.ShaderMaterial>(null)
  const playRingMatRef = useRef<THREE.LineBasicMaterial>(null)
  const playTriMatRef = useRef<THREE.LineBasicMaterial>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)

  const [isHovered, setIsHovered] = useState(false)
  const effectiveFocused = typeof isFocused === 'boolean' ? isFocused : isHovered
  const [displayTitle, setDisplayTitle] = useState(video.title.toLowerCase())
  const scrambleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const screenUniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uHasMap: { value: false },
      uOpacity: { value: 1.0 },
      uBlurVec: { value: new THREE.Vector2(0, 0) },
    }),
    []
  )

  const { panelWidth, panelHeight } = useMemo(() => {
    if (video.type === 'video') {
      return { panelWidth: 1.60, panelHeight: 0.90 }
    }
    const h = video.aspectRatio >= 1 ? 1.08 : 1.20
    const w = Math.round(h * video.aspectRatio * 100) / 100
    return { panelWidth: w, panelHeight: h }
  }, [video.type, video.aspectRatio])

  const { initialPosition, initialQuaternion, Rh } = useMemo(() => {
    const { azimuthDeg, elevationDeg } = computePanelSphericalAngles(
      video,
      tierCount,
      arcDegrees,
      sphereRadius,
      rowSeparation
    )
    const phiRad = THREE.MathUtils.degToRad(elevationDeg)
    const horizRadius = sphereRadius * Math.cos(phiRad)

    const pos = computeSphericalPosition(sphereRadius, azimuthDeg, elevationDeg)
    const dummy = new THREE.Object3D()
    dummy.position.copy(pos)
    dummy.lookAt(0, 0, 0)
    return {
      initialPosition: pos,
      initialQuaternion: dummy.quaternion.clone(),
      Rh: horizRadius,
    }
  }, [
    video,
    tierCount,
    sphereRadius,
    arcDegrees,
    rowSeparation,
  ])

  const panelGeos = useMemo(
    () => buildCurvedPanelGeometries(panelWidth, panelHeight, Rh, video.type),
    [panelWidth, panelHeight, Rh, video.type]
  )
  const { screenGeo, borderGeo, reticleGeo, playRingGeo, playTriangleGeo } = panelGeos

  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let active = true
    const fallbackTex = createFallbackPanelTexture()
    if (fallbackTex && active) setTexture(fallbackTex)

    if (typeof Image !== 'undefined') {
      const loader = new THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')
      const targetUrl = video.thumbnailUrl || video.imageUrl
      loader.load(
        targetUrl,
        (loadedTex) => {
          if (!active) {
            loadedTex.dispose()
            return
          }
          // Keep NoColorSpace (GL_RGBA8) so GPU mipmaps average in sRGB space without linear-light shadow lifting
          loadedTex.colorSpace = THREE.NoColorSpace
          loadedTex.generateMipmaps = true
          loadedTex.minFilter = THREE.LinearMipmapLinearFilter
          loadedTex.magFilter = THREE.LinearFilter
          loadedTex.anisotropy = maxAnisotropy
          setTexture(loadedTex)
        },
        undefined,
        () => {}
      )
    }

    return () => {
      active = false
    }
  }, [video.thumbnailUrl, video.imageUrl, maxAnisotropy])

  useEffect(() => {
    screenUniforms.uMap.value = texture
    screenUniforms.uHasMap.value = Boolean(texture)
    if (screenMatRef.current?.uniforms) {
      screenMatRef.current.uniforms.uMap.value = texture
      screenMatRef.current.uniforms.uHasMap.value = Boolean(texture)
    }
  }, [texture, screenUniforms])

  // Explicit WebGL resource disposal & cursor reset on unmount
  useEffect(() => {
    return () => {
      screenGeo.dispose()
      borderGeo.dispose()
      reticleGeo.dispose()
      playRingGeo?.dispose()
      playTriangleGeo?.dispose()
      texture?.dispose()
      backingMatRef.current?.dispose()
      screenMatRef.current?.dispose()
      borderMatRef.current?.dispose()
      reticleMatRef.current?.dispose()
      playRingMatRef.current?.dispose()
      playTriMatRef.current?.dispose()
      if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current)
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'default'
      }
    }
  }, [screenGeo, borderGeo, reticleGeo, playRingGeo, playTriangleGeo, texture])

  // Trigger glyph scramble + photo pre-decode whenever focus activates
  useEffect(() => {
    if (scrambleTimerRef.current) {
      clearInterval(scrambleTimerRef.current)
      scrambleTimerRef.current = null
    }

    if (!effectiveFocused || isDimmed) {
      setDisplayTitle(video.title.toLowerCase())
      return
    }

    if (video.type === 'photo') {
      preloadAndDecodeImage(video.hqImageUrl || video.imageUrl)
    }

    let iter = 0
    scrambleTimerRef.current = setInterval(() => {
      iter++
      const progress = iter / 8
      setDisplayTitle(scrambleGlyphs(video.title.toLowerCase(), progress).toLowerCase())
      if (iter >= 8 && scrambleTimerRef.current) {
        clearInterval(scrambleTimerRef.current)
        scrambleTimerRef.current = null
        setDisplayTitle(video.title.toLowerCase())
      }
    }, 40)

    return () => {
      if (scrambleTimerRef.current) {
        clearInterval(scrambleTimerRef.current)
        scrambleTimerRef.current = null
      }
    }
  }, [effectiveFocused, isDimmed, video.title, video.type, video.hqImageUrl, video.imageUrl])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerEnter = (e: any) => {
    e.stopPropagation()
    setIsHovered(true)
    onHoverChange?.(video.id, true)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerLeave = (e: any) => {
    e.stopPropagation()
    setIsHovered(false)
    onHoverChange?.(video.id, false)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'default'
    }
  }

  const { mountPosition } = usePanelMotion({
    itemIndex: video.index,
    itemType: video.type,
    panelWidth,
    panelHeight,
    sphereRadius,
    initialPosition,
    initialQuaternion,
    panelGeos,
    isDimmed,
    isSelected,
    effectiveFocused,
    introCollapse,
    scatterOnSelect,
    ambientFloat,
    focusReticles,
    motionBlur,
    thumbnailScale,
    transitSpeed,
    themeColorHex,
    highlightColorHex,
    groupRef,
    backingMatRef,
    borderMatRef,
    reticleMatRef,
    screenMatRef,
    playRingMatRef,
    playTriMatRef,
    textRef,
    screenUniforms,
  })

  return (
    <group
      ref={groupRef}
      position={mountPosition}
      quaternion={initialQuaternion}
      visible={scatterOnSelect ? true : !isDimmed || isSelected}
      data-testid={`curved-video-panel-${video.id}`}
    >
      {/* Solid opaque backing mesh to occlude background stars/geometry in depth buffer */}
      <mesh
        geometry={screenGeo}
        position={[0, 0, -0.003]}
        raycast={() => null}
      >
        <meshBasicMaterial
          ref={backingMatRef}
          color="#0c0b10"
          transparent
          opacity={1}
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        geometry={screenGeo}
        data-testid={`curved-video-mesh-${video.id}`}
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(video)
        }}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
      >
        <shaderMaterial
          ref={screenMatRef}
          uniforms={screenUniforms}
          vertexShader={SCREEN_VERTEX_SHADER}
          fragmentShader={SCREEN_FRAGMENT_SHADER}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <lineLoop geometry={borderGeo} raycast={() => null}>
        <lineBasicMaterial
          ref={borderMatRef}
          color={themeColorHex}
          transparent
          opacity={isDimmed && !isSelected ? 0.0 : 0.40}
        />
      </lineLoop>

      <lineSegments
        geometry={reticleGeo}
        visible={focusReticles && !isDimmed}
        raycast={() => null}
        data-testid={`curved-panel-reticle-${video.id}`}
      >
        <lineBasicMaterial
          ref={reticleMatRef}
          color={highlightColorHex}
          transparent
          opacity={0}
        />
      </lineSegments>

      {video.type === 'video' && playRingGeo && playTriangleGeo && (
        <group position={[0, 0, 0.02]} raycast={() => null}>
          <lineLoop geometry={playRingGeo}>
            <lineBasicMaterial
              ref={playRingMatRef}
              color={effectiveFocused ? highlightColorHex : themeColorHex}
              transparent
              opacity={effectiveFocused ? 1.0 : 0.65}
            />
          </lineLoop>
          <lineLoop geometry={playTriangleGeo}>
            <lineBasicMaterial
              ref={playTriMatRef}
              color={effectiveFocused ? highlightColorHex : themeColorHex}
              transparent
              opacity={effectiveFocused ? 1.0 : 0.65}
            />
          </lineLoop>
        </group>
      )}

      <group position={[0, -panelHeight / 2 - 0.10, 0]} raycast={() => null}>
        <Text
          ref={textRef}
          font="/fonts/Newsreader-Italic.ttf"
          fontStyle="italic"
          fontSize={0.082}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ curveRadius: Rh } as any)}
          maxWidth={panelWidth * 0.95}
          lineHeight={1.2}
          textAlign="center"
          color={effectiveFocused ? highlightColorHex : themeColorHex}
          anchorX="center"
          anchorY="top"
          letterSpacing={0.02}
          fillOpacity={effectiveFocused ? 1.0 : 0.75}
          raycast={() => null}
        >
          {displayTitle.toLowerCase()}
        </Text>
      </group>
    </group>
  )
}

export const CurvedVideoPanel = CurvedMediaPanel
