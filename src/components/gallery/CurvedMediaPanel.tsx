import React, { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTheme } from '@/context/ThemeContext'
import { GalleryItem, computeSphericalPosition, computePanelAzimuthDeg, getTierFactor } from './galleryData'
import { DEFAULT_GALLERY_CHAMBER_PARAMS } from './galleryTunerConfig'
import {
  SCREEN_VERTEX_SHADER,
  SCREEN_FRAGMENT_SHADER,
  buildCurvedPanelGeometries,
  applyPanelCurvature,
  createFallbackPanelTexture,
  computePanelSurfaceBlur,
} from './panelShader'
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

const isReducedMotionEnabled = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const flightProgress = useRef(0)
  const hoverScaleRef = useRef(1.0)
  const lastCurveFactorRef = useRef(1.0)
  const reducedMotionRef = useRef(isReducedMotionEnabled())
  const introExpand = useRef(reducedMotionRef.current || !introCollapse ? 0.0 : 1.0)
  const scatterExpand = useRef(0.0)
  const reticleOpacity = useRef(0)
  const hasPrevLocalRef = useRef(false)
  const smoothBlurRef = useRef({ x: 0, y: 0 })

  // Scratch vectors and colors (Zero-allocation in useFrame)
  const scratchCenterPos = useRef(new THREE.Vector3()).current
  const scratchScatterPos = useRef(new THREE.Vector3()).current
  const scratchLocalDir = useRef(new THREE.Vector3()).current
  const scratchPrevLocalDir = useRef(new THREE.Vector3()).current
  const scratchDeltaLocal = useRef(new THREE.Vector3()).current
  const scratchInvCamQuat = useRef(new THREE.Quaternion()).current
  const scratchInvPanelQuat = useRef(new THREE.Quaternion()).current
  const scratchThemeColor = useRef(new THREE.Color()).current
  const scratchTargetBlur = useRef({ x: 0, y: 0 }).current
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
    const totalInTier = video.totalInTier ?? 9
    const indexInTier =
      typeof video.indexInTier === 'number'
        ? video.indexInTier
        : (video.index - 1) % totalInTier

    const azimuth = computePanelAzimuthDeg(indexInTier, totalInTier, arcDegrees)

    const tierFactor = getTierFactor(video.tier, tierCount)
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

  useEffect(() => {
    lastCurveFactorRef.current = 1.0
  }, [panelGeos])

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

  // Trigger glyph scramble + photo pre-decode whenever focus activates (mouse hover OR center gaze)
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

  // Smooth intro collapse, radial scatter, ambient float, focus zoom, & Fly-to-Center in useFrame (Zero-allocation)
  useFrame(({ camera, viewport, clock }, delta) => {
    if (!groupRef.current) return

    const reducedMotion = reducedMotionRef.current
    const targetFlight = isSelected ? 1.0 : 0.0
    let fp = THREE.MathUtils.damp(flightProgress.current, targetFlight, transitSpeed, delta)
    if (isSelected && fp > 0.992) {
      fp = 1.0
    } else if (!isSelected && fp < 0.001) {
      fp = 0.0
    }
    flightProgress.current = fp

    // Flatten cylindrical curvature during fly-in (`1.0 -> 0.0`) and re-curve on fly-out (`0.0 -> 1.0`)
    const curveFactor = fp <= 0.001 ? 1.0 : fp >= 0.992 ? 0.0 : Math.max(0.0, 1.0 - fp)
    if (Math.abs(curveFactor - lastCurveFactorRef.current) > 0.0005) {
      applyPanelCurvature(panelGeos, curveFactor)
      lastCurveFactorRef.current = curveFactor
    }

    // 1. Unified radial expansion (4.5x in deep space -> 1.0x resting sphere, identical for intro & exit)
    if (!introCollapse || reducedMotion || isSelected) {
      introExpand.current = 0.0
    } else if (introExpand.current > 0.001) {
      introExpand.current = THREE.MathUtils.damp(introExpand.current, 0.0, 6.0, delta)
    }

    // 2. Radial scatter progress for non-selected panels when another item is selected (1.0x -> 4.5x radius)
    const shouldScatter = isDimmed && !isSelected && scatterOnSelect && !reducedMotion
    scatterExpand.current = THREE.MathUtils.damp(scatterExpand.current, shouldScatter ? 1.0 : 0.0, 6.0, delta)
    const ep = Math.max(introExpand.current, scatterExpand.current)

    // 3. Visibility management (keep scattering panels visible until faded out)
    if (!scatterOnSelect || reducedMotion) {
      groupRef.current.visible = !isDimmed || isSelected
    } else if (isDimmed && !isSelected) {
      groupRef.current.visible = ep < 0.98
    } else {
      groupRef.current.visible = true
    }

    // 4. True-perspective radial displacement + ambient float + fly-to-center interpolation
    const radialMult = 1.0 + ep * 3.5
    scratchScatterPos.copy(initialPosition).multiplyScalar(radialMult)

    if (ambientFloat && !isSelected && !reducedMotion && ep < 0.5) {
      const elapsed = clock?.elapsedTime ?? 0
      scratchScatterPos.y += Math.sin(elapsed * 1.1 + video.index * 0.7) * 0.015 * (1.0 - ep)
    }

    if (groupRef.current.position && groupRef.current.quaternion && groupRef.current.scale) {
      if (fp > 0.001) {
        scratchCenterPos.set(0, 0, -2.15).applyMatrix4(camera.matrixWorld)
        groupRef.current.position.lerpVectors(scratchScatterPos, scratchCenterPos, fp)
        groupRef.current.quaternion.slerpQuaternions(initialQuaternion, camera.quaternion, fp)
      } else {
        groupRef.current.position.copy(scratchScatterPos)
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
      hoverScaleRef.current = THREE.MathUtils.damp(
        hoverScaleRef.current,
        effectiveFocused && !isDimmed ? 1.05 : 1.0,
        10,
        delta
      )
      const restingScale = hoverScaleRef.current * thumbnailScale
      const targetScale = THREE.MathUtils.lerp(restingScale, fullScreenScale, fp)

      if (fp > 0.001) {
        groupRef.current.scale.set(targetScale, targetScale, targetScale)
      } else {
        groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 10, delta)
        groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 10, delta)
        groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 10, delta)
      }
    }

    // 5. Unified radial opacity + per-panel directional motion blur
    const radialOpacity = 1.0 - THREE.MathUtils.smoothstep(ep, 0.60, 1.0)
    const panelOpacity = isSelected ? 1.0 : (!scatterOnSelect && isDimmed ? 0.0 : radialOpacity)

    scratchInvCamQuat.copy(camera.quaternion).invert()
    scratchLocalDir.copy(initialPosition).normalize().applyQuaternion(scratchInvCamQuat)

    // Per-panel apparent surface velocity projected from camera-local delta into panel (u, v) tangent space
    if (!hasPrevLocalRef.current) {
      scratchPrevLocalDir.copy(scratchLocalDir)
      hasPrevLocalRef.current = true
      smoothBlurRef.current.x = 0
      smoothBlurRef.current.y = 0
    } else if (!motionBlur || isSelected || reducedMotion) {
      scratchPrevLocalDir.copy(scratchLocalDir)
      smoothBlurRef.current.x = 0
      smoothBlurRef.current.y = 0
    } else {
      scratchDeltaLocal.copy(scratchLocalDir).sub(scratchPrevLocalDir)
      scratchPrevLocalDir.copy(scratchLocalDir)
      scratchInvPanelQuat.copy(initialQuaternion).invert()
      scratchDeltaLocal.applyQuaternion(camera.quaternion).applyQuaternion(scratchInvPanelQuat)

      computePanelSurfaceBlur(
        scratchDeltaLocal,
        delta,
        panelWidth,
        panelHeight,
        sphereRadius,
        scratchTargetBlur
      )

      smoothBlurRef.current.x = THREE.MathUtils.damp(smoothBlurRef.current.x, scratchTargetBlur.x, 22, delta)
      smoothBlurRef.current.y = THREE.MathUtils.damp(smoothBlurRef.current.y, scratchTargetBlur.y, 22, delta)
      if (Math.abs(smoothBlurRef.current.x) < 0.002) smoothBlurRef.current.x = 0
      if (Math.abs(smoothBlurRef.current.y) < 0.002) smoothBlurRef.current.y = 0
    }

    const blurX = smoothBlurRef.current.x
    const blurY = smoothBlurRef.current.y

    screenUniforms.uOpacity.value = panelOpacity
    screenUniforms.uBlurVec.value.set(blurX, blurY)
    if (screenMatRef.current) {
      if (screenMatRef.current.uniforms) {
        if (screenMatRef.current.uniforms.uOpacity) {
          screenMatRef.current.uniforms.uOpacity.value = panelOpacity
        }
        if (screenMatRef.current.uniforms.uBlurVec) {
          screenMatRef.current.uniforms.uBlurVec.value.set(blurX, blurY)
        }
      }
      screenMatRef.current.depthWrite = panelOpacity >= 0.98
    }

    if (backingMatRef.current) {
      backingMatRef.current.opacity = panelOpacity
      backingMatRef.current.depthWrite = panelOpacity >= 0.98
    }

    const isVideo = video.type === 'video'
    const isHighlighted = effectiveFocused && !isDimmed

    if (borderMatRef.current) {
      scratchThemeColor.set(isHighlighted ? highlightColorHex : themeColorHex)
      borderMatRef.current.color.copy(scratchThemeColor)
      const baseBorderOpacity = isHighlighted ? 0.95 : 0.40
      borderMatRef.current.opacity = isSelected ? 0.50 : baseBorderOpacity * panelOpacity
    }

    // 6. Orthogonal 90° corner reticle highlight opacity
    const targetReticleOp = focusReticles && isHighlighted ? 0.95 * panelOpacity : 0.0
    reticleOpacity.current = THREE.MathUtils.damp(reticleOpacity.current, targetReticleOp, 14, delta)
    if (reticleMatRef.current) {
      scratchThemeColor.set(highlightColorHex)
      reticleMatRef.current.color.copy(scratchThemeColor)
      reticleMatRef.current.opacity = reticleOpacity.current
    }

    if (isVideo) {
      const playIconFactor = Math.max(0, 1.0 - fp * 2)
      scratchThemeColor.set(isHighlighted ? highlightColorHex : themeColorHex)
      if (playRingMatRef.current) {
        playRingMatRef.current.color.copy(scratchThemeColor)
        playRingMatRef.current.opacity = (isHighlighted ? 1.0 : 0.65) * playIconFactor * panelOpacity
      }
      if (playTriMatRef.current) {
        playTriMatRef.current.color.copy(scratchThemeColor)
        playTriMatRef.current.opacity = (isHighlighted ? 1.0 : 0.65) * playIconFactor * panelOpacity
      }
    }

    if (textRef.current && typeof textRef.current.fillOpacity === 'number') {
      const textBaseOpacity = isHighlighted ? 1.0 : 0.75
      const textDimFactor = isSelected ? Math.max(0, 1.0 - fp * 2) : panelOpacity
      textRef.current.fillOpacity = textBaseOpacity * textDimFactor
    }
  })

  const mountPosition = useMemo(
    () =>
      introCollapse && !reducedMotionRef.current
        ? initialPosition.clone().multiplyScalar(4.5)
        : initialPosition,
    [initialPosition, introCollapse]
  )

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

// Retain CurvedVideoPanel export alias for full backward compatibility
export const CurvedVideoPanel = CurvedMediaPanel
