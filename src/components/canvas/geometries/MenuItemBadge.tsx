import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'
import { useSonnyContainer, SonnyContainerStyle } from '@/context/SonnyContainerContext'
import { useDebugDistance, DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'
import { scrambleGlyphs } from '@/utils/glyphUtils'

const INITIAL_WIDTHS: Record<string, number> = {
  about: 0.48,
  more: 0.44,
  dchc: 0.41,
}

export const SONNY_FRAMES: string[] = [
  '/images/sonny.png',
  '/images/sonny/frame-01.png',
  '/images/sonny/frame-02.png',
  '/images/sonny/frame-03.png',
  '/images/sonny/frame-04.png',
  '/images/sonny/frame-05.png',
  '/images/sonny/frame-06.png',
  '/images/sonny/frame-07.png',
  '/images/sonny/frame-08.png',
  '/images/sonny/frame-09.png',
  '/images/sonny/frame-10.png',
  '/images/sonny/frame-11.png',
  '/images/sonny/frame-12.png',
  '/images/sonny/frame-13.png',
  '/images/sonny/frame-14.png',
]

export interface MenuItemBadgeProps {
  label: string
  path: string
  imageUrl?: string
  imageFrames?: string[]
  containerStyle?: SonnyContainerStyle
  position?: [number, number, number] | THREE.Vector3
  scale?: number
  opacity?: number | React.MutableRefObject<number>
  normalizedDepth?: number // 0 (furthest back) to 1 (closest front)
  isHovered: boolean
  isExpanded: boolean
  isGlitching?: boolean
  theme?: ThemeColor
  showDistance?: boolean
  distanceMetric?: DistanceMetric
  showCoordinates?: boolean
  coordFrame?: CoordFrame
  vertexTag?: string
  onSelect: (path: string) => void
  onHover: (hover: boolean) => void
}

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
  const { containerStyle: globalContainerStyle } = useSonnyContainer()
  const effectiveContainer: SonnyContainerStyle = containerStyle ?? globalContainerStyle ?? 'capsule'
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

  const itemGroupRef = useRef<THREE.Group>(null)
  const textGroupRef = useRef<THREE.Group>(null)
  const bgMeshRef = useRef<THREE.Mesh>(null)
  const bgMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const floorMeshRef = useRef<THREE.Mesh>(null)
  const floorMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const accentMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const glassMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const imgMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const sphereMeshRef = useRef<THREE.Mesh>(null)
  const sphereMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const sphereWireMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const sphereColor = useRef(new THREE.Color())
  const sphereWireColor = useRef(new THREE.Color())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const distTextRef = useRef<any>(null)
  const distTimerRef = useRef(0)
  const lastDistRef = useRef(-1)
  const lastXRef = useRef(-999)
  const lastYRef = useRef(-999)
  const lastZRef = useRef(-999)
  const [displayLabel, setDisplayLabel] = useState(label)
  const [boxWidth, setBoxWidth] = useState<number>(() => INITIAL_WIDTHS[label] || label.length * 0.08 + 0.14)

  const isImageBadge = Boolean(imageUrl || (imageFrames && imageFrames.length > 0))

  const primaryColorHex = theme?.primary ?? '#e2f872'
  const highlightColorHex = theme?.highlight ?? '#f5ff9e'

  const baseBadgeColor = useMemo(() => new THREE.Color(primaryColorHex), [primaryColorHex])
  const highlightBadgeColor = useMemo(() => new THREE.Color(highlightColorHex), [highlightColorHex])
  const dimBadgeColor = useMemo(
    () => new THREE.Color(primaryColorHex).multiplyScalar(0.40),
    [primaryColorHex]
  )

  const worldPos = useRef(new THREE.Vector3())
  const viewPos = useRef(new THREE.Vector3())
  const originViewPos = useRef(new THREE.Vector3())
  const camDir = useRef(new THREE.Vector3())
  const toBadge = useRef(new THREE.Vector3())
  const dioramaColor = useRef(new THREE.Color())
  const floorColor = useRef(new THREE.Color())
  const accentColor = useRef(new THREE.Color())
  const glassColor = useRef(new THREE.Color())
  const frameIndexRef = useRef(0)
  const frameTimerRef = useRef(0)
  const wasGlitchedOrHoveredRef = useRef(false)

  // Resolve frame sources for image-based badges
  const resolvedFrames = useMemo(() => {
    if (imageFrames && imageFrames.length > 0) return imageFrames
    if (label === 'sonny' || (imageUrl && imageUrl.includes('sonny'))) return SONNY_FRAMES
    if (imageUrl) return [imageUrl]
    return []
  }, [imageFrames, imageUrl, label])

  // Preload textures for flipbook animation
  const imageTextures = useMemo(() => {
    if (resolvedFrames.length === 0) return []
    if (typeof window === 'undefined') return []
    const loader = new THREE.TextureLoader()
    return resolvedFrames.map((src) => {
      const tex = loader.load(src)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    })
  }, [resolvedFrames])

  // WebGL GPU memory cleanup
  useEffect(() => {
    return () => {
      bgMaterialRef.current?.dispose()
      floorMaterialRef.current?.dispose()
      accentMaterialRef.current?.dispose()
      glassMaterialRef.current?.dispose()
      imgMaterialRef.current?.dispose()
      sphereMaterialRef.current?.dispose()
      sphereWireMaterialRef.current?.dispose()
      imageTextures.forEach((tex) => tex.dispose())
    }
  }, [imageTextures])

  // Dynamic bounding measurement on font sync
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSync = (troika: any) => {
    if (troika?.geometry?.boundingBox) {
      const { min, max } = troika.geometry.boundingBox
      const measured = max.x - min.x
      if (measured > 0) {
        setBoxWidth(measured + 0.12)
      }
    }
  }

  // Glyph Scrambling (Dimension 6): cyber glyph swaps on hover and during glitch
  useEffect(() => {
    if (isImageBadge || effectiveShowDistance) return
    if (!isHovered && !isGlitching) {
      setDisplayLabel(label)
      return
    }

    const intervalTime = isGlitching ? 60 : 90

    const interval = setInterval(() => {
      if (isGlitching) {
        const count = Math.min(label.length, Math.floor(Math.random() * 3) + 1)
        setDisplayLabel(scrambleGlyphs(label, count))
      } else if (isHovered) {
        if (Math.random() < 0.30) {
          setDisplayLabel(label)
        } else {
          const count = label.length > 4 && Math.random() < 0.35 ? 2 : 1
          setDisplayLabel(scrambleGlyphs(label, count))
        }
      }
    }, intervalTime)

    return () => {
      clearInterval(interval)
      setDisplayLabel(label)
    }
  }, [isHovered, isGlitching, label, isImageBadge])

  useFrame(({ camera }, delta) => {
    if (!itemGroupRef.current) return

    // Position and scale
    if (position !== undefined) {
      if (Array.isArray(position)) {
        itemGroupRef.current.position.set(position[0], position[1], position[2])
      } else {
        itemGroupRef.current.position.copy(position)
      }
    }

    itemGroupRef.current.getWorldPosition(worldPos.current)
    let distToCamera = 5.0
    if (camera?.position) {
      if (effectiveMetric === 'depth' && typeof camera.getWorldDirection === 'function') {
        camera.getWorldDirection(camDir.current)
        toBadge.current.subVectors(worldPos.current, camera.position)
        distToCamera = Math.max(0.1, toBadge.current.dot(camDir.current))
      } else if (typeof camera.position.distanceTo === 'function') {
        distToCamera = camera.position.distanceTo(worldPos.current)
      }
    }

    // Normalized depth: 1.0 = closest foreground, 0.0 = furthest background
    // Scene geometry bounds: closest items ~3.6 units, furthest items ~8.4 units
    const computedDepth = THREE.MathUtils.clamp((8.4 - distToCamera) / 4.8, 0, 1)
    const currentDepth = typeof normalizedDepth === 'number' ? normalizedDepth : computedDepth

    const isGlitchedOrHovered = isGlitching || isHovered
    const hoverScaleMult = (isImageBadge || effectiveShowDistance) && isGlitchedOrHovered ? 1.12 : 1.0
    // Option 2 (Pure Optical): 100% of scaling is driven by the camera's perspective projection
    // Sonny image badge is scaled to 75% base size per design requirements
    const imageBaseScale = isImageBadge ? 0.75 : 1.0
    const depthScale = scale * imageBaseScale * hoverScaleMult
    itemGroupRef.current.scale.setScalar(depthScale)
    itemGroupRef.current.renderOrder = Math.round(currentDepth * 100)

    // Real-time debug distance telemetry update (throttled ~16 Hz, delta >= 0.01)
    if (effectiveShowDistance && distTextRef.current) {
      distTimerRef.current += delta
      if (distTimerRef.current >= 0.06) {
        distTimerRef.current = 0

        // Compute coordinate values based on active coordinate frame
        let xVal = worldPos.current.x
        let yVal = worldPos.current.y
        let zVal = worldPos.current.z

        if (effectiveCoordFrame === 'view' && camera?.matrixWorldInverse) {
          viewPos.current.copy(worldPos.current).applyMatrix4(camera.matrixWorldInverse)
          originViewPos.current.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse)
          xVal = viewPos.current.x
          yVal = viewPos.current.y
          // Relative to scene center along camera line-of-sight: +Z towards viewer, -Z away into screen
          zVal = viewPos.current.z - originViewPos.current.z
        }

        const distDelta = Math.abs(distToCamera - lastDistRef.current)
        const xDelta = Math.abs(xVal - lastXRef.current)
        const yDelta = Math.abs(yVal - lastYRef.current)
        const zDelta = Math.abs(zVal - lastZRef.current)

        if (
          distDelta >= 0.01 ||
          (effectiveShowCoords && (xDelta >= 0.01 || yDelta >= 0.01 || zDelta >= 0.01))
        ) {
          lastDistRef.current = distToCamera
          lastXRef.current = xVal
          lastYRef.current = yVal
          lastZRef.current = zVal

          const prefix = effectiveMetric === 'depth' ? 'depth:' : 'd:'
          const tagPrefix = vertexTag ? `[${vertexTag}] ` : ''
          const distStr = `${tagPrefix}${prefix} ${distToCamera.toFixed(2)}`
          if (effectiveShowCoords) {
            const xStr = xVal.toFixed(2)
            const yStr = yVal.toFixed(2)
            const zStr = effectiveCoordFrame === 'view' && zVal > 0.005 ? `+${zVal.toFixed(2)}` : zVal.toFixed(2)
            distTextRef.current.text = `${distStr}\nx: ${xStr}  y: ${yStr}  z: ${zStr}`
          } else {
            distTextRef.current.text = distStr
          }
          if (typeof distTextRef.current.sync === 'function') {
            distTextRef.current.sync()
          }
        }
      }
    }

    // Dynamic shearing and translation distortion (strictly upright, NO angular tilt for text)
    if (textGroupRef.current) {
      if (isImageBadge) {
        // Image badge: identical micro-twitch jitter on hover and glitch
        if (isGlitchedOrHovered) {
          textGroupRef.current.position.set(
            THREE.MathUtils.randFloatSpread(0.04),
            THREE.MathUtils.randFloatSpread(0.02),
            0
          )
        } else {
          textGroupRef.current.position.set(0, 0, 0)
        }
        textGroupRef.current.scale.set(1, 1, 1)
      } else if (isGlitching) {
        textGroupRef.current.position.set(
          THREE.MathUtils.randFloatSpread(0.19),
          THREE.MathUtils.randFloatSpread(0.08),
          0
        )
        textGroupRef.current.rotation.set(0, 0, 0)
        textGroupRef.current.scale.set(
          1 + THREE.MathUtils.randFloatSpread(0.75),
          1 + THREE.MathUtils.randFloatSpread(0.35),
          1
        )
      } else if (isHovered) {
        const shouldTwitch = Math.random() > 0.30
        if (shouldTwitch) {
          textGroupRef.current.position.set(
            THREE.MathUtils.randFloatSpread(0.038),
            THREE.MathUtils.randFloatSpread(0.016),
            0
          )
          textGroupRef.current.scale.set(
            1 + THREE.MathUtils.randFloatSpread(0.24),
            1 + THREE.MathUtils.randFloatSpread(0.10),
            1
          )
        } else {
          textGroupRef.current.position.set(0, 0, 0)
          textGroupRef.current.scale.set(1, 1, 1)
        }
        textGroupRef.current.rotation.set(0, 0, 0)
      } else {
        textGroupRef.current.position.set(0, 0, 0)
        textGroupRef.current.rotation.set(0, 0, 0)
        textGroupRef.current.scale.set(1, 1, 1)
      }
    }

    // 100% Opaque Background (No transparency when expanded)
    const resolvedOpacity =
      typeof opacity === 'object' && opacity !== null && 'current' in opacity
        ? (opacity as React.MutableRefObject<number>).current
        : typeof opacity === 'number'
        ? opacity
        : 1
    const alpha = resolvedOpacity

    // Distance Telemetry Probe Mode: updates sphere materials in-place and bypasses badge rendering
    if (effectiveShowDistance) {
      if (sphereMaterialRef.current) {
        if (isGlitchedOrHovered && Math.random() > 0.45) {
          sphereColor.current.set(Math.random() > 0.5 ? '#00f0ff' : '#ff0055')
        } else if (isGlitchedOrHovered) {
          sphereColor.current.set(highlightColorHex)
        } else {
          sphereColor.current.lerpColors(dimBadgeColor, baseBadgeColor, currentDepth)
        }
        sphereMaterialRef.current.color.copy(sphereColor.current)
        sphereMaterialRef.current.opacity = alpha * (isHovered ? 0.65 : 0.35)
        sphereMaterialRef.current.transparent = true
        sphereMaterialRef.current.depthWrite = false
        sphereMaterialRef.current.depthTest = true
      }

      if (sphereWireMaterialRef.current) {
        if (isGlitchedOrHovered) {
          sphereWireColor.current.set(highlightColorHex)
        } else {
          sphereWireColor.current.copy(baseBadgeColor)
        }
        sphereWireMaterialRef.current.color.copy(sphereWireColor.current)
        sphereWireMaterialRef.current.opacity = alpha * (isHovered ? 0.50 : 0.25)
        sphereWireMaterialRef.current.transparent = true
        sphereWireMaterialRef.current.depthWrite = false
        sphereWireMaterialRef.current.depthTest = true
      }
      return
    }

    if (isImageBadge) {
      // 15-Frame Turntable Flipbook Animation: unified 45ms rate on hover and glitch
      if (isGlitchedOrHovered && imageTextures.length > 1) {
        const cycleInterval = 0.045
        frameTimerRef.current += delta
        if (frameTimerRef.current >= cycleInterval) {
          frameTimerRef.current = 0
          frameIndexRef.current = (frameIndexRef.current + 1) % imageTextures.length
          if (imgMaterialRef.current && imageTextures[frameIndexRef.current]) {
            imgMaterialRef.current.map = imageTextures[frameIndexRef.current]
            imgMaterialRef.current.needsUpdate = true
          }
        }
      } else if (!isGlitchedOrHovered && wasGlitchedOrHoveredRef.current && imageTextures.length > 1) {
        // When glitch or hover effect completes, choose a random frame from the flipbook
        const randomIndex = Math.floor(Math.random() * imageTextures.length)
        frameIndexRef.current = randomIndex
        frameTimerRef.current = 0
        if (imgMaterialRef.current && imageTextures[randomIndex]) {
          imgMaterialRef.current.map = imageTextures[randomIndex]
          imgMaterialRef.current.needsUpdate = true
        }
      }
      wasGlitchedOrHoveredRef.current = isGlitchedOrHovered

      // Character sprite material: identical chromatic flashing on hover and glitch
      if (imgMaterialRef.current) {
        imgMaterialRef.current.opacity = alpha
        imgMaterialRef.current.transparent = true
        imgMaterialRef.current.depthWrite = false
        imgMaterialRef.current.depthTest = true

        if (isGlitchedOrHovered && Math.random() > 0.45) {
          imgMaterialRef.current.color.set(Math.random() > 0.5 ? '#00f0ff' : '#ff0055')
        } else {
          imgMaterialRef.current.color.set('#ffffff')
        }
      }

      // Compute unified diorama color (zero allocations in useFrame)
      if (isGlitchedOrHovered && Math.random() > 0.45) {
        dioramaColor.current.set(Math.random() > 0.5 ? '#00f0ff' : '#ff0055')
      } else if (isGlitchedOrHovered) {
        dioramaColor.current.set(highlightColorHex)
      } else {
        dioramaColor.current.lerpColors(dimBadgeColor, baseBadgeColor, currentDepth)
      }

      // L-Shaped Vertical Back Wall Material
      if (bgMaterialRef.current) {
        bgMaterialRef.current.opacity = alpha
        bgMaterialRef.current.transparent = alpha < 0.99
        bgMaterialRef.current.depthWrite = true
        bgMaterialRef.current.depthTest = true
        bgMaterialRef.current.color.copy(dioramaColor.current)
      }

      // Base / Pedestal Floor Material: shaded distinctly at 0.78 for clear 3D depth
      if (floorMaterialRef.current) {
        floorColor.current.copy(dioramaColor.current).multiplyScalar(0.78)
        floorMaterialRef.current.opacity = alpha
        floorMaterialRef.current.transparent = alpha < 0.99
        floorMaterialRef.current.depthWrite = true
        floorMaterialRef.current.depthTest = true
        floorMaterialRef.current.color.copy(floorColor.current)
      }

      // Accent Wireframe Cages, Torus Rings, Crystal Lattice
      if (accentMaterialRef.current) {
        accentColor.current.copy(
          isGlitchedOrHovered ? dioramaColor.current : highlightBadgeColor
        )
        accentMaterialRef.current.opacity = alpha
        accentMaterialRef.current.transparent = alpha < 0.99
        accentMaterialRef.current.depthWrite = false
        accentMaterialRef.current.depthTest = true
        accentMaterialRef.current.color.copy(accentColor.current)
      }

      // Translucent Capsule Shell, Glass Vitrine Facets, Crystal Faces
      if (glassMaterialRef.current) {
        glassColor.current.copy(dioramaColor.current)
        glassMaterialRef.current.opacity = alpha * 0.16
        glassMaterialRef.current.transparent = true
        glassMaterialRef.current.depthWrite = false
        glassMaterialRef.current.depthTest = true
        glassMaterialRef.current.color.copy(glassColor.current)
      }
    } else {
      if (bgMaterialRef.current) {
        bgMaterialRef.current.opacity = alpha
        bgMaterialRef.current.transparent = alpha < 0.99
        bgMaterialRef.current.depthWrite = true
        bgMaterialRef.current.depthTest = true

        if (isGlitching && Math.random() > 0.45) {
          bgMaterialRef.current.color.set(Math.random() > 0.5 ? '#00f0ff' : '#ff0055')
        } else if (isHovered) {
          const flick = Math.random()
          if (flick < 0.10) {
            bgMaterialRef.current.color.set('#00f0ff')
          } else if (flick < 0.16) {
            bgMaterialRef.current.color.set('#ff0055')
          } else if (flick < 0.24) {
            bgMaterialRef.current.color.set('#ffffff')
          } else {
            bgMaterialRef.current.color.set(highlightColorHex)
          }
        } else {
          bgMaterialRef.current.color.lerpColors(dimBadgeColor, baseBadgeColor, currentDepth)
        }
      }

      if (textRef.current) {
        textRef.current.fillOpacity = alpha
        if (textRef.current.color !== '#1c1b22') {
          textRef.current.color = '#1c1b22'
        }
        const mat = textRef.current._derivedMaterial || textRef.current.material
        if (mat && mat.toneMapped !== false) {
          mat.toneMapped = false
        }
      }
    }
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
            {/* 1. Translucent 3D Probe Sphere */}
            <mesh
              ref={sphereMeshRef}
              data-testid="translucent-sphere"
            >
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

            {/* 2. Geometric Wireframe Outer Lattice */}
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

            {/* 3. Floating Distance & Coordinate Telemetry Label */}
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
            {/* 1. L-Shaped Diorama Container */}
            {effectiveContainer === 'diorama' && (
              <>
                {/* Back Wall [0.39, 0.69] */}
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

                {/* Square Floor Base [0.39, 0.39] */}
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
            )}

            {/* 2. Floating Circular Hologram Pedestal */}
            {effectiveContainer === 'pedestal' && (
              <>
                {/* Base Projector Disc */}
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
                {/* Glowing Outer Emitter Ring */}
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
            )}

            {/* 3. Sci-Fi Stasis Cryo-Pod Capsule */}
            {effectiveContainer === 'capsule' && (
              <>
                {/* Base Cap */}
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
                {/* Top Cap */}
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
                {/* Translucent Glass Cylinder Shell */}
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
                {/* Lower & Upper Neon Ring Brackets */}
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
            )}

            {/* 4. Orthogonal Neon Wireframe Vitrine */}
            {effectiveContainer === 'wirebox' && (
              <>
                {/* Floor Platform */}
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
                {/* Translucent Glass Vitrine Enclosure */}
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
                {/* Glowing Neon Wireframe Cage */}
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
            )}

            {/* 5. Polyhedral Origami Crystal Cage */}
            {effectiveContainer === 'crystal' && (
              <>
                {/* Small Facet Disc Mount */}
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
                {/* Translucent Crystalline Facet Core */}
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
                {/* Glowing Wireframe Polyhedral Lattice */}
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
            )}

            {/* 6. none: renders only the character sprite below */}

            {/* Character Sprite Plane [0.39, 0.69] */}
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
          {/* Rectangular Toxic Neon Background Badge */}
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

          {/* Inverted Dark Space Text Cutout */}
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
