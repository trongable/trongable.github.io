import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ThemeColor } from '@/context/ThemeContext'

export function computeStarColors(
  count: number,
  primaryColor: string,
  particleMeta: Float32Array
): Float32Array {
  const target = new Float32Array(count * 3)
  const baseColor = new THREE.Color(primaryColor)

  for (let i = 0; i < count; i++) {
    const brightness = particleMeta[i * 3]
    const whiteCore = particleMeta[i * 3 + 1]
    const jitter = particleMeta[i * 3 + 2]

    // Mix base color with white-hot core and apply brightness & jitter
    const r = brightness * THREE.MathUtils.clamp(THREE.MathUtils.lerp(baseColor.r, 1.0, whiteCore) + jitter, 0, 1)
    const g = brightness * THREE.MathUtils.clamp(THREE.MathUtils.lerp(baseColor.g, 1.0, whiteCore) + jitter, 0, 1)
    const b = brightness * THREE.MathUtils.clamp(THREE.MathUtils.lerp(baseColor.b, 1.0, whiteCore) + jitter, 0, 1)

    target[i * 3] = r
    target[i * 3 + 1] = g
    target[i * 3 + 2] = b
  }

  return target
}

export const ParticleField: React.FC<{ count?: number; theme?: ThemeColor; isPaused?: boolean }> = ({
  count = 750,
  theme,
  isPaused = false,
}) => {
  const pointsRef = useRef<THREE.Points>(null)
  const geomRef = useRef<THREE.BufferGeometry>(null)

  // Procedural soft circular star texture in pure white for clean chromatic tinting
  const starTexture = useMemo(() => {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)')
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.35)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])

  // WebGL texture cleanup
  useEffect(() => {
    return () => {
      starTexture?.dispose()
    }
  }, [starTexture])

  // Static positions and per-particle visual properties (brightness, white-core mix, spectral jitter)
  const [positions, particleMeta] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const meta = new Float32Array(count * 3) // [brightness, whiteCore, jitter]

    for (let i = 0; i < count; i++) {
      // Mid-depth cosmic sphere (13 to 30 units away)
      const r = 13 + Math.random() * 17
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      meta[i * 3] = 0.70 + Math.random() * 0.30       // Base brightness
      meta[i * 3 + 1] = 0.15 + Math.random() * 0.30   // White-core boost factor
      meta[i * 3 + 2] = (Math.random() - 0.5) * 0.08  // Subtle hue/spectral variation
    }

    return [pos, meta]
  }, [count])

  // Buffer color array representing live colors on the GPU
  const colors = useMemo(() => new Float32Array(count * 3), [count])

  // Target colors derived from active theme primary color
  const targetColors = useMemo(() => {
    return computeStarColors(count, theme?.primary ?? '#e2f872', particleMeta)
  }, [count, theme?.primary, particleMeta])

  // Flag indicating whether star color lerping has fully converged
  const isSettled = useRef(false)

  useEffect(() => {
    isSettled.current = false
  }, [theme?.primary])

  // Initialize buffer array with target colors immediately on first mount
  const isInitialized = useRef(false)
  if (!isInitialized.current) {
    colors.set(targetColors)
    isInitialized.current = true
    isSettled.current = true
  }

  useFrame((_, delta) => {
    if (!isPaused && pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008
      pointsRef.current.rotation.x += delta * 0.004
    }

    // Smoothly lerp star colors toward active theme targets; skip entirely once settled
    if (!isSettled.current && geomRef.current) {
      const colorAttr = geomRef.current.attributes.color as THREE.BufferAttribute | undefined
      if (!colorAttr) return

      let hasChanges = false
      const lerpSpeed = Math.min(delta * 5.0, 1.0)
      const array = colorAttr.array as Float32Array

      for (let i = 0; i < count * 3; i++) {
        const diff = targetColors[i] - array[i]
        if (Math.abs(diff) > 0.002) {
          array[i] += diff * lerpSpeed
          hasChanges = true
        } else if (diff !== 0) {
          array[i] = targetColors[i]
          hasChanges = true
        }
      }

      if (hasChanges) {
        colorAttr.needsUpdate = true
      } else {
        isSettled.current = true
      }
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        map={starTexture || undefined}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
