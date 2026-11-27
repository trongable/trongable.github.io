import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeColor } from '@/context/ThemeContext'
import type { CameraElevation } from '@/context/DebugDistanceContext'
import { ParticleField } from '@/features/scene/ParticleField'
import { FrameGovernor } from '@/features/scene/FrameGovernor'
import {
  CameraController,
  CameraAngles,
  ELEVATED_CAMERA_POS,
  EYE_LEVEL_CAMERA_POS,
} from '@/features/scene/CameraController'

export type { CameraAngles }

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
  const initialCameraPos =
    cameraElevation === 'eye-level' ? EYE_LEVEL_CAMERA_POS : ELEVATED_CAMERA_POS

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
        camera={{ position: initialCameraPos, fov: 46 }}
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
