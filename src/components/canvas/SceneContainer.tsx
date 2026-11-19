import React, { Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { FrameGovernor } from './FrameGovernor'
import { ThemeColor } from '@/context/ThemeContext'

const EPSILON = 0.0002

/**
 * Actively drives the camera to a 25-degree perspective angle above the scene
 * with subtle parallax and an idle convergence threshold.
 */
const CameraController: React.FC = () => {
  const { camera, pointer } = useThree()

  useFrame(() => {
    const targetX = pointer.x * 0.35
    const targetY = 2.55 + pointer.y * 0.20
    const targetZ = 5.45

    if (
      Math.abs(camera.position.x - targetX) > EPSILON ||
      Math.abs(camera.position.y - targetY) > EPSILON ||
      Math.abs(camera.position.z - targetZ) > EPSILON
    ) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06)
      camera.lookAt(0, 0, 0)
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
  onBackgroundClick?: () => void
}

export const SceneContainer: React.FC<SceneContainerProps> = ({
  children,
  isGlitching,
  theme,
  targetFps = 60,
  targetDpr = [1, 2],
  isSleeping = false,
  onBackgroundClick,
}) => {
  const frameloopMode = isSleeping ? 'never' : targetFps === null ? 'always' : 'demand'

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
        camera={{ position: [0, 2.55, 5.45], fov: 46 }}
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
        <FrameGovernor targetFps={targetFps} isSleeping={isSleeping} />
        <CameraController />
        <color attach="background" args={['#1c1b22']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <ParticleField count={750} theme={theme} />
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}
