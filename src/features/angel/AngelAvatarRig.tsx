import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AngelContainers } from '@/features/angel/AngelContainers'
import type { AngelAvatarConfig } from '@/features/angel/angelCatalog'
import { findWardrobeItem } from '@/features/angel/angelCatalog'
import { createAngelFaceTexture } from '@/features/angel/faceTexture'

interface GlbSlotProps {
  url: string
  colorHex?: string
}

const GlbSlot: React.FC<GlbSlotProps> = ({ url, colorHex }) => {
  const gltf = useGLTF(url)

  const clonedScene = useMemo(() => {
    const root = gltf.scene.clone(true)
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone())
        } else if (mesh.material) {
          mesh.material = mesh.material.clone()
        }
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return root
  }, [gltf.scene])

  useEffect(() => {
    if (!colorHex) return
    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat) => {
          if (mat && 'color' in mat && mat.color instanceof THREE.Color) {
            mat.color.set(colorHex)
          }
        })
      }
    })
  }, [clonedScene, colorHex])

  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m) => m?.dispose())
        }
      })
    }
  }, [clonedScene])

  return <primitive object={clonedScene} />
}

export interface AngelAvatarRigProps {
  config: AngelAvatarConfig
  primaryColorHex: string
  highlightColorHex: string
  isTurntableActive: boolean
  isPaused?: boolean
}

/**
 * Renders the bald Angel base `.glb` + modular wardrobe `.glb` slots,
 * dynamic CanvasTexture face overlay, and optional Angel 3D stage enclosure.
 */
export const AngelAvatarRig: React.FC<AngelAvatarRigProps> = ({
  config,
  primaryColorHex,
  highlightColorHex,
  isTurntableActive,
  isPaused = false,
}) => {
  const spinGroupRef = useRef<THREE.Group>(null)
  const bgMeshRef = useRef<THREE.Mesh>(null)
  const bgMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const floorMeshRef = useRef<THREE.Mesh>(null)
  const floorMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const accentMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const glassMaterialRef = useRef<THREE.MeshBasicMaterial>(null)

  const baseGltf = useGLTF('/models/angel/base-angel.glb?v=3')

  const baseScene = useMemo(() => {
    const root = baseGltf.scene.clone(true)
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone())
        } else if (mesh.material) {
          mesh.material = mesh.material.clone()
        }
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return root
  }, [baseGltf.scene])

  const faceTexture = useMemo(() => {
    return createAngelFaceTexture({
      eyeStyle: config.eyeStyle,
      eyeColor: config.eyeColor,
      blushIntensity: config.blushIntensity,
      blushColor: config.blushColor,
      freckles: config.freckles,
      mouthStyle: config.mouthStyle,
    })
  }, [
    config.eyeStyle,
    config.eyeColor,
    config.blushIntensity,
    config.blushColor,
    config.freckles,
    config.mouthStyle,
  ])

  useEffect(() => {
    return () => {
      faceTexture?.dispose()
    }
  }, [faceTexture])

  useEffect(() => {
    baseScene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mesh = obj as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach((mat) => {
        if (!mat) return
        const matName = mat.name || ''
        if (matName.includes('mat_skin') && mat instanceof THREE.MeshStandardMaterial) {
          mat.color.set(config.skinTone)
          mat.roughness = 0.44
        } else if (matName.includes('mat_wings') && mat instanceof THREE.MeshStandardMaterial) {
          mesh.visible = config.wingsEnabled
          mat.color.set(config.wingColor)
          mat.roughness = 0.36
        } else if (matName.includes('mat_face_overlay') && mat instanceof THREE.MeshStandardMaterial) {
          mesh.castShadow = false
          mesh.receiveShadow = false
          mat.map = faceTexture
          mat.transparent = true
          mat.alphaTest = 0.02
          mat.depthWrite = false
          mat.polygonOffset = true
          mat.polygonOffsetFactor = -1
          mat.roughness = 0.25
          mat.needsUpdate = true
        }
      })
    })
  }, [baseScene, config.skinTone, config.wingsEnabled, config.wingColor, faceTexture])

  useEffect(() => {
    return () => {
      baseScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m) => m?.dispose())
        }
      })
    }
  }, [baseScene])

  useFrame((_, delta) => {
    if (isPaused || !isTurntableActive || !spinGroupRef.current) return
    spinGroupRef.current.rotation.y += delta * 0.45
  })

  const hairItem = findWardrobeItem('hair', config.hairId)
  const topItem = findWardrobeItem('tops', config.topId)
  const bottomItem = findWardrobeItem('bottoms', config.bottomId)
  const footwearItem = findWardrobeItem('footwear', config.footwearId)

  return (
    <group>
      {/* Scaled stage enclosure around the 1.0-unit Angel */}
      <group scale={2.1}>
        <AngelContainers
          containerStyle={config.containerStyle}
          primaryColorHex={primaryColorHex}
          highlightColorHex={highlightColorHex}
          bgMeshRef={bgMeshRef}
          bgMaterialRef={bgMaterialRef}
          floorMeshRef={floorMeshRef}
          floorMaterialRef={floorMaterialRef}
          accentMaterialRef={accentMaterialRef}
          glassMaterialRef={glassMaterialRef}
        />
      </group>

      <group ref={spinGroupRef} position={[0, -0.72, 0]} scale={1.45}>
        <primitive object={baseScene} />

        {hairItem?.modelUrl && (
          <GlbSlot url={hairItem.modelUrl} colorHex={config.hairColor} />
        )}
        {topItem?.modelUrl && (
          <GlbSlot url={topItem.modelUrl} colorHex={config.topColor} />
        )}
        {bottomItem?.modelUrl && (
          <GlbSlot url={bottomItem.modelUrl} colorHex={config.bottomColor} />
        )}
        {footwearItem?.modelUrl && (
          <GlbSlot url={footwearItem.modelUrl} colorHex={config.footwearColor} />
        )}
        {config.accessoryIds.map((accId) => {
          const item = findWardrobeItem('accessories', accId)
          if (!item?.modelUrl) return null
          return (
            <GlbSlot
              key={accId}
              url={item.modelUrl}
              colorHex={config.accessoryColor}
            />
          )
        })}
      </group>
    </group>
  )
}
