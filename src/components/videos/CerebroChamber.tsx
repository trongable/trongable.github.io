import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CerebroSphereWall } from './CerebroSphereWall'
import { CurvedVideoPanel } from './CurvedVideoPanel'
import { VideoItem, VIDEOS_DATA } from './videoData'
import { VideoChamberParams, DEFAULT_VIDEO_CHAMBER_PARAMS } from './videoTunerConfig'
import { useTheme } from '@/context/ThemeContext'

interface ChamberCameraControllerProps {
  isDimmed: boolean
  isDraggingRef: React.MutableRefObject<boolean>
  dragDeltaRef: React.MutableRefObject<{ x: number; y: number }>
  wheelDeltaRef: React.MutableRefObject<{ x: number; y: number }>
  params: VideoChamberParams
}

const EPSILON = 0.0001
const scratchLookTarget = new THREE.Vector3()

const ChamberCameraController: React.FC<ChamberCameraControllerProps> = ({
  isDimmed,
  isDraggingRef,
  dragDeltaRef,
  wheelDeltaRef,
  params,
}) => {
  const { camera } = useThree()

  const currentYaw = useRef<number>(0)
  const currentPitch = useRef<number>(0)
  const targetYaw = useRef<number>(0)
  const targetPitch = useRef<number>(0)
  const velocityYaw = useRef<number>(0)
  const velocityPitch = useRef<number>(0)

  const maxYaw = THREE.MathUtils.degToRad(params.maxYawDeg)
  const maxPitch = THREE.MathUtils.degToRad(params.maxPitchDeg)

  useFrame((_, delta) => {
    // 1. Process mouse drag or touch screen delta
    if (isDraggingRef.current) {
      targetYaw.current += dragDeltaRef.current.x
      targetPitch.current += dragDeltaRef.current.y

      velocityYaw.current = dragDeltaRef.current.x / Math.max(delta, 0.016)
      velocityPitch.current = dragDeltaRef.current.y / Math.max(delta, 0.016)

      dragDeltaRef.current.x = 0
      dragDeltaRef.current.y = 0
    } else {
      // Quench inertial velocity immediately when theater is active / dimmed
      if (isDimmed) {
        velocityYaw.current = 0
        velocityPitch.current = 0
      }

      // Inertial release damping
      targetYaw.current += velocityYaw.current * (delta * 0.35)
      targetPitch.current += velocityPitch.current * (delta * 0.35)

      velocityYaw.current *= Math.pow(0.85, delta * 60)
      velocityPitch.current *= Math.pow(0.85, delta * 60)

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

    // Clamp yaw and pitch within calibrated bounds
    targetYaw.current = THREE.MathUtils.clamp(targetYaw.current, -maxYaw, maxYaw)
    targetPitch.current = THREE.MathUtils.clamp(targetPitch.current, -maxPitch, maxPitch)

    // Snappy responsive damping
    currentYaw.current = THREE.MathUtils.lerp(currentYaw.current, targetYaw.current, 0.18)
    currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch.current, 0.18)

    // Camera observer position on catwalk
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
  activeVideo: VideoItem | null
  selectedVideo?: VideoItem | null
  params?: VideoChamberParams
  onSelectVideo: (video: VideoItem) => void
}

export const CerebroChamber: React.FC<CerebroChamberProps> = ({
  activeVideo,
  selectedVideo,
  params = DEFAULT_VIDEO_CHAMBER_PARAMS,
  onSelectVideo,
}) => {
  const { currentTheme } = useTheme()
  const currentSelected = selectedVideo ?? activeVideo
  const isDimmed = Boolean(currentSelected)

  const isDraggingRef = useRef(false)
  const isPointerDownRef = useRef(false)
  const startPointerPos = useRef({ x: 0, y: 0 })
  const lastPointerPos = useRef({ x: 0, y: 0 })
  const dragDeltaRef = useRef({ x: 0, y: 0 })
  const wheelDeltaRef = useRef({ x: 0, y: 0 })

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

    const dx = e.clientX - lastPointerPos.current.x
    const dy = e.clientY - lastPointerPos.current.y

    const w = window.innerWidth || 1280
    const h = window.innerHeight || 800
    const aspect = w / h

    // Exact 1:1 camera FOV angular derivation
    // vertical fov = 46 deg -> half fov = 23 deg
    const tanHalfFovY = Math.tan(THREE.MathUtils.degToRad(23))
    const fovY = THREE.MathUtils.degToRad(46)
    const fovX = 2 * Math.atan(tanHalfFovY * aspect)

    // Moving finger/mouse right pans camera left (sweeps world right)
    // Scaled by 2.2x so single-point touchscreen and mouse drag move as fast as 2-finger wheel gestures
    const sensitivity = 2.2 * params.panSensitivity
    const deltaYaw = -(dx / w) * fovX * sensitivity
    const deltaPitch = (dy / h) * fovY * sensitivity

    dragDeltaRef.current.x += deltaYaw
    dragDeltaRef.current.y += deltaPitch

    lastPointerPos.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = () => {
    isPointerDownRef.current = false
    isDraggingRef.current = false
  }

  // Two-Finger Scrolling & Wheel Gestures (vertical movement inverted for natural tilt)
  const handleWheel = (e: React.WheelEvent) => {
    if (isDimmed) return
    wheelDeltaRef.current.x += e.deltaX * 0.0016 * params.panSensitivity
    wheelDeltaRef.current.y -= e.deltaY * 0.0014 * params.panSensitivity
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
        }}
      >
        <color attach="background" args={['#0c0b10']} />

        {/* Camera controller with touch, click-drag, and wheel panning */}
        <ChamberCameraController
          isDimmed={isDimmed}
          isDraggingRef={isDraggingRef}
          dragDeltaRef={dragDeltaRef}
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

        {/* 7 Curved Video Panels along the Spherical Wall */}
        {VIDEOS_DATA.map((video) => (
          <CurvedVideoPanel
            key={video.id}
            video={video}
            isDimmed={isDimmed}
            isSelected={currentSelected?.id === video.id}
            thumbnailScale={params.thumbnailScale}
            transitSpeed={params.transitSpeed}
            sphereRadius={params.sphereRadius}
            arcDegrees={params.arcDegrees}
            rowSeparation={params.rowSeparation}
            onSelect={onSelectVideo}
          />
        ))}
      </Canvas>
    </div>
  )
}
