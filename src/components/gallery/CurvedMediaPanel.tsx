import React, { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTheme } from '@/context/ThemeContext'
import { GalleryItem, computeSphericalPosition } from './galleryData'
import { scrambleGlyphs } from '@/utils/glyphUtils'
import { preloadAndDecodeImage } from '@/utils/imagePreload'

const SCREEN_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SCREEN_FRAGMENT_SHADER = `
uniform sampler2D uMap;
uniform bool uHasMap;
varying vec2 vUv;
void main() {
  gl_FragColor = uHasMap ? texture2D(uMap, vUv, -0.75) : vec4(0.09, 0.086, 0.114, 1.0);
}
`

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

  // Derive panel dimensions from aspect ratio:
  // Video: calibrated 1.60 x 0.90 (16:9 widescreen) with guaranteed tier clearance
  // Portrait Photo: ~0.90 x 1.20 (3:4)
  // Landscape Photo: ~1.44 x 1.08 (4:3)
  const { panelWidth, panelHeight } = useMemo(() => {
    if (video.type === 'video') {
      return { panelWidth: 1.60, panelHeight: 0.90 }
    }
    if (video.aspectRatio >= 1) {
      const h = 1.08
      const w = Math.round(h * video.aspectRatio * 100) / 100
      return { panelWidth: w, panelHeight: h }
    } else {
      const h = 1.20
      const w = Math.round(h * video.aspectRatio * 100) / 100
      return { panelWidth: w, panelHeight: h }
    }
  }, [video.type, video.aspectRatio])

  // Compute 3D position on sphere wall and rotation facing origin, plus horizontal latitude radius Rh
  const { initialPosition, initialQuaternion, Rh } = useMemo(() => {
    let azimuth = video.azimuthDeg
    let elevation = video.elevationDeg

    const totalInTier = video.totalInTier ?? 9
    const indexInTier =
      typeof video.indexInTier === 'number'
        ? video.indexInTier
        : (video.index - 1) % totalInTier

    const stepRatio = totalInTier > 1 ? Math.max(0, Math.min(1, indexInTier / (totalInTier - 1))) : 0.5
    azimuth = -arcDegrees / 2 + stepRatio * arcDegrees

    let tierFactor = 0
    if (video.tier === 'upper') tierFactor = 1
    else if (video.tier === 'lower') tierFactor = -1
    else tierFactor = 0 // 'middle'

    const clampedRatio = Math.max(-0.95, Math.min(0.95, (tierFactor * rowSeparation) / sphereRadius))
    elevation = THREE.MathUtils.radToDeg(Math.asin(clampedRatio))

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
    video.azimuthDeg,
    video.elevationDeg,
    video.tier,
    video.index,
    video.indexInTier,
    video.totalInTier,
    sphereRadius,
    arcDegrees,
    rowSeparation,
  ])

  // 1. Procedural Curved Screen Geometry aligned with sphere latitude radius Rh
  const { screenGeo, borderGeo, playRingGeo, playTriangleGeo } = useMemo(() => {
    const segments = 32
    const sGeo = new THREE.PlaneGeometry(panelWidth, panelHeight, segments, 1)
    const posAttr = sGeo.attributes.position

    const hw = panelWidth / 2
    const hh = panelHeight / 2
    const clampedHw = Math.min(hw, Rh * 0.99)
    const alphaMax = Math.asin(clampedHw / Rh)

    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i) // in [-hw, +hw]
      const alpha = (u / hw) * alphaMax
      const xCurv = Rh * Math.sin(alpha)
      const zCurv = Rh * (1 - Math.cos(alpha))
      posAttr.setX(i, xCurv)
      posAttr.setZ(i, zCurv)
    }
    posAttr.needsUpdate = true
    sGeo.computeVertexNormals()

    // Curved border wireframe hugging the exact perimeter on Rh
    const borderPoints: THREE.Vector3[] = []

    // Bottom edge: left to right (-hw to +hw at y = -hh)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const alpha = -alphaMax + t * (2 * alphaMax)
      const x = Rh * Math.sin(alpha)
      const z = Rh * (1 - Math.cos(alpha))
      borderPoints.push(new THREE.Vector3(x, -hh, z))
    }

    // Top edge: right to left (+hw to -hw at y = +hh)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments
      const alpha = -alphaMax + t * (2 * alphaMax)
      const x = Rh * Math.sin(alpha)
      const z = Rh * (1 - Math.cos(alpha))
      borderPoints.push(new THREE.Vector3(x, hh, z))
    }

    // Close loop back to bottom-left
    const zCorner = Rh * (1 - Math.cos(-alphaMax))
    borderPoints.push(new THREE.Vector3(-clampedHw, -hh, zCorner))

    const bGeo = new THREE.BufferGeometry().setFromPoints(borderPoints)

    // Play icon geometry (only for video modality)
    let prGeo: THREE.BufferGeometry | null = null
    let ptGeo: THREE.BufferGeometry | null = null

    if (video.type === 'video') {
      const ringPts: THREE.Vector3[] = []
      const rSegs = 32
      for (let i = 0; i <= rSegs; i++) {
        const a = (i / rSegs) * Math.PI * 2
        ringPts.push(new THREE.Vector3(0.20 * Math.cos(a), 0.20 * Math.sin(a), 0.02))
      }
      prGeo = new THREE.BufferGeometry().setFromPoints(ringPts)

      const triPts: THREE.Vector3[] = [
        new THREE.Vector3(-0.06, 0.085, 0.02),
        new THREE.Vector3(0.095, 0, 0.02),
        new THREE.Vector3(-0.06, -0.085, 0.02),
      ]
      ptGeo = new THREE.BufferGeometry().setFromPoints(triPts)
    }

    return { screenGeo: sGeo, borderGeo: bGeo, playRingGeo: prGeo, playTriangleGeo: ptGeo }
  }, [panelWidth, panelHeight, Rh, video.type])

  // Explicit WebGL disposal for procedural geometries on parameter change or unmount
  useEffect(() => {
    return () => {
      screenGeo.dispose()
      borderGeo.dispose()
      playRingGeo?.dispose()
      playTriangleGeo?.dispose()
    }
  }, [screenGeo, borderGeo, playRingGeo, playTriangleGeo])

  // 2. Texture Loader with Offline Procedural Canvas Fallback
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let active = true

    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 180
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#17161d'
          ctx.fillRect(0, 0, 320, 180)
          ctx.strokeStyle = '#2a2836'
          ctx.lineWidth = 1
          for (let x = 0; x < 320; x += 32) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, 180)
            ctx.stroke()
          }
          for (let y = 0; y < 180; y += 18) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(320, y)
            ctx.stroke()
          }
        }
        const fallbackTex = new THREE.CanvasTexture(canvas)
        fallbackTex.colorSpace = THREE.NoColorSpace
        fallbackTex.needsUpdate = true
        if (active) setTexture(fallbackTex)
      } catch {
        // ignore in non-canvas environments
      }
    }

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

  // Hover scramble effect on item title, native cursor pointer switch, and background pre-decode
  const handlePointerEnter = (e: any) => {
    e.stopPropagation()
    setIsHovered(true)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer'
    }

    // Speculatively pre-decode full-size photo while user hovers
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

    // 1. Fly-to-center interpolation when selected: projects dynamically in front of active camera
    const targetFlight = isSelected ? 1.0 : 0.0
    flightProgress.current = THREE.MathUtils.damp(flightProgress.current, targetFlight, transitSpeed, delta)
    const fp = flightProgress.current

    if (groupRef.current.position && groupRef.current.quaternion && groupRef.current.scale) {
      if (fp > 0.001) {
        // Dynamic center target directly in front of the viewer's current camera perspective
        scratchCenterPos.set(0, 0, -2.15).applyMatrix4(camera.matrixWorld)
        groupRef.current.position.lerpVectors(initialPosition, scratchCenterPos, fp)

        // Smoothly interpolate rotation to face flat forward towards current camera gaze
        groupRef.current.quaternion.slerpQuaternions(initialQuaternion, camera.quaternion, fp)
      } else {
        groupRef.current.position.copy(initialPosition)
        groupRef.current.quaternion.copy(initialQuaternion)
      }

      // 2. Fullscreen scale calibration: matches the 2D theater overlay bounds (max-w-[90vw], max-h-[80vh])
      // At distance d = 2.15 with vertical FOV (46 deg):
      const persCam = camera as THREE.PerspectiveCamera
      const fovYRad = THREE.MathUtils.degToRad(persCam.fov || 46)
      const frustumHeight = 2 * 2.15 * Math.tan(fovYRad / 2) // ~1.82524
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

      // Resting scale on sphere wall (hoverScale * thumbnailScale) lerps to fullScreenScale when flying to center
      const hoverScale = isHovered && !isDimmed ? 1.05 : 1.0
      const restingScale = hoverScale * thumbnailScale
      const targetScale = THREE.MathUtils.lerp(restingScale, fullScreenScale, fp)

      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 10, delta)
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 10, delta)
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 10, delta)
    }

    const isVideo = video.type === 'video'

    // Border highlight: stays crisp and visible during flight, matching the 2D overlay border
    if (borderMatRef.current) {
      scratchThemeColor.set(isHovered ? highlightColorHex : themeColorHex)
      borderMatRef.current.color.copy(scratchThemeColor)
      const baseBorderOpacity = isHovered ? 0.95 : 0.40
      borderMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : (isSelected ? 0.50 : baseBorderOpacity)
    }

    // Play icon: dissolves out cleanly during flight (only videos have play icons)
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

    // Title label: dissolves out during flight
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
      {/* 100% Solid Opaque Backing Mesh to fully occlude background stars/geometry in depth buffer */}
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

      {/* Curved Screen Mesh */}
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

      {/* Cyber Frame Border */}
      <lineLoop geometry={borderGeo} raycast={() => null}>
        <lineBasicMaterial
          ref={borderMatRef}
          color={themeColorHex}
          transparent
          opacity={isDimmed && !isSelected ? 0.05 : 0.40}
        />
      </lineLoop>

      {/* Central Holographic Play Icon (only for videos) */}
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

      {/* Title Label in Newsreader italic serif */}
      <group position={[0, -panelHeight / 2 - 0.10, 0]} visible={!isDimmed || isSelected} raycast={() => null}>
        <Text
          ref={textRef}
          font="/fonts/Newsreader-Italic.ttf"
          fontStyle="italic"
          fontSize={0.082}
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
