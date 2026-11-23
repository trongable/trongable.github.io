import React, { Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { FrameGovernor } from './FrameGovernor'
import { ThemeColor } from '@/context/ThemeContext'
import { CameraElevation } from '@/context/DebugDistanceContext'

const EPSILON = 0.0002

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
const CameraController: React.FC<CameraControllerProps> = ({
  cameraElevation = 'elevated',
  isPaused = false,
  cameraAngles,
}) => {
  const { camera, pointer, invalidate } = useThree()

  // Invalidate on-demand frame whenever inspection angles change while paused
  React.useEffect(() => {
    if (isPaused && typeof invalidate === 'function') {
      invalidate()
    }
  }, [isPaused, cameraAngles?.yaw, cameraAngles?.pitch, cameraAngles?.distance, invalidate])

  useFrame(() => {
    if (isPaused) {
      const defaultPitch = cameraElevation === 'eye-level' ? 0 : 25.07
      const defaultDist = cameraElevation === 'eye-level' ? 6.0 : 6.017
      const yaw = cameraAngles?.yaw ?? 0
      const pitch = cameraAngles?.pitch ?? defaultPitch
      const dist = cameraAngles?.distance ?? defaultDist

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
    const targetY = isEyeLevel ? pointer.y * 0.20 : 2.55 + pointer.y * 0.20
    const targetZ = isEyeLevel ? 6.0 : 5.45

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

export interface SceneContainerProps {
  children: React.ReactNode
  isGlitching?: boolean
  theme?: ThemeColor
  targetFps?: number | null
  targetDpr?: number | [number, number]
  isSleeping?: boolean
  isPaused?: boolean
  cameraElevation?: CameraElevation
  cameraAngles?: CameraAngles
  onBackgroundClick?: () => void
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  isGlitching,
  theme,
  targetFps = 60,
  targetDpr = [1, 2],
  isSleeping = false,
  isPaused = false,
  cameraElevation = 'elevated',
  cameraAngles,
  onBackgroundClick,
}) => {
  const frameloopMode = isSleeping ? 'never' : (isPaused || targetFps !== null ? 'demand' : 'always')

  return (
    <div
      data-testid="scene-container"
      className={`absolute inset-0 pointer-events-auto touch-none transition-transform duration-75 ${
        isGlitching ? 'translate-x-[1.5px] -translate-y-[0.5px]' : ''
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
          onBackgroundClick?.()
        }
      }}
    >
      <Canvas
        camera={{ position: cameraElevation === 'eye-level' ? [0, 0, 6.0] : [0, 2.55, 5.45], fov: 46 }}
        dpr={targetDpr}
        frameloop={frameloopMode}
        onPointerMissed={(e) => {
          if (e.button === 0) {
            onBackgroundClick?.()
          }
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <FrameGovernor targetFps={targetFps} isSleeping={isSleeping} isPaused={isPaused} />
        <CameraController
          cameraElevation={cameraElevation}
          isPaused={isPaused}
          cameraAngles={cameraAngles}
        />
        <color attach="background" args={['#1c1b22']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <ParticleField count={750} theme={theme} isPaused={isPaused} />
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}
