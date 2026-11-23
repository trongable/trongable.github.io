import React, { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useTheme } from '@/context/ThemeContext'
import { VideoItem, computeSphericalPosition } from './videoData'
import { scrambleGlyphs } from '@/utils/glyphUtils'

export interface CurvedVideoPanelProps {
  video: VideoItem
  isDimmed?: boolean
  isSelected?: boolean
  thumbnailScale?: number
  transitSpeed?: number
  sphereRadius?: number
  arcDegrees?: number
  rowSeparation?: number
  onSelect: (video: VideoItem) => void
}

// Enlarged 16:9 thumbnail dimensions (~33% larger for bold cinema presence)
const PANEL_WIDTH = 1.92
const PANEL_HEIGHT = 1.08

export const CurvedVideoPanel: React.FC<CurvedVideoPanelProps> = ({
  video,
  isDimmed = false,
  isSelected = false,
  thumbnailScale = 1.0,
  transitSpeed = 16,
  sphereRadius = 4.5,
  arcDegrees = 100,
  rowSeparation = 1.8,
  onSelect,
}) => {
  const { currentTheme } = useTheme()
  const themeColorHex = currentTheme.primary
  const highlightColorHex = currentTheme.highlight

  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const borderMatRef = useRef<THREE.LineBasicMaterial>(null)
  const screenMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const playRingMatRef = useRef<THREE.LineBasicMaterial>(null)
  const playTriMatRef = useRef<THREE.LineBasicMaterial>(null)
  const textRef = useRef<any>(null)

  const [isHovered, setIsHovered] = useState(false)
  const [displayTitle, setDisplayTitle] = useState(video.title)
  const scrambleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flightProgress = useRef(0)

  // Scratch vectors and colors (Zero-allocation in useFrame)
  const scratchCenterPos = useRef(new THREE.Vector3()).current
  const scratchBlack = useRef(new THREE.Color(0x000000)).current
  const scratchBaseColor = useRef(new THREE.Color()).current
  const scratchThemeColor = useRef(new THREE.Color()).current

  // Compute 3D position on sphere wall and rotation facing origin
  const { initialPosition, initialQuaternion } = useMemo(() => {
    let azimuth = video.azimuthDeg
    let elevation = video.elevationDeg

    if (video.tier === 'upper' && typeof video.index === 'number') {
      const i = Math.max(0, Math.min(3, video.index - 1))
      azimuth = -arcDegrees / 2 + i * (arcDegrees / 3)
      const clampedRatio = Math.max(-0.95, Math.min(0.95, (rowSeparation / 2) / sphereRadius))
      elevation = THREE.MathUtils.radToDeg(Math.asin(clampedRatio))
    } else if (video.tier === 'lower' && typeof video.index === 'number') {
      const j = Math.max(0, Math.min(2, video.index - 5))
      azimuth = -arcDegrees / 3 + j * (arcDegrees / 3)
      const clampedRatio = Math.max(-0.95, Math.min(0.95, (-rowSeparation / 2) / sphereRadius))
      elevation = THREE.MathUtils.radToDeg(Math.asin(clampedRatio))
    }

    const pos = computeSphericalPosition(sphereRadius, azimuth, elevation)
    const dummy = new THREE.Object3D()
    dummy.position.copy(pos)
    dummy.lookAt(0, 0, 0)
    return {
      initialPosition: pos,
      initialQuaternion: dummy.quaternion.clone(),
    }
  }, [video.azimuthDeg, video.elevationDeg, video.tier, video.index, sphereRadius, arcDegrees, rowSeparation])

  // 1. Procedural Curved Screen Geometry (Bent along sphere radius)
  const { screenGeo, borderGeo, playRingGeo, playTriangleGeo } = useMemo(() => {
    const segments = 24
    const sGeo = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT, segments, 1)
    const posAttr = sGeo.attributes.position

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      // Parabolic cylindrical curvature matching sphere wall
      const zCurv = -(x * x) / (2 * sphereRadius)
      posAttr.setZ(i, zCurv)
    }
    posAttr.needsUpdate = true
    sGeo.computeVertexNormals()

    // Cyber border wireframe with corner brackets
    const hw = PANEL_WIDTH / 2
    const hh = PANEL_HEIGHT / 2
    const zCorner = -(hw * hw) / (2 * sphereRadius)

    const borderPoints: THREE.Vector3[] = [
      new THREE.Vector3(-hw, -hh, zCorner),
      new THREE.Vector3(hw, -hh, zCorner),
      new THREE.Vector3(hw, hh, zCorner),
      new THREE.Vector3(-hw, hh, zCorner),
      new THREE.Vector3(-hw, -hh, zCorner),
    ]
    const bGeo = new THREE.BufferGeometry().setFromPoints(borderPoints)

    // Play icon ring (radius 0.20)
    const ringPts: THREE.Vector3[] = []
    const rSegs = 32
    for (let i = 0; i <= rSegs; i++) {
      const a = (i / rSegs) * Math.PI * 2
      ringPts.push(new THREE.Vector3(0.20 * Math.cos(a), 0.20 * Math.sin(a), 0.02))
    }
    const prGeo = new THREE.BufferGeometry().setFromPoints(ringPts)

    // Play icon triangle
    const triPts: THREE.Vector3[] = [
      new THREE.Vector3(-0.06, 0.085, 0.02),
      new THREE.Vector3(0.095, 0, 0.02),
      new THREE.Vector3(-0.06, -0.085, 0.02),
    ]
    const ptGeo = new THREE.BufferGeometry().setFromPoints(triPts)

    return { screenGeo: sGeo, borderGeo: bGeo, playRingGeo: prGeo, playTriangleGeo: ptGeo }
  }, [sphereRadius])

  // Explicit WebGL disposal for procedural geometries on parameter change or unmount
  useEffect(() => {
    return () => {
      screenGeo.dispose()
      borderGeo.dispose()
      playRingGeo.dispose()
      playTriangleGeo.dispose()
    }
  }, [screenGeo, borderGeo, playRingGeo, playTriangleGeo])

  // 2. Thumbnail Texture Loader with Offline Procedural Canvas Fallback
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
        fallbackTex.needsUpdate = true
        if (active) setTexture(fallbackTex)
      } catch {
        // ignore in non-canvas environments
      }
    }

    if (typeof Image !== 'undefined') {
      const loader = new THREE.TextureLoader()
      loader.setCrossOrigin('anonymous')
      loader.load(
        video.thumbnailUrl,
        (loadedTex) => {
          if (!active) {
            loadedTex.dispose()
            return
          }
          loadedTex.generateMipmaps = true
          loadedTex.minFilter = THREE.LinearMipmapLinearFilter
          setTexture(loadedTex)
        },
        undefined,
        () => {}
      )
    }

    return () => {
      active = false
    }
  }, [video.thumbnailUrl])

  // Explicit WebGL resource disposal & cursor reset on unmount
  useEffect(() => {
    return () => {
      screenGeo.dispose()
      borderGeo.dispose()
      playRingGeo.dispose()
      playTriangleGeo.dispose()
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

  // Hover scramble effect on video title and native cursor pointer switch
  const handlePointerEnter = (e: any) => {
    e.stopPropagation()
    setIsHovered(true)
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer'
    }

    let iter = 0
    if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current)

    scrambleTimerRef.current = setInterval(() => {
      iter++
      const progress = iter / 8
      setDisplayTitle(scrambleGlyphs(video.title, progress))
      if (iter >= 8) {
        clearInterval(scrambleTimerRef.current!)
        setDisplayTitle(video.title)
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
    setDisplayTitle(video.title)
  }

  // Smooth hover scale & Fly-to-Center animation in useFrame (Zero-allocation)
  useFrame(({ camera }, delta) => {
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

      // 2. Scale: 1.05x on hover, expanding to 1.6x when flying to center, modulated by thumbnailScale
      const hoverScale = isHovered && !isDimmed ? 1.05 : 1.0
      const targetScale = THREE.MathUtils.lerp(hoverScale, 1.6, fp) * thumbnailScale

      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 10, delta)
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 10, delta)
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 10, delta)
    }

    // Darkness progression: 0.0 at wall slot, 1.0 at full center flight
    const darknessFactor = THREE.MathUtils.clamp(fp, 0, 1)
    const visibilityFactor = Math.max(0, 1.0 - darknessFactor)

    // Border highlight and darkness fade
    if (borderMatRef.current) {
      scratchThemeColor.set(isHovered ? highlightColorHex : themeColorHex)
      borderMatRef.current.color.lerpColors(scratchThemeColor, scratchBlack, darknessFactor)
      const baseBorderOpacity = isHovered ? 0.95 : 0.40
      borderMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : baseBorderOpacity * visibilityFactor
    }

    // Holographic play icon: fade into darkness
    const playAndTextFactor = Math.max(0, 1.0 - darknessFactor * 1.5)
    scratchThemeColor.set(isHovered ? highlightColorHex : themeColorHex)
    if (playRingMatRef.current) {
      playRingMatRef.current.color.lerpColors(scratchThemeColor, scratchBlack, darknessFactor)
      playRingMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : (isHovered ? 1.0 : 0.65) * playAndTextFactor
    }
    if (playTriMatRef.current) {
      playTriMatRef.current.color.lerpColors(scratchThemeColor, scratchBlack, darknessFactor)
      playTriMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : (isHovered ? 1.0 : 0.65) * playAndTextFactor
    }

    // Title label: fade into darkness
    if (textRef.current && typeof textRef.current.fillOpacity === 'number') {
      const textBaseOpacity = isHovered ? 1.0 : 0.75
      textRef.current.fillOpacity = isDimmed && !isSelected ? 0.0 : textBaseOpacity * playAndTextFactor
    }

    // Curved thumbnail screen mesh: fade into darkness on fly-in, fade back in on fly-out
    if (screenMatRef.current) {
      scratchBaseColor.set(isHovered ? '#ffffff' : '#dddddd')
      // Color lerps into total darkness (pitch black #000000)
      screenMatRef.current.color.lerpColors(scratchBaseColor, scratchBlack, darknessFactor)
      // Opacity smoothly drops to 0 as it reaches center, and restores back to normal on fly-out
      const baseScreenOpacity = isHovered ? 1.0 : 0.85
      screenMatRef.current.opacity = isDimmed && !isSelected ? 0.0 : baseScreenOpacity * visibilityFactor
    }
  })

  return (
    <group
      ref={groupRef}
      position={initialPosition}
      quaternion={initialQuaternion}
      data-testid={`curved-video-panel-${video.id}`}
    >
      {/* Curved Screen Mesh: click and hover events isolated here for perfect hit detection */}
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
        <meshBasicMaterial
          ref={screenMatRef}
          map={texture}
          color={isHovered ? '#ffffff' : '#dddddd'}
          transparent
          opacity={isDimmed && !isSelected ? 0.08 : 0.85}
          side={THREE.DoubleSide}
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

      {/* Central Holographic Play Icon */}
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

      {/* Title Label: wraps across up to 2 lines, raycasting disabled to preserve tight hit target */}
      <group position={[0, -PANEL_HEIGHT / 2 - 0.10, 0]} visible={!isDimmed || isSelected} raycast={() => null}>
        <Text
          ref={textRef}
          font="/fonts/JetBrainsMono-Regular.ttf"
          fontSize={0.068}
          maxWidth={PANEL_WIDTH * 0.95}
          lineHeight={1.25}
          textAlign="center"
          color={isHovered ? highlightColorHex : themeColorHex}
          anchorX="center"
          anchorY="top"
          letterSpacing={0.04}
          fillOpacity={isHovered ? 1.0 : 0.75}
          raycast={() => null}
        >
          {displayTitle}
        </Text>
      </group>
    </group>
  )
}
