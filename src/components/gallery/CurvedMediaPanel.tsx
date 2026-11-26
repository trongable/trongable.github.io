import React, { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTheme } from '@/context/ThemeContext'
import { GalleryItem, computeSphericalPosition } from './galleryData'
import {
  SCREEN_VERTEX_SHADER,
  SCREEN_FRAGMENT_SHADER,
  buildCurvedPanelGeometries,
  createFallbackPanelTexture,
} from './panelShader'
import { scrambleGlyphs } from '@/utils/glyphUtils'
import { preloadAndDecodeImage } from '@/utils/imagePreload'

export interface CurvedMediaPanelProps {
  video: GalleryItem
  isDimmed?: boolean
  isSelected?: boolean
  thumbnailScale?: number
  transitSpeed?: number
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
  thumbnailScale = 1.0,
  transitSpeed = 16,
  sphereRadius = 4.5,
  arcDegrees = 200,
  rowSeparation = 1.8,
  onSelect,
}) => {
  const { currentTheme } = useTheme()
  const { gl } = useThree()
  const maxAnisotropy = Math.min(16, gl?.capabilities?.getMaxAnisotropy?.() ?? 4)
  const themeColorHex = currentTheme.primary
  const highlightColorHex = currentTheme.highlight

  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const borderMatRef = useRef<THREE.LineBasicMaterial>(null)
  const screenMatRef = useRef<THREE.ShaderMaterial>(null)
  const playRingMatRef = useRef<THREE.LineBasicMaterial>(null)
  const playTriMatRef = useRef<THREE.LineBasicMaterial>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(video.title.toLowerCase())
  const scrambleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flightProgress = useRef(0)

  // Scratch vectors and colors (Zero-allocation in useFrame)
  const scratchCenterPos = useRef(new THREE.Vector3()).current
  const scratchThemeColor = useRef(new THREE.Color()).current
  const screenUniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uHasMap: { value: false },
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
    const totalInTier = video.totalInTier ?? 9
    const indexInTier =
      typeof video.indexInTier === 'number'
        ? video.indexInTier
        : (video.index - 1) % totalInTier

    const stepRatio = totalInTier > 1 ? Math.max(0, Math.min(1, indexInTier / (totalInTier - 1))) : 0.5
    const azimuth = -arcDegrees / 2 + stepRatio * arcDegrees

    const tierFactor = video.tier === 'upper' ? 1 : video.tier === 'lower' ? -1 : 0
    const clampedRatio = Math.max(-0.95, Math.min(0.95, (tierFactor * rowSeparation) / sphereRadius))
    const elevation = THREE.MathUtils.radToDeg(Math.asin(clampedRatio))

    const phiRad = THREE.MathUtils.degToRad(elevation)
    const horizRadius = sphereRadius * Math.cos(phiRad)

    const pos = computeSphericalPosition(sphereRadius, azimuth, elevation)
    const dummy = new THREE.Object3D()
    dummy.position.copy(pos)
    dummy.lookAt(0, 0, 0)
    return {
      initialPosition: pos,
      initialQuaternion: dummy.quaternion.clone(),
      Rh: horizRadius,
    }
  }, [
    video.tier,
    video.index,
    video.indexInTier,
    video.totalInTier,
    sphereRadius,
    arcDegrees,
    rowSeparation,
  ])

  const { screenGeo, borderGeo, playRingGeo, playTriangleGeo } = useMemo(
    () => buildCurvedPanelGeometries(panelWidth, panelHeight, Rh, video.type),
    [panelWidth, panelHeight, Rh, video.type]
  )

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
      playRingGeo?.dispose()
      playTriangleGeo?.dispose()
      texture?.dispose()
      screenMatRef.current?.dispose()
      borderMatRef.current?.dispose()
      playRingMatRef.current?.dispose()
      playTriMatRef.current?.dispose()
      if (scrambleTimerRef.current) clearTimeout(scrambleTimerRef.current)
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'default'
      }
    }
  }, [screenGeo, borderGeo, playRingGeo, playTriangleGeo, texture])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerEnter = (e: any) => {
    e.stopPropagation()
    setIsHovered(true)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer'
    }

    if (video.type === 'photo') {
      preloadAndDecodeImage(video.hqImageUrl || video.imageUrl)
    }

    let iter = 0
    if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current)

    scrambleTimerRef.current = setInterval(() => {
      iter++
      const progress = iter / 8
      setDisplayTitle(scrambleGlyphs(video.title.toLowerCase(), progress).toLowerCase())
      if (iter >= 8) {
        clearInterval(scrambleTimerRef.current!)
        setDisplayTitle(video.title.toLowerCase())
      }
    }, 40)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerLeave = (e: any) => {
    e.stopPropagation()
    setIsHovered(false)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'default'
    }
    if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current)
    setDisplayTitle(video.title.toLowerCase())
  }

  // Smooth hover scale & Fly-to-Center animation in useFrame (Zero-allocation)
  useFrame(({ camera, viewport }, delta) => {
    if (!groupRef.current) return

    const targetFlight = isSelected ? 1.0 : 0.0
    flightProgress.current = THREE.MathUtils.damp(flightProgress.current, targetFlight, transitSpeed, delta)
    const fp = flightProgress.current

    if (groupRef.current.position && groupRef.current.quaternion && groupRef.current.scale) {
      if (fp > 0.001) {
        scratchCenterPos.set(0, 0, -2.15).applyMatrix4(camera.matrixWorld)
        groupRef.current.position.lerpVectors(initialPosition, scratchCenterPos, fp)
        groupRef.current.quaternion.slerpQuaternions(initialQuaternion, camera.quaternion, fp)
      } else {
        groupRef.current.position.copy(initialPosition)
        groupRef.current.quaternion.copy(initialQuaternion)
      }

      const persCam = camera as THREE.PerspectiveCamera
      const fovYRad = THREE.MathUtils.degToRad(persCam.fov || 46)
      const frustumHeight = 2 * 2.15 * Math.tan(fovYRad / 2)
      const aspect = persCam.aspect || (viewport ? viewport.aspect : 16 / 9)
      const frustumWidth = frustumHeight * aspect

      const maxW = 0.90 * frustumWidth
      const maxH = 0.80 * frustumHeight

      const itemAspect = panelWidth / panelHeight
      let targetW = maxW
      let targetH = targetW / itemAspect
      if (targetH > maxH) {
        targetH = maxH
        targetW = targetH * itemAspect
      }

      const fullScreenScale = targetH / panelHeight
      const hoverScale = isHovered && !isDimmed ? 1.05 : 1.0
      const restingScale = hoverScale * thumbnailScale
      const targetScale = THREE.MathUtils.lerp(restingScale, fullScreenScale, fp)

      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 10, delta)
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 10, delta)
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 10, delta)
    }

    const isVideo = video.type === 'video'

    if (borderMatRef.current) {
      scratchThemeColor.set(isHovered ? highlightColorHex : themeColorHex)
      borderMatRef.current.color.copy(scratchThemeColor)
      const baseBorderOpacity = isHovered ? 0.95 : 0.40
      borderMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : (isSelected ? 0.50 : baseBorderOpacity)
    }

    if (isVideo) {
      const playIconFactor = Math.max(0, 1.0 - fp * 2)
      scratchThemeColor.set(isHovered ? highlightColorHex : themeColorHex)
      if (playRingMatRef.current) {
        playRingMatRef.current.color.copy(scratchThemeColor)
        playRingMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : (isHovered ? 1.0 : 0.65) * playIconFactor
      }
      if (playTriMatRef.current) {
        playTriMatRef.current.color.copy(scratchThemeColor)
        playTriMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : (isHovered ? 1.0 : 0.65) * playIconFactor
      }
    }

    if (textRef.current && typeof textRef.current.fillOpacity === 'number') {
      const textBaseOpacity = isHovered ? 1.0 : 0.75
      const textDimFactor = isSelected ? Math.max(0, 1.0 - fp * 2) : (isDimmed ? 0.0 : 1.0)
      textRef.current.fillOpacity = textBaseOpacity * textDimFactor
    }
  })

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      quaternion={initialQuaternion}
      visible={!isDimmed || isSelected}
      data-testid={`curved-video-panel-${video.id}`}
    >
      {/* Solid opaque backing mesh to occlude background stars/geometry in depth buffer */}
      <mesh
        geometry={screenGeo}
        position={[0, 0, -0.003]}
        raycast={() => null}
      >
        <meshBasicMaterial
          color="#0c0b10"
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
          opacity={isDimmed && !isSelected ? 0.05 : 0.40}
        />
      </lineLoop>

      {video.type === 'video' && playRingGeo && playTriangleGeo && (
        <group position={[0, 0, 0.02]} visible={!isDimmed || isSelected} raycast={() => null}>
          <lineLoop geometry={playRingGeo}>
            <lineBasicMaterial
              ref={playRingMatRef}
              color={isHovered ? highlightColorHex : themeColorHex}
              transparent
              opacity={isHovered ? 1.0 : 0.65}
            />
          </lineLoop>
          <lineLoop geometry={playTriangleGeo}>
            <lineBasicMaterial
              ref={playTriMatRef}
              color={isHovered ? highlightColorHex : themeColorHex}
              transparent
              opacity={isHovered ? 1.0 : 0.65}
            />
          </lineLoop>
        </group>
      )}

      <group position={[0, -panelHeight / 2 - 0.10, 0]} visible={!isDimmed || isSelected} raycast={() => null}>
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
          color={isHovered ? highlightColorHex : themeColorHex}
          anchorX="center"
          anchorY="top"
          letterSpacing={0.02}
          fillOpacity={isHovered ? 1.0 : 0.75}
          raycast={() => null}
        >
          {displayTitle.toLowerCase()}
        </Text>
      </group>
    </group>
  )
}

// Retain CurvedVideoPanel export alias for full backward compatibility
export const CurvedVideoPanel = CurvedMediaPanel
