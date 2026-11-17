import React, { Suspense } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
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

export const SceneContainer: React.FC<{
  children: React.ReactNode
  isGlitching?: boolean
  theme?: ThemeColor
}> = ({ children, isGlitching, theme }) => {
  return (
    <div
      data-testid="scene-container"
      className={`absolute inset-0 pointer-events-auto touch-none transition-transform duration-75 ${
        isGlitching ? 'translate-x-[1.5px] -translate-y-[0.5px]' : ''
      }`}
    >
      <Canvas
        camera={{ position: [0, 2.55, 5.45], fov: 46 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.NoToneMapping,
        }}
      >
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
