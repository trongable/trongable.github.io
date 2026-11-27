import React, { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CameraElevation } from '@/context/DebugDistanceContext'

const EPSILON = 0.0002

export const DEFAULT_ELEVATED_PITCH = 25.07
export const DEFAULT_ELEVATED_DIST = 6.017
export const DEFAULT_EYE_LEVEL_DIST = 6.0

export const ELEVATED_CAMERA_POS: [number, number, number] = [0, 2.55, 5.45]
export const EYE_LEVEL_CAMERA_POS: [number, number, number] = [0, 0, 6.0]

export interface CameraAngles {
  yaw: number      // -180 to 180 degrees
  pitch: number    // -85 to 85 degrees
  distance: number // 2.5 to 12.0 units
}

interface CameraControllerProps {
  cameraElevation?: CameraElevation
  isPaused?: boolean
  cameraAngles?: CameraAngles
}

/**
 * Drives camera perspective angle:
 * - When paused: spherical camera orbit around (0, 0, 0) via yaw, pitch, distance angles
 * - When running:
 *   - 'elevated' (default): 25-degree perspective angle above the scene [0, 2.55, 5.45]
 *   - 'eye-level': 0-degree pure horizontal eye-level perspective [0, 0, 6.0] looking straight into (0, 0, 0)
 *   with subtle parallax and idle convergence threshold.
 */
export const CameraController: React.FC<CameraControllerProps> = ({
  cameraElevation = 'elevated',
  isPaused = false,
  cameraAngles,
}) => {
  const { camera, pointer, invalidate } = useThree()

  // Invalidate on-demand frame whenever inspection angles change while paused
  useEffect(() => {
    if (isPaused && typeof invalidate === 'function') {
      invalidate()
    }
  }, [isPaused, cameraAngles?.yaw, cameraAngles?.pitch, cameraAngles?.distance, invalidate])

  useFrame(() => {
    if (isPaused) {
      const isEyeLevel = cameraElevation === 'eye-level'
      const yaw = cameraAngles?.yaw ?? 0
      const pitch = cameraAngles?.pitch ?? (isEyeLevel ? 0 : DEFAULT_ELEVATED_PITCH)
      const dist = cameraAngles?.distance ?? (isEyeLevel ? DEFAULT_EYE_LEVEL_DIST : DEFAULT_ELEVATED_DIST)

      const thetaRad = THREE.MathUtils.degToRad(yaw)
      const phiRad = THREE.MathUtils.degToRad(pitch)

      const targetX = dist * Math.cos(phiRad) * Math.sin(thetaRad)
      const targetY = dist * Math.sin(phiRad)
      const targetZ = dist * Math.cos(phiRad) * Math.cos(thetaRad)

      camera.position.set(targetX, targetY, targetZ)
      camera.lookAt(0, 0, 0)
      if (typeof camera.updateMatrixWorld === 'function') {
        camera.updateMatrixWorld()
      }
      return
    }

    const isEyeLevel = cameraElevation === 'eye-level'
    const targetX = pointer.x * 0.35
    const targetY = isEyeLevel ? pointer.y * 0.20 : ELEVATED_CAMERA_POS[1] + pointer.y * 0.20
    const targetZ = isEyeLevel ? EYE_LEVEL_CAMERA_POS[2] : ELEVATED_CAMERA_POS[2]

    if (
      Math.abs(camera.position.x - targetX) > EPSILON ||
      Math.abs(camera.position.y - targetY) > EPSILON ||
      Math.abs(camera.position.z - targetZ) > EPSILON
    ) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06)
      camera.lookAt(0, 0, 0)
      if (typeof camera.updateMatrixWorld === 'function') {
        camera.updateMatrixWorld()
      }
    }
  })

  return null
}
