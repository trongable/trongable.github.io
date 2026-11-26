import React, { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GuideStyle } from './geometryConfig'
import { createRibbedTorusGeometry, createRibbedTubeGeometry } from './shared/guideGeometry'

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

  // Refs for in-place opacity/color updates during useFrame
  const mainMatRef = useRef<THREE.Material | null>(null)
  const coreMatRef = useRef<THREE.Material | null>(null)
  const mainMeshRef = useRef<THREE.Object3D | null>(null)

  // 1. Generate primary procedural geometry based on style
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
    } else {
      // Circular ring in X-Z plane
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
    }
  }, [curve, radius, width, style])

  // 2. Generate inner core geometry for 'glow' mode
  const coreGeometry = useMemo(() => {
    if (style !== 'glow') return null
    const coreWidth = width * 0.45
    if (curve) {
      return new THREE.TubeGeometry(curve, 180, coreWidth, 12, true)
    } else {
      return new THREE.TorusGeometry(radius, coreWidth, 12, 100)
    }
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
        if (style === 'glow') {
          mainMatRef.current.opacity = alpha * 0.42
        } else if (style === 'wireframe') {
          mainMatRef.current.opacity = alpha * 0.48
        } else if (style === 'points') {
          mainMatRef.current.opacity = alpha * 0.85
        } else {
          mainMatRef.current.opacity = alpha * 0.65
        }
      }
      if ('color' in mainMatRef.current) {
        ;(mainMatRef.current as any).color.copy(primaryColor)
      }
    }

    if (coreMatRef.current && style === 'glow') {
      if ('opacity' in coreMatRef.current) {
        coreMatRef.current.opacity = alpha * 0.95
      }
      if ('color' in coreMatRef.current) {
        ;(coreMatRef.current as any).color.copy(glowColor)
      }
    }
  })

  // Standard rotation: circular 2D rings (in X-Y plane) default to [PI/2, 0, 0] for X-Z alignment; 3D curves default to [0, 0, 0]
  const defaultRotation: [number, number, number] = rotation ?? (
    curve ? [0, 0, 0] : [Math.PI / 2, 0, 0]
  )

  if (style === 'dashed') {
    return (
      <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
        <lineLoop geometry={primaryGeometry}>
          <lineDashedMaterial
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
      <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
        <points geometry={primaryGeometry}>
          <pointsMaterial
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
      <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
        {/* Outer glowing sheath */}
        <mesh geometry={primaryGeometry}>
          <meshBasicMaterial
            ref={mainMatRef as any}
            color={primaryColor}
            transparent={true}
            opacity={0.42}
          />
        </mesh>
        {/* Inner intense neon core */}
        {coreGeometry && (
          <mesh geometry={coreGeometry}>
            <meshBasicMaterial
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

  // Styles: 'solid', 'wireframe', 'hex', 'ribbed'
  const isWireframe = style === 'wireframe'

  return (
    <group ref={mainMeshRef as any} rotation={defaultRotation} visible={visible}>
      <mesh geometry={primaryGeometry}>
        <meshBasicMaterial
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
