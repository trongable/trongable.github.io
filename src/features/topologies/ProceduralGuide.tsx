import React, { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GuideStyle } from '@/features/topologies/config/geometryConfig'
import {
  createRibbedTorusGeometry,
  createRibbedTubeGeometry,
} from '@/features/topologies/math/guideGeometry'

export { createRibbedTorusGeometry, createRibbedTubeGeometry }

export interface ProceduralGuideProps {
  style?: GuideStyle
  radius?: number
  curve?: THREE.Curve<THREE.Vector3>
  width?: number
  color?: string
  highlightColor?: string
  opacity?: number | React.MutableRefObject<number>
  visible?: boolean
  rotation?: [number, number, number]
}

const STYLE_OPACITY_MULT: Record<string, number> = {
  glow: 0.42,
  wireframe: 0.48,
  points: 0.85,
}

export const ProceduralGuide: React.FC<ProceduralGuideProps> = ({
  style = 'solid',
  radius = 1.5,
  curve,
  width = 0.015,
  color = '#e2f872',
  highlightColor = '#ffffff',
  opacity = 1,
  visible = true,
  rotation,
}) => {
  const primaryColor = useMemo(() => new THREE.Color(color), [color])
  const glowColor = useMemo(() => new THREE.Color(highlightColor), [highlightColor])

  const mainMatRef = useRef<THREE.Material | null>(null)
  const coreMatRef = useRef<THREE.Material | null>(null)
  const mainMeshRef = useRef<THREE.Object3D | null>(null)

  const primaryGeometry = useMemo(() => {
    if (curve) {
      switch (style) {
        case 'wireframe':
          return new THREE.TubeGeometry(curve, 180, width, 8, true)
        case 'hex':
          return new THREE.TubeGeometry(curve, 180, width, 6, true)
        case 'ribbed':
          return createRibbedTubeGeometry(curve, width, 54, 180, 16)
        case 'dashed':
        case 'points': {
          const points = curve.getPoints(240)
          const geom = new THREE.BufferGeometry().setFromPoints(points)
          if (style === 'dashed') {
            const line = new THREE.LineLoop(geom)
            line.computeLineDistances()
            geom.dispose()
            return line.geometry
          }
          return geom
        }
        case 'glow':
        case 'solid':
        default:
          return new THREE.TubeGeometry(curve, 180, width, 16, true)
      }
    }

    switch (style) {
      case 'wireframe':
        return new THREE.TorusGeometry(radius, width, 8, 80)
      case 'hex':
        return new THREE.TorusGeometry(radius, width, 6, 96)
      case 'ribbed':
        return createRibbedTorusGeometry(radius, width, 48, 180, 16)
      case 'dashed':
      case 'points': {
        const points: THREE.Vector3[] = []
        const segments = 180
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2
          points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0))
        }
        const geom = new THREE.BufferGeometry().setFromPoints(points)
        if (style === 'dashed') {
          const line = new THREE.LineLoop(geom)
          line.computeLineDistances()
          geom.dispose()
          return line.geometry
        }
        return geom
      }
      case 'glow':
      case 'solid':
      default:
        return new THREE.TorusGeometry(radius, width, 16, 120)
    }
  }, [curve, radius, width, style])

  const coreGeometry = useMemo(() => {
    if (style !== 'glow') return null
    const coreWidth = width * 0.45
    return curve
      ? new THREE.TubeGeometry(curve, 180, coreWidth, 12, true)
      : new THREE.TorusGeometry(radius, coreWidth, 12, 100)
  }, [style, curve, radius, width])

  // Explicit WebGL GPU disposal cleanup hook
  useEffect(() => {
    return () => {
      primaryGeometry.dispose()
      coreGeometry?.dispose()
      mainMatRef.current?.dispose()
      coreMatRef.current?.dispose()
    }
  }, [primaryGeometry, coreGeometry])

  // Dynamic in-place useFrame updates (Zero allocations)
  useFrame(() => {
    const alpha = typeof opacity === 'number' ? opacity : opacity.current
    if (mainMeshRef.current) {
      mainMeshRef.current.visible = visible && alpha > 0.01
    }

    if (mainMatRef.current) {
      if ('opacity' in mainMatRef.current) {
        mainMatRef.current.opacity = alpha * (STYLE_OPACITY_MULT[style] ?? 0.65)
      }
      if ('color' in mainMatRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mainMatRef.current as any).color.copy(primaryColor)
      }
    }

    if (coreMatRef.current && style === 'glow') {
      if ('opacity' in coreMatRef.current) {
        coreMatRef.current.opacity = alpha * 0.95
      }
      if ('color' in coreMatRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(coreMatRef.current as any).color.copy(glowColor)
      }
    }
  })

  // Circular 2D rings (in X-Y plane) default to [PI/2, 0, 0] for X-Z alignment; 3D curves default to [0, 0, 0]
  const defaultRotation: [number, number, number] = rotation ?? (
    curve ? [0, 0, 0] : [Math.PI / 2, 0, 0]
  )

  if (style === 'dashed') {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
        <lineLoop geometry={primaryGeometry}>
          <lineDashedMaterial
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={mainMatRef as any}
            color={primaryColor}
            dashSize={0.14}
            gapSize={0.08}
            transparent={true}
            opacity={0.65}
          />
        </lineLoop>
      </group>
    )
  }

  if (style === 'points') {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
        <points geometry={primaryGeometry}>
          <pointsMaterial
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={mainMatRef as any}
            color={primaryColor}
            size={Math.max(0.025, width * 3.2)}
            sizeAttenuation={true}
            transparent={true}
            opacity={0.85}
          />
        </points>
      </group>
    )
  }

  if (style === 'glow') {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
        <mesh geometry={primaryGeometry}>
          <meshBasicMaterial
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={mainMatRef as any}
            color={primaryColor}
            transparent={true}
            opacity={0.42}
          />
        </mesh>
        {coreGeometry && (
          <mesh geometry={coreGeometry}>
            <meshBasicMaterial
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={coreMatRef as any}
              color={glowColor}
              transparent={true}
              opacity={0.95}
            />
          </mesh>
        )}
      </group>
    )
  }

  const isWireframe = style === 'wireframe'

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
      <mesh geometry={primaryGeometry}>
        <meshBasicMaterial
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={mainMatRef as any}
          color={primaryColor}
          wireframe={isWireframe}
          transparent={true}
          opacity={isWireframe ? 0.48 : 0.65}
        />
      </mesh>
    </group>
  )
}
