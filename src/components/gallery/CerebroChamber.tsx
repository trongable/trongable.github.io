import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CerebroSphereWall } from './CerebroSphereWall'
import { CurvedMediaPanel } from './CurvedMediaPanel'
import { GalleryItem, GALLERY_DATA } from './galleryData'
import { GalleryChamberParams, DEFAULT_GALLERY_CHAMBER_PARAMS } from './galleryTunerConfig'
import { useTheme } from '@/context/ThemeContext'

interface ChamberCameraControllerProps {
  isDimmed: boolean
  isDraggingRef: React.MutableRefObject<boolean>
  dragDeltaRef: React.MutableRefObject<{ x: number; y: number }>
  releaseVelocityRef: React.MutableRefObject<{ vx: number; vy: number }>
  wheelDeltaRef: React.MutableRefObject<{ x: number; y: number }>
  params: GalleryChamberParams
}

const EPSILON = 0.0001
const scratchLookTarget = new THREE.Vector3()

const ChamberCameraController: React.FC<ChamberCameraControllerProps> = ({
  isDimmed,
  isDraggingRef,
  dragDeltaRef,
  releaseVelocityRef,
  wheelDeltaRef,
  params,
}) => {
  const { camera, viewport } = useThree()

  const currentYaw = useRef<number>(0)
  const currentPitch = useRef<number>(0)
  const targetYaw = useRef<number>(0)
  const targetPitch = useRef<number>(0)
  const velocityYaw = useRef<number>(0)
  const velocityPitch = useRef<number>(0)

  useFrame((_, delta) => {
    // 1. Process mouse drag or touch screen delta
    if (isDraggingRef.current) {
      targetYaw.current += dragDeltaRef.current.x
      targetPitch.current += dragDeltaRef.current.y
      dragDeltaRef.current.x = 0
      dragDeltaRef.current.y = 0

      velocityYaw.current = 0
      velocityPitch.current = 0
    } else {
      // Pick up any committed fling release velocity
      if (releaseVelocityRef.current.vx !== 0 || releaseVelocityRef.current.vy !== 0) {
        velocityYaw.current = releaseVelocityRef.current.vx
        velocityPitch.current = releaseVelocityRef.current.vy
        releaseVelocityRef.current.vx = 0
        releaseVelocityRef.current.vy = 0
      }

      // Quench inertial velocity immediately when overlay is active / dimmed, or fling inertia disabled
      if (isDimmed || params.flingInertia <= 0) {
        velocityYaw.current = 0
        velocityPitch.current = 0
      }

      // Inertial release damping with configurable fling inertia
      targetYaw.current += velocityYaw.current * delta
      targetPitch.current += velocityPitch.current * delta

      const decayFactor = Math.pow(0.88, delta * 60)
      velocityYaw.current *= decayFactor
      velocityPitch.current *= decayFactor

      if (Math.abs(velocityYaw.current) < EPSILON) velocityYaw.current = 0
      if (Math.abs(velocityPitch.current) < EPSILON) velocityPitch.current = 0
    }

    // 2. Process two-finger scroll / mouse wheel delta
    if (wheelDeltaRef.current.x !== 0 || wheelDeltaRef.current.y !== 0) {
      targetYaw.current += wheelDeltaRef.current.x
      targetPitch.current += wheelDeltaRef.current.y
      wheelDeltaRef.current.x = 0
      wheelDeltaRef.current.y = 0
    }

    // In portrait orientation (narrow horizontal FOV), adaptively expand maxYaw
    // so users can comfortably sweep the camera past the outermost media panels
    const isPortrait = viewport.width < viewport.height
    const effectiveMaxYawDeg = isPortrait
      ? Math.max(params.maxYawDeg, (params.arcDegrees / 2) + 18)
      : params.maxYawDeg
    const maxYaw = THREE.MathUtils.degToRad(effectiveMaxYawDeg)
    const maxPitch = THREE.MathUtils.degToRad(params.maxPitchDeg)

    // Clamp yaw and pitch within calibrated bounds
    targetYaw.current = THREE.MathUtils.clamp(targetYaw.current, -maxYaw, maxYaw)
    targetPitch.current = THREE.MathUtils.clamp(targetPitch.current, -maxPitch, maxPitch)

    // Direct 1:1 tracking during active drag; snappy responsive damping during release inertia & wheel panning
    if (isDraggingRef.current) {
      currentYaw.current = targetYaw.current
      currentPitch.current = targetPitch.current
    } else {
      currentYaw.current = THREE.MathUtils.lerp(currentYaw.current, targetYaw.current, 0.18)
      currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch.current, 0.18)
    }

    // Camera observer position in chamber center
    camera.position.set(0, 0, 0.35)

    // Direction calculation
    const yaw = currentYaw.current
    const pitch = currentPitch.current
    const cosPitch = Math.cos(pitch)

    scratchLookTarget.set(
      params.sphereRadius * cosPitch * Math.sin(yaw),
      params.sphereRadius * Math.sin(pitch),
      -params.sphereRadius * cosPitch * Math.cos(yaw)
    )

    camera.lookAt(scratchLookTarget)
    if (typeof camera.updateMatrixWorld === 'function') {
      camera.updateMatrixWorld()
    }
  })

  return null
}

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

  const handleSelect = onSelectItem ?? onSelectVideo ?? (() => { })

  const isDraggingRef = useRef(false)
  const isPointerDownRef = useRef(false)
  const startPointerPos = useRef({ x: 0, y: 0 })
  const lastPointerPos = useRef({ x: 0, y: 0 })
  const dragDeltaRef = useRef({ x: 0, y: 0 })
  const wheelDeltaRef = useRef({ x: 0, y: 0 })
  const releaseVelocityRef = useRef({ vx: 0, vy: 0 })
  const lastMoveTimeRef = useRef(0)
  const pointerVelocityRef = useRef({ vx: 0, vy: 0 })

  // Page visibility 0% GPU sleep management
  const [isTabVisible, setIsTabVisible] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState !== 'hidden')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Universal Click & Drag Panning (holding down click and dragging mouse pans from anywhere)
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true
    isDraggingRef.current = false
    startPointerPos.current = { x: e.clientX, y: e.clientY }
    lastPointerPos.current = { x: e.clientX, y: e.clientY }
    lastMoveTimeRef.current = performance.now()
    pointerVelocityRef.current = { vx: 0, vy: 0 }
    releaseVelocityRef.current = { vx: 0, vy: 0 }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return

    const totalDist = Math.hypot(
      e.clientX - startPointerPos.current.x,
      e.clientY - startPointerPos.current.y
    )

    // Drag threshold of 4px separates intentional pans from stationary clicks
    if (totalDist > 4) {
      isDraggingRef.current = true
    }

    if (!isDraggingRef.current) return

    const now = performance.now()
    const dt = Math.max((now - lastMoveTimeRef.current) / 1000, 0.008)
    lastMoveTimeRef.current = now

    const dx = e.clientX - lastPointerPos.current.x
    const dy = e.clientY - lastPointerPos.current.y

    const w = window.innerWidth || 1280
    const h = window.innerHeight || 800
    const aspect = w / h

    // Exact 1:1 camera FOV angular derivation
    const tanHalfFovY = Math.tan(THREE.MathUtils.degToRad(23))
    const fovY = THREE.MathUtils.degToRad(46)
    const fovX = 2 * Math.atan(tanHalfFovY * aspect)

    // Moving finger/mouse right pans camera left (sweeps world right) scaled by dragMultiplier
    const sensitivity = params.panSensitivity * params.dragMultiplier
    const deltaYaw = -(dx / w) * fovX * sensitivity
    const deltaPitch = (dy / h) * fovY * sensitivity

    dragDeltaRef.current.x += deltaYaw
    dragDeltaRef.current.y += deltaPitch

    // Moving average velocity estimation for smooth, responsive flings
    const instVx = deltaYaw / dt
    const instVy = deltaPitch / dt
    pointerVelocityRef.current.vx = pointerVelocityRef.current.vx * 0.35 + instVx * 0.65
    pointerVelocityRef.current.vy = pointerVelocityRef.current.vy * 0.35 + instVy * 0.65

    lastPointerPos.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      const now = performance.now()
      // If lifted within 80ms of motion, commit fling velocity scaled by flingInertia
      if (now - lastMoveTimeRef.current < 80 && params.flingInertia > 0) {
        releaseVelocityRef.current = {
          vx: pointerVelocityRef.current.vx * params.flingInertia,
          vy: pointerVelocityRef.current.vy * params.flingInertia,
        }
      } else {
        releaseVelocityRef.current = { vx: 0, vy: 0 }
      }
    }
    pointerVelocityRef.current = { vx: 0, vy: 0 }
    isPointerDownRef.current = false
    isDraggingRef.current = false
  }

  // Two-Finger Scrolling & Wheel Gestures calibrated to 1:1 input to output
  const handleWheel = (e: React.WheelEvent) => {
    if (isDimmed) return

    const w = window.innerWidth || 1280
    const h = window.innerHeight || 800
    const aspect = w / h

    const tanHalfFovY = Math.tan(THREE.MathUtils.degToRad(23))
    const fovY = THREE.MathUtils.degToRad(46)
    const fovX = 2 * Math.atan(tanHalfFovY * aspect)

    // Normalize deltaMode: 0 is pixels, 1 is lines (~16px), 2 is pages (~h px)
    const deltaModeMult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? h : 1
    const dx = e.deltaX * deltaModeMult
    const dy = e.deltaY * deltaModeMult

    // Exact 1:1 input-to-output mapping matching drag gestures
    const deltaYaw = (dx / w) * fovX * params.panSensitivity
    const deltaPitch = -(dy / h) * fovY * params.panSensitivity

    wheelDeltaRef.current.x += deltaYaw
    wheelDeltaRef.current.y += deltaPitch
  }

  return (
    <div
      data-testid="cerebro-chamber-container"
      className="relative w-full h-full min-h-dvh flex items-center justify-center overflow-hidden touch-none select-none bg-[#0c0b10]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      <Canvas
        camera={{ position: [0, 0, 0.35], fov: 46 }}
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

        {/* Camera controller with touch, click-drag, and wheel panning */}
        <ChamberCameraController
          isDimmed={isDimmed}
          isDraggingRef={isDraggingRef}
          dragDeltaRef={dragDeltaRef}
          releaseVelocityRef={releaseVelocityRef}
          wheelDeltaRef={wheelDeltaRef}
          params={params}
        />

        {/* Ambient lighting matching active theme palette */}
        <ambientLight intensity={isDimmed ? 0.05 : 0.4} color={currentTheme.primary} />
        <pointLight position={[0, 0, 0]} intensity={isDimmed ? 0.2 : 1.2} color={currentTheme.highlight} distance={8} />

        {/* Inverted Sphere Shell */}
        <CerebroSphereWall
          radius={params.sphereRadius + 0.3}
          isDimmed={isDimmed}
          dimIntensity={params.dimIntensity}
          particleCount={params.particleCount}
        />

        {/* All Curved Media Panels along the Spherical Wall */}
        {items.map((item) => (
          <CurvedMediaPanel
            key={item.id}
            video={item}
            isDimmed={isDimmed}
            isSelected={currentSelected?.id === item.id}
            thumbnailScale={params.thumbnailScale}
            transitSpeed={params.transitSpeed}
            sphereRadius={params.sphereRadius}
            arcDegrees={params.arcDegrees}
            rowSeparation={params.rowSeparation}
            onSelect={handleSelect}
          />
        ))}
      </Canvas>
    </div>
  )
}
