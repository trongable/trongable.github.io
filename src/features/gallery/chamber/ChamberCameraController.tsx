import React, { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GalleryChamberParams } from '@/features/gallery/data/galleryTunerConfig'

export interface PanelDirectionEntry {
  id: string
  dir: THREE.Vector3
}

interface ChamberCameraControllerProps {
  isDimmed: boolean
  isDraggingRef: React.MutableRefObject<boolean>
  dragDeltaRef: React.MutableRefObject<{ x: number; y: number }>
  releaseVelocityRef: React.MutableRefObject<{ vx: number; vy: number }>
  wheelDeltaRef: React.MutableRefObject<{ x: number; y: number }>
  activeKeysRef: React.MutableRefObject<{ left: boolean; right: boolean; up: boolean; down: boolean }>
  panelDirections: PanelDirectionEntry[]
  selectedTarget: { id: string; azimuthDeg: number; elevationDeg: number } | null
  onCenteredItemChange: (id: string | null) => void
  params: GalleryChamberParams
}

const EPSILON = 0.0001
const KEY_SPIN_BASE_RAD_PER_SEC = THREE.MathUtils.degToRad(95)
const KEY_PITCH_BASE_RAD_PER_SEC = THREE.MathUtils.degToRad(55)
const scratchLookTarget = new THREE.Vector3()
const scratchGazeDir = new THREE.Vector3()

/**
 * Drives spherical chamber camera yaw/pitch from drag, inertial fling, wheel,
 * keyboard spin, and TheaterOverlay Prev/Next alignment, plus center-gaze hit detection.
 */
export const ChamberCameraController: React.FC<ChamberCameraControllerProps> = ({
  isDimmed,
  isDraggingRef,
  dragDeltaRef,
  releaseVelocityRef,
  wheelDeltaRef,
  activeKeysRef,
  panelDirections,
  selectedTarget,
  onCenteredItemChange,
  params,
}) => {
  const { camera, viewport } = useThree()

  const currentYaw = useRef<number>(0)
  const currentPitch = useRef<number>(0)
  const targetYaw = useRef<number>(0)
  const targetPitch = useRef<number>(0)
  const velocityYaw = useRef<number>(0)
  const velocityPitch = useRef<number>(0)
  const lastCenteredIdRef = useRef<string | null>(null)
  const prevSelectedIdRef = useRef<string | null>(null)

  // Steer camera yaw/pitch toward newly active panel when cycling Prev/Next inside TheaterOverlay
  useEffect(() => {
    const nextId = selectedTarget?.id ?? null
    const prevId = prevSelectedIdRef.current
    prevSelectedIdRef.current = nextId

    if (prevId && nextId && prevId !== nextId && selectedTarget) {
      const targetYawRad = THREE.MathUtils.degToRad(selectedTarget.azimuthDeg)
      const twoPi = Math.PI * 2
      const diff = ((((targetYawRad - targetYaw.current) % twoPi) + Math.PI * 3) % twoPi) - Math.PI
      targetYaw.current += diff

      const maxPitch = THREE.MathUtils.degToRad(params.maxPitchDeg)
      targetPitch.current = THREE.MathUtils.clamp(
        THREE.MathUtils.degToRad(selectedTarget.elevationDeg),
        -maxPitch,
        maxPitch
      )
    }
  }, [selectedTarget, params.maxPitchDeg])

  useFrame((_, delta) => {
    // 1. Mouse drag / touch delta and release inertia
    if (isDraggingRef.current) {
      targetYaw.current += dragDeltaRef.current.x
      targetPitch.current += dragDeltaRef.current.y
      dragDeltaRef.current.x = 0
      dragDeltaRef.current.y = 0

      velocityYaw.current = 0
      velocityPitch.current = 0
    } else {
      if (releaseVelocityRef.current.vx !== 0 || releaseVelocityRef.current.vy !== 0) {
        velocityYaw.current = releaseVelocityRef.current.vx
        velocityPitch.current = releaseVelocityRef.current.vy
        releaseVelocityRef.current.vx = 0
        releaseVelocityRef.current.vy = 0
      }

      if (isDimmed || params.flingInertia <= 0) {
        velocityYaw.current = 0
        velocityPitch.current = 0
      }

      targetYaw.current += velocityYaw.current * delta
      targetPitch.current += velocityPitch.current * delta

      const decayFactor = Math.pow(0.88, delta * 60)
      velocityYaw.current *= decayFactor
      velocityPitch.current *= decayFactor

      if (Math.abs(velocityYaw.current) < EPSILON) velocityYaw.current = 0
      if (Math.abs(velocityPitch.current) < EPSILON) velocityPitch.current = 0
    }

    // 2. Two-finger scroll / mouse wheel delta
    if (wheelDeltaRef.current.x !== 0 || wheelDeltaRef.current.y !== 0) {
      targetYaw.current += wheelDeltaRef.current.x
      targetPitch.current += wheelDeltaRef.current.y
      wheelDeltaRef.current.x = 0
      wheelDeltaRef.current.y = 0
    }

    // 3. Continuous keyboard spin (ArrowLeft/A, ArrowRight/D) and pitch (ArrowUp/W, ArrowDown/S)
    if (!isDimmed) {
      const keyDir = (activeKeysRef.current.right ? 1 : 0) - (activeKeysRef.current.left ? 1 : 0)
      if (keyDir !== 0) {
        targetYaw.current += keyDir * KEY_SPIN_BASE_RAD_PER_SEC * params.panSensitivity * delta
      }
      const keyPitchDir = (activeKeysRef.current.up ? 1 : 0) - (activeKeysRef.current.down ? 1 : 0)
      if (keyPitchDir !== 0) {
        targetPitch.current += keyPitchDir * KEY_PITCH_BASE_RAD_PER_SEC * params.panSensitivity * delta
      }
    }

    // Allow unbounded 360°+ rotation when freeSpin is active or maxYawDeg >= 180
    const isPortrait = viewport.width < viewport.height
    const effectiveMaxYawDeg = isPortrait
      ? Math.max(params.maxYawDeg, params.arcDegrees / 2 + 18)
      : params.maxYawDeg
    const maxPitch = THREE.MathUtils.degToRad(params.maxPitchDeg)

    if (!params.freeSpin && params.maxYawDeg < 180) {
      const maxYaw = THREE.MathUtils.degToRad(effectiveMaxYawDeg)
      targetYaw.current = THREE.MathUtils.clamp(targetYaw.current, -maxYaw, maxYaw)
    }
    targetPitch.current = THREE.MathUtils.clamp(targetPitch.current, -maxPitch, maxPitch)

    if (isDraggingRef.current) {
      currentYaw.current = targetYaw.current
      currentPitch.current = targetPitch.current
    } else {
      currentYaw.current = THREE.MathUtils.lerp(currentYaw.current, targetYaw.current, 0.18)
      currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch.current, 0.18)
    }

    camera.position.set(0, 0, 0)

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

    // 4. Identify single center-most panel along camera gaze vector (zero allocations)
    if (!isDimmed && params.centerZoom && panelDirections.length > 0) {
      scratchGazeDir.set(
        cosPitch * Math.sin(yaw),
        Math.sin(pitch),
        -cosPitch * Math.cos(yaw)
      )
      let bestId: string | null = null
      let bestDot = -Infinity
      for (let i = 0; i < panelDirections.length; i++) {
        const entry = panelDirections[i]
        const dot = scratchGazeDir.dot(entry.dir)
        if (dot > bestDot) {
          bestDot = dot
          bestId = entry.id
        }
      }
      if (bestId !== lastCenteredIdRef.current) {
        lastCenteredIdRef.current = bestId
        onCenteredItemChange(bestId)
      }
    }
  })

  return null
}
