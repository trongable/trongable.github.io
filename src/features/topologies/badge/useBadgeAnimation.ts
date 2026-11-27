import type React from 'react'
import { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { DistanceMetric, CoordFrame } from '@/context/DebugDistanceContext'
import { scrambleGlyphs } from '@/utils/glyphUtils'
import { INITIAL_WIDTHS, ANGEL_FRAMES } from '@/features/topologies/badge/badgeConstants'
import {
  TelemetryScratch,
  computeBadgeCameraDistance,
  syncTelemetryLabel,
  pickRandomGlitchHex,
  applyTextBadgeTint,
} from '@/features/topologies/badge/badgeTelemetry'

interface UseBadgeAnimationOptions {
  label: string
  imageUrl?: string
  imageFrames?: string[]
  position?: [number, number, number] | THREE.Vector3
  scale: number
  opacity: number | React.MutableRefObject<number>
  normalizedDepth?: number
  isHovered: boolean
  isGlitching: boolean
  primaryColorHex: string
  highlightColorHex: string
  effectiveShowDistance: boolean
  effectiveMetric: DistanceMetric
  effectiveShowCoords: boolean
  effectiveCoordFrame: CoordFrame
  vertexTag?: string
}

/**
 * Encapsulates zero-allocation `useFrame` badge transforms, telemetry HUD formatting,
 * 15-frame turntable flipbook cycling, glyph scrambling, and explicit WebGL disposal.
 */
export function useBadgeAnimation({
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
}: UseBadgeAnimationOptions) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const distTextRef = useRef<any>(null)

  const sphereColor = useRef(new THREE.Color())
  const sphereWireColor = useRef(new THREE.Color())
  const distTimerRef = useRef(0)

  const [displayLabel, setDisplayLabel] = useState(label)
  const [boxWidth, setBoxWidth] = useState<number>(
    () => INITIAL_WIDTHS[label] || label.length * 0.08 + 0.14
  )

  const isImageBadge = Boolean(imageUrl || (imageFrames && imageFrames.length > 0))

  const baseBadgeColor = useMemo(() => new THREE.Color(primaryColorHex), [primaryColorHex])
  const highlightBadgeColor = useMemo(() => new THREE.Color(highlightColorHex), [highlightColorHex])
  const dimBadgeColor = useMemo(
    () => new THREE.Color(primaryColorHex).multiplyScalar(0.40),
    [primaryColorHex]
  )

  const worldPos = useRef(new THREE.Vector3())
  const telemetryScratch = useRef<TelemetryScratch>({
    viewPos: new THREE.Vector3(),
    originViewPos: new THREE.Vector3(),
    camDir: new THREE.Vector3(),
    toBadge: new THREE.Vector3(),
    lastDist: -1,
    lastX: -999,
    lastY: -999,
    lastZ: -999,
  })
  const dioramaColor = useRef(new THREE.Color())
  const floorColor = useRef(new THREE.Color())
  const accentColor = useRef(new THREE.Color())
  const glassColor = useRef(new THREE.Color())
  const frameIndexRef = useRef(0)
  const frameTimerRef = useRef(0)
  const wasGlitchedOrHoveredRef = useRef(false)

  const resolvedFrames = useMemo(() => {
    if (imageFrames && imageFrames.length > 0) return imageFrames
    if (label === 'angel' || (imageUrl && imageUrl.includes('angel'))) return ANGEL_FRAMES
    if (imageUrl) return [imageUrl]
    return []
  }, [imageFrames, imageUrl, label])

  const imageTextures = useMemo(() => {
    if (resolvedFrames.length === 0 || typeof window === 'undefined') return []
    const loader = new THREE.TextureLoader()
    return resolvedFrames.map((src) => {
      const tex = loader.load(src)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    })
  }, [resolvedFrames])

  // Explicit WebGL GPU memory cleanup
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

  // Cyber glyph swaps on hover and during glitch
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
  }, [isHovered, isGlitching, label, isImageBadge, effectiveShowDistance])

  useFrame(({ camera }, delta) => {
    if (!itemGroupRef.current) return

    if (position !== undefined) {
      if (Array.isArray(position)) {
        itemGroupRef.current.position.set(position[0], position[1], position[2])
      } else {
        itemGroupRef.current.position.copy(position)
      }
    }

    itemGroupRef.current.getWorldPosition(worldPos.current)
    const distToCamera = computeBadgeCameraDistance(
      camera,
      worldPos.current,
      effectiveMetric,
      telemetryScratch.current
    )

    // Normalized depth: 1.0 = closest foreground (~3.6 units), 0.0 = furthest background (~8.4 units)
    const computedDepth = THREE.MathUtils.clamp((8.4 - distToCamera) / 4.8, 0, 1)
    const currentDepth = typeof normalizedDepth === 'number' ? normalizedDepth : computedDepth

    const isGlitchedOrHovered = isGlitching || isHovered
    const hoverScaleMult = (isImageBadge || effectiveShowDistance) && isGlitchedOrHovered ? 1.12 : 1.0
    // Pure optical perspective scaling; Angel image badge is scaled to 75% base size
    const imageBaseScale = isImageBadge ? 0.75 : 1.0
    itemGroupRef.current.scale.setScalar(scale * imageBaseScale * hoverScaleMult)
    itemGroupRef.current.renderOrder = Math.round(currentDepth * 100)

    // Real-time debug distance telemetry update (throttled ~16 Hz, delta >= 0.01)
    if (effectiveShowDistance && distTextRef.current) {
      distTimerRef.current += delta
      if (distTimerRef.current >= 0.06) {
        distTimerRef.current = 0
        syncTelemetryLabel(
          distTextRef.current,
          camera,
          worldPos.current,
          distToCamera,
          effectiveMetric,
          effectiveShowCoords,
          effectiveCoordFrame,
          vertexTag,
          telemetryScratch.current
        )
      }
    }

    // Dynamic shearing and translation distortion (strictly upright, NO angular tilt for text)
    if (textGroupRef.current) {
      if (isImageBadge) {
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
        if (Math.random() > 0.30) {
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

    const alpha =
      typeof opacity === 'object' && opacity !== null && 'current' in opacity
        ? (opacity as React.MutableRefObject<number>).current
        : typeof opacity === 'number'
        ? opacity
        : 1

    // Distance Telemetry Probe Mode
    if (effectiveShowDistance) {
      if (sphereMaterialRef.current) {
        if (isGlitchedOrHovered && Math.random() > 0.45) {
          sphereColor.current.set(pickRandomGlitchHex())
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
        sphereWireColor.current.set(isGlitchedOrHovered ? highlightColorHex : baseBadgeColor)
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
        frameTimerRef.current += delta
        if (frameTimerRef.current >= 0.045) {
          frameTimerRef.current = 0
          frameIndexRef.current = (frameIndexRef.current + 1) % imageTextures.length
          if (imgMaterialRef.current && imageTextures[frameIndexRef.current]) {
            imgMaterialRef.current.map = imageTextures[frameIndexRef.current]
            imgMaterialRef.current.needsUpdate = true
          }
        }
      } else if (!isGlitchedOrHovered && wasGlitchedOrHoveredRef.current && imageTextures.length > 1) {
        const randomIndex = Math.floor(Math.random() * imageTextures.length)
        frameIndexRef.current = randomIndex
        frameTimerRef.current = 0
        if (imgMaterialRef.current && imageTextures[randomIndex]) {
          imgMaterialRef.current.map = imageTextures[randomIndex]
          imgMaterialRef.current.needsUpdate = true
        }
      }
      wasGlitchedOrHoveredRef.current = isGlitchedOrHovered

      if (imgMaterialRef.current) {
        imgMaterialRef.current.opacity = alpha
        imgMaterialRef.current.transparent = true
        imgMaterialRef.current.depthWrite = false
        imgMaterialRef.current.depthTest = true
        imgMaterialRef.current.color.set(
          isGlitchedOrHovered && Math.random() > 0.45 ? pickRandomGlitchHex() : '#ffffff'
        )
      }

      if (isGlitchedOrHovered && Math.random() > 0.45) {
        dioramaColor.current.set(pickRandomGlitchHex())
      } else if (isGlitchedOrHovered) {
        dioramaColor.current.set(highlightColorHex)
      } else {
        dioramaColor.current.lerpColors(dimBadgeColor, baseBadgeColor, currentDepth)
      }

      if (bgMaterialRef.current) {
        bgMaterialRef.current.opacity = alpha
        bgMaterialRef.current.transparent = alpha < 0.99
        bgMaterialRef.current.depthWrite = true
        bgMaterialRef.current.depthTest = true
        bgMaterialRef.current.color.copy(dioramaColor.current)
      }

      if (floorMaterialRef.current) {
        floorColor.current.copy(dioramaColor.current).multiplyScalar(0.78)
        floorMaterialRef.current.opacity = alpha
        floorMaterialRef.current.transparent = alpha < 0.99
        floorMaterialRef.current.depthWrite = true
        floorMaterialRef.current.depthTest = true
        floorMaterialRef.current.color.copy(floorColor.current)
      }

      if (accentMaterialRef.current) {
        accentColor.current.copy(isGlitchedOrHovered ? dioramaColor.current : highlightBadgeColor)
        accentMaterialRef.current.opacity = alpha
        accentMaterialRef.current.transparent = alpha < 0.99
        accentMaterialRef.current.depthWrite = false
        accentMaterialRef.current.depthTest = true
        accentMaterialRef.current.color.copy(accentColor.current)
      }

      if (glassMaterialRef.current) {
        glassColor.current.copy(dioramaColor.current)
        glassMaterialRef.current.opacity = alpha * 0.16
        glassMaterialRef.current.transparent = true
        glassMaterialRef.current.depthWrite = false
        glassMaterialRef.current.depthTest = true
        glassMaterialRef.current.color.copy(glassColor.current)
      }
      return
    }

    if (bgMaterialRef.current) {
      applyTextBadgeTint(
        bgMaterialRef.current,
        alpha,
        isGlitching,
        isHovered,
        highlightColorHex,
        dimBadgeColor,
        baseBadgeColor,
        currentDepth
      )
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
  })

  return {
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
  }
}
