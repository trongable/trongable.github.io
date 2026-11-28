import React, { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTheme } from '@/context/ThemeContext'
import { CEREBRO_RADIUS } from '@/features/gallery/data/galleryData'

interface CerebroSphereWallProps {
  radius?: number
  isDimmed?: boolean
  isPaused?: boolean
  particleCount?: number
}

const WALL_DIM_INTENSITY = 0.90

export const CerebroSphereWall: React.FC<CerebroSphereWallProps> = ({
  radius = CEREBRO_RADIUS + 0.3,
  isDimmed = false,
  isPaused = false,
  particleCount = 120,
}) => {
  const { currentTheme } = useTheme()
  const themeColor = currentTheme.primary
  const highlightColor = currentTheme.highlight

  const particlesRef = useRef<THREE.Points>(null)
  const dimProgress = useRef(isDimmed ? 1.0 : 0.0)

  const latitudeGeometries = useMemo(() => {
    const elevations = [-60, -45, -30, -15, 0, 15, 30, 45, 60]
    const segments = 64

    return elevations.map((deg) => {
      const phi = THREE.MathUtils.degToRad(deg)
      const ringRadius = radius * Math.cos(phi)
      const y = radius * Math.sin(phi)

      const points: THREE.Vector3[] = []
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2
        points.push(new THREE.Vector3(ringRadius * Math.sin(theta), y, -ringRadius * Math.cos(theta)))
      }
      return new THREE.BufferGeometry().setFromPoints(points)
    })
  }, [radius])

  const meridianGeometry = useMemo(() => {
    const meridianPoints: THREE.Vector3[] = []
    const stepDeg = 30
    const arcSegments = 32

    for (let deg = 0; deg < 360; deg += stepDeg) {
      const theta = THREE.MathUtils.degToRad(deg)
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)

      for (let i = 0; i <= arcSegments; i++) {
        const phi = (i / arcSegments) * Math.PI - Math.PI / 2
        const r = radius * Math.cos(phi)
        const y = radius * Math.sin(phi)
        const x = r * sinTheta
        const z = -r * cosTheta
        meridianPoints.push(new THREE.Vector3(x, y, z))

        if (i > 0 && i < arcSegments) {
          meridianPoints.push(new THREE.Vector3(x, y, z))
        }
      }
    }

    return new THREE.BufferGeometry().setFromPoints(meridianPoints)
  }, [radius])

  const particleGeo = useMemo(() => {
    const count = particleCount
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const sinPhi = Math.sin(phi)
      const r = radius * (0.98 + 0.05 * Math.random())
      positions[i * 3] = r * sinPhi * Math.sin(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = -r * sinPhi * Math.cos(theta)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [radius, particleCount])

  const latMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: themeColor, transparent: true, opacity: 0.18, depthWrite: false }),
    [themeColor]
  )
  const merMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: themeColor, transparent: true, opacity: 0.135, depthWrite: false }),
    [themeColor]
  )
  const partMat = useMemo(
    () => new THREE.PointsMaterial({ color: highlightColor, size: 0.035, transparent: true, opacity: 0.45, depthWrite: false }),
    [highlightColor]
  )

  useEffect(() => {
    return () => {
      latitudeGeometries.forEach((g) => g.dispose())
      meridianGeometry.dispose()
      particleGeo.dispose()
      latMat.dispose()
      merMat.dispose()
      partMat.dispose()
    }
  }, [latitudeGeometries, meridianGeometry, particleGeo, latMat, merMat, partMat])

  useFrame((_, delta) => {
    if (isPaused) return
    dimProgress.current = THREE.MathUtils.damp(dimProgress.current, isDimmed ? 1.0 : 0.0, 7, delta)
    const dp = dimProgress.current
    const dimFactor = Math.max(0.01, 1 - dp * WALL_DIM_INTENSITY)

    latMat.opacity = 0.18 * dimFactor
    merMat.opacity = 0.135 * dimFactor
    partMat.opacity = 0.45 * dimFactor

    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position
      if (posAttr) {
        const arr = posAttr.array as Float32Array
        const speed = delta * 0.15

        for (let i = 0; i < particleCount; i++) {
          arr[i * 3 + 1] += speed * (0.5 - (i % 5) * 0.2)
          if (arr[i * 3 + 1] > radius * 0.8) arr[i * 3 + 1] = -radius * 0.8
          if (arr[i * 3 + 1] < -radius * 0.8) arr[i * 3 + 1] = radius * 0.8
        }
        posAttr.needsUpdate = true
      }
    }
  })

  return (
    <group data-testid="cerebro-sphere-wall" renderOrder={0}>
      <mesh>
        <sphereGeometry args={[radius * 1.05, 32, 24]} />
        <meshBasicMaterial
          color="#0d0c10"
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {latitudeGeometries.map((geo, idx) => (
        <lineLoop key={`lat-${idx}`} geometry={geo} material={latMat} />
      ))}

      <lineSegments geometry={meridianGeometry} material={merMat} />
      <points ref={particlesRef} geometry={particleGeo} material={partMat} />
    </group>
  )
}
