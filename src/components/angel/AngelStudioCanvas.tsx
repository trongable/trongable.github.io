import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { FrameGovernor } from '@/components/canvas/FrameGovernor'
import type { AngelAvatarConfig } from './angelCatalog'
import { AngelAvatarRig } from './AngelAvatarRig'

export type CameraFocusPreset = 'full' | 'face' | 'feet'

interface StudioCameraRigProps {
  focusPreset: CameraFocusPreset
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

const StudioCameraRig: React.FC<StudioCameraRigProps> = ({ focusPreset, controlsRef }) => {
  const { camera, invalidate } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    if (focusPreset === 'face') {
      camera.position.set(0, 0.42, 1.35)
      controls?.target.set(0, 0.36, 0)
    } else if (focusPreset === 'feet') {
      camera.position.set(0.35, -0.35, 1.35)
      controls?.target.set(0, -0.58, 0)
    } else {
      camera.position.set(0.55, 0.25, 2.35)
      controls?.target.set(0, 0.0, 0)
    }
    controls?.update()
    invalidate()
  }, [focusPreset, camera, controlsRef, invalidate])

  return null
}

export interface AngelStudioCanvasProps {
  config: AngelAvatarConfig
  primaryColorHex: string
  highlightColorHex: string
  focusPreset: CameraFocusPreset
  isTurntableActive: boolean
  isPaused?: boolean
  isSleeping?: boolean
  targetFps?: number | null
  targetDpr?: number | [number, number]
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>
}

export const AngelStudioCanvas: React.FC<AngelStudioCanvasProps> = ({
  config,
  primaryColorHex,
  highlightColorHex,
  focusPreset,
  isTurntableActive,
  isPaused = false,
  isSleeping = false,
  targetFps = 60,
  targetDpr = [1, 2],
  canvasRef,
}) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const frameloopMode = isSleeping ? 'never' : isPaused || targetFps !== null ? 'demand' : 'always'

  return (
    <div
      data-testid="angel-studio-canvas"
      className="relative w-full h-full touch-none select-none"
    >
      <Canvas
        shadows
        dpr={targetDpr}
        frameloop={frameloopMode}
        camera={{ position: [0.55, 0.25, 2.35], fov: 40, near: 0.05, far: 40 }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl }) => {
          if (canvasRef) {
            canvasRef.current = gl.domElement
          }
        }}
      >
        <color attach="background" args={['#1c1b22']} />
        <FrameGovernor targetFps={targetFps} isSleeping={isSleeping} isPaused={isPaused} />
        <StudioCameraRig focusPreset={focusPreset} controlsRef={controlsRef} />

        {/* Soft 3-point toy studio lighting */}
        <hemisphereLight args={['#fff8f0', '#2a2736', 1.1]} />
        <directionalLight
          position={[2.5, 4.0, 3.2]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005}
          shadow-normalBias={0.04}
          shadow-camera-left={-1.5}
          shadow-camera-right={1.5}
          shadow-camera-top={1.5}
          shadow-camera-bottom={-1.5}
          shadow-camera-near={0.5}
          shadow-camera-far={10}
        />
        <directionalLight position={[-2.5, 1.5, -2.0]} intensity={0.65} color="#d4adf0" />

        <Suspense fallback={null}>
          <AngelAvatarRig
            config={config}
            primaryColorHex={primaryColorHex}
            highlightColorHex={highlightColorHex}
            isTurntableActive={isTurntableActive}
            isPaused={isPaused}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.08}
          minDistance={0.9}
          maxDistance={4.2}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.78}
        />
      </Canvas>
    </div>
  )
}
