import type React from 'react'
import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import {
  applyPanelCurvature,
  computePanelSurfaceBlur,
  CurvedPanelGeometries,
} from '@/features/gallery/chamber/panelShader'
import type { MediaKind } from '@/features/gallery/data/galleryData'
import { isReducedMotionEnabled } from '@/utils/mediaQueries'

const INTRO_DURATION_SEC = 0.40

interface UsePanelMotionOptions {
  itemIndex: number
  itemType: MediaKind
  panelWidth: number
  panelHeight: number
  panelCurveRadius: number
  sphereRadius: number
  initialPosition: THREE.Vector3
  initialQuaternion: THREE.Quaternion
  panelGeos: CurvedPanelGeometries
  isDimmed: boolean
  isSelected: boolean
  isOverlayActive: boolean
  isPaused: boolean
  effectiveFocused: boolean
  introCollapse: boolean
  scatterOnSelect: boolean
  ambientFloat: boolean
  focusReticles: boolean
  motionBlur: boolean
  thumbnailScale: number
  transitSpeed: number
  themeColorHex: string
  highlightColorHex: string
  groupRef: React.RefObject<THREE.Group | null>
  titleGroupRef: React.RefObject<THREE.Group | null>
  backingMatRef: React.RefObject<THREE.MeshBasicMaterial | null>
  borderMatRef: React.RefObject<THREE.LineBasicMaterial | null>
  reticleMatRef: React.RefObject<THREE.LineBasicMaterial | null>
  screenMatRef: React.RefObject<THREE.ShaderMaterial | null>
  playRingMatRef: React.RefObject<THREE.LineBasicMaterial | null>
  playTriMatRef: React.RefObject<THREE.LineBasicMaterial | null>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  textRef: React.RefObject<any>
  screenUniforms: {
    uMap: { value: THREE.Texture | null }
    uHasMap: { value: boolean }
    uOpacity: { value: number }
    uBrightness: { value: number }
    uBlurVec: { value: THREE.Vector2 }
  }
}

/**
 * Zero-allocation `useFrame` animation driver for `CurvedMediaPanel`:
 * handles snappy intro collapse, radial scatter fade-to-darkness, ambient float, focus zoom,
 * fly-to-center transit, seamless 3D-to-2D title flight, directional motion blur, and focus reticles.
 */
export function usePanelMotion({
  itemIndex,
  itemType,
  panelWidth,
  panelHeight,
  panelCurveRadius,
  sphereRadius,
  initialPosition,
  initialQuaternion,
  panelGeos,
  isDimmed,
  isSelected,
  isOverlayActive,
  isPaused,
  effectiveFocused,
  introCollapse,
  scatterOnSelect,
  ambientFloat,
  focusReticles,
  motionBlur,
  thumbnailScale,
  transitSpeed,
  themeColorHex,
  highlightColorHex,
  groupRef,
  titleGroupRef,
  backingMatRef,
  borderMatRef,
  reticleMatRef,
  screenMatRef,
  playRingMatRef,
  playTriMatRef,
  textRef,
  screenUniforms,
}: UsePanelMotionOptions): { mountPosition: THREE.Vector3 } {
  const flightProgress = useRef(0)
  const hoverScaleRef = useRef(1.0)
  const lastCurveFactorRef = useRef(1.0)
  const reducedMotionRef = useRef(isReducedMotionEnabled())
  const introExpand = useRef(reducedMotionRef.current || !introCollapse ? 0.0 : 1.0)
  const introElapsedRef = useRef(0)
  const scatterExpand = useRef(0.0)
  const reticleOpacity = useRef(0)
  const hasPrevLocalRef = useRef(false)
  const smoothBlurRef = useRef({ x: 0, y: 0 })
  const ambientClockRef = useRef(0)

  // Scratch vectors and colors (Zero-allocation in useFrame)
  const scratchCenterPos = useRef(new THREE.Vector3()).current
  const scratchScatterPos = useRef(new THREE.Vector3()).current
  const scratchLocalDir = useRef(new THREE.Vector3()).current
  const scratchPrevLocalDir = useRef(new THREE.Vector3()).current
  const scratchDeltaLocal = useRef(new THREE.Vector3()).current
  const scratchInvCamQuat = useRef(new THREE.Quaternion()).current
  const scratchInvPanelQuat = useRef(new THREE.Quaternion()).current
  const scratchThemeColor = useRef(new THREE.Color()).current
  const scratchHighlightColor = useRef(new THREE.Color()).current
  const scratchTargetBlur = useRef({ x: 0, y: 0 }).current

  useEffect(() => {
    lastCurveFactorRef.current = 1.0
  }, [panelGeos])

  useFrame(({ camera, viewport }, delta) => {
    if (!groupRef.current || isPaused) return

    const reducedMotion = reducedMotionRef.current
    const targetFlight = isSelected ? 1.0 : 0.0
    let fp = THREE.MathUtils.damp(flightProgress.current, targetFlight, transitSpeed, delta)
    if (isSelected && fp > 0.992) {
      fp = 1.0
    } else if (!isSelected && fp < 0.001) {
      fp = 0.0
    }
    flightProgress.current = fp

    // Flatten cylindrical curvature during fly-in (1.0 -> 0.0) and re-curve on fly-out
    const curveFactor = fp <= 0.001 ? 1.0 : fp >= 0.992 ? 0.0 : Math.max(0.0, 1.0 - fp)
    if (Math.abs(curveFactor - lastCurveFactorRef.current) > 0.0005) {
      applyPanelCurvature(panelGeos, curveFactor)
      lastCurveFactorRef.current = curveFactor
    }

    // 1. Snappy time-based radial contraction (4.5x in deep space -> 1.0x resting sphere in 0.40s)
    if (!introCollapse || reducedMotion || isSelected) {
      introExpand.current = 0.0
    } else if (introExpand.current > 0.001) {
      introElapsedRef.current = Math.min(
        INTRO_DURATION_SEC,
        introElapsedRef.current + Math.min(delta, 0.05)
      )
      const t = introElapsedRef.current / INTRO_DURATION_SEC
      introExpand.current = t >= 1 ? 0.0 : Math.pow(1 - t, 1.35)
    }

    // 2. Radial scatter progress for non-selected panels when another item is selected
    const shouldScatter = isDimmed && !isSelected && scatterOnSelect && !reducedMotion
    scatterExpand.current = THREE.MathUtils.damp(scatterExpand.current, shouldScatter ? 1.0 : 0.0, 6.0, delta)
    const ep = Math.max(introExpand.current, scatterExpand.current)

    // 3. Visibility management (keep scattering panels visible until faded into darkness)
    if (!scatterOnSelect || reducedMotion) {
      groupRef.current.visible = !isDimmed || isSelected
    } else if (isDimmed && !isSelected) {
      groupRef.current.visible = ep < 0.98
    } else {
      groupRef.current.visible = true
    }

    // 4. Radial displacement + ambient float + fly-to-center interpolation
    const radialMult = 1.0 + ep * 3.5
    scratchScatterPos.copy(initialPosition).multiplyScalar(radialMult)

    if (ambientFloat && !isSelected && !reducedMotion && ep < 0.5) {
      ambientClockRef.current += delta
      scratchScatterPos.y += Math.sin(ambientClockRef.current * 1.1 + itemIndex * 0.7) * 0.015 * (1.0 - ep)
    }

    if (groupRef.current.position && groupRef.current.quaternion && groupRef.current.scale) {
      if (fp > 0.001) {
        scratchCenterPos.set(0, 0, -2.15).applyMatrix4(camera.matrixWorld)
        groupRef.current.position.lerpVectors(scratchScatterPos, scratchCenterPos, fp)
        groupRef.current.quaternion.slerpQuaternions(initialQuaternion, camera.quaternion, fp)
      } else {
        groupRef.current.position.copy(scratchScatterPos)
        groupRef.current.quaternion.copy(initialQuaternion)
      }

      const persCam = camera as THREE.PerspectiveCamera
      const fovYRad = THREE.MathUtils.degToRad(persCam.fov || 46)
      const frustumHeight = 2 * 2.15 * Math.tan(fovYRad / 2)
      const aspect = persCam.aspect || (viewport ? viewport.aspect : 16 / 9)
      const frustumWidth = frustumHeight * aspect

      const maxW = 0.90 * frustumWidth
      const maxH = 0.80 * frustumHeight

      const itemAspect = panelWidth / panelHeight
      let targetW = maxW
      let targetH = targetW / itemAspect
      if (targetH > maxH) {
        targetH = maxH
      }

      const fullScreenScale = targetH / panelHeight
      hoverScaleRef.current = THREE.MathUtils.damp(
        hoverScaleRef.current,
        effectiveFocused && !isDimmed ? 1.05 : 1.0,
        10,
        delta
      )
      const restingScale = hoverScaleRef.current * thumbnailScale
      const targetScale = THREE.MathUtils.lerp(restingScale, fullScreenScale, fp)

      if (fp > 0.001) {
        groupRef.current.scale.set(targetScale, targetScale, targetScale)
      } else {
        groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 10, delta)
        groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 10, delta)
        groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 10, delta)
      }
    }

    // 5. Intro fade-in, scatter fade-into-darkness, and directional motion blur
    const introOpacity = 1.0 - THREE.MathUtils.smoothstep(introExpand.current, 0.72, 1.0)
    const scatterFade =
      isDimmed && !isSelected && scatterOnSelect && !reducedMotion
        ? 1.0 - THREE.MathUtils.smoothstep(scatterExpand.current, 0.05, 0.85)
        : 1.0
    const panelBrightness = isSelected ? 1.0 : scatterFade
    const panelOpacity = isSelected
      ? 1.0
      : !scatterOnSelect && isDimmed
      ? 0.0
      : Math.min(introOpacity, scatterFade)

    scratchInvCamQuat.copy(camera.quaternion).invert()
    scratchLocalDir.copy(initialPosition).normalize().applyQuaternion(scratchInvCamQuat)

    if (!hasPrevLocalRef.current || !motionBlur || isSelected || reducedMotion) {
      scratchPrevLocalDir.copy(scratchLocalDir)
      hasPrevLocalRef.current = true
      smoothBlurRef.current.x = 0
      smoothBlurRef.current.y = 0
    } else {
      scratchDeltaLocal.copy(scratchLocalDir).sub(scratchPrevLocalDir)
      scratchPrevLocalDir.copy(scratchLocalDir)
      scratchInvPanelQuat.copy(initialQuaternion).invert()
      scratchDeltaLocal.applyQuaternion(camera.quaternion).applyQuaternion(scratchInvPanelQuat)

      computePanelSurfaceBlur(
        scratchDeltaLocal,
        delta,
        panelWidth,
        panelHeight,
        sphereRadius,
        scratchTargetBlur
      )

      smoothBlurRef.current.x = THREE.MathUtils.damp(smoothBlurRef.current.x, scratchTargetBlur.x, 22, delta)
      smoothBlurRef.current.y = THREE.MathUtils.damp(smoothBlurRef.current.y, scratchTargetBlur.y, 22, delta)
      if (Math.abs(smoothBlurRef.current.x) < 0.002) smoothBlurRef.current.x = 0
      if (Math.abs(smoothBlurRef.current.y) < 0.002) smoothBlurRef.current.y = 0
    }

    const blurX = smoothBlurRef.current.x
    const blurY = smoothBlurRef.current.y

    screenUniforms.uOpacity.value = panelOpacity
    screenUniforms.uBrightness.value = panelBrightness
    screenUniforms.uBlurVec.value.set(blurX, blurY)
    if (screenMatRef.current) {
      if (screenMatRef.current.uniforms) {
        if (screenMatRef.current.uniforms.uOpacity) {
          screenMatRef.current.uniforms.uOpacity.value = panelOpacity
        }
        if (screenMatRef.current.uniforms.uBrightness) {
          screenMatRef.current.uniforms.uBrightness.value = panelBrightness
        }
        if (screenMatRef.current.uniforms.uBlurVec) {
          screenMatRef.current.uniforms.uBlurVec.value.set(blurX, blurY)
        }
      }
      screenMatRef.current.depthWrite = panelOpacity >= 0.98
    }

    if (backingMatRef.current) {
      backingMatRef.current.opacity = panelOpacity
      backingMatRef.current.depthWrite = panelOpacity >= 0.98
    }

    const isVideo = itemType === 'video'
    const isHighlighted = effectiveFocused && !isDimmed

    if (borderMatRef.current) {
      scratchThemeColor.set(isHighlighted ? highlightColorHex : themeColorHex)
      borderMatRef.current.color.copy(scratchThemeColor)
      const baseBorderOpacity = isHighlighted ? 0.95 : 0.40
      borderMatRef.current.opacity = isSelected ? 0.50 : baseBorderOpacity * panelOpacity
    }

    // 6. Orthogonal 90° corner reticle highlight opacity
    const targetReticleOp = focusReticles && isHighlighted ? 0.95 * panelOpacity : 0.0
    reticleOpacity.current = THREE.MathUtils.damp(reticleOpacity.current, targetReticleOp, 14, delta)
    if (reticleMatRef.current) {
      scratchThemeColor.set(highlightColorHex)
      reticleMatRef.current.color.copy(scratchThemeColor)
      reticleMatRef.current.opacity = reticleOpacity.current
    }

    if (isVideo) {
      const playIconFactor = Math.max(0, 1.0 - fp * 2)
      scratchThemeColor.set(isHighlighted ? highlightColorHex : themeColorHex)
      if (playRingMatRef.current) {
        playRingMatRef.current.color.copy(scratchThemeColor)
        playRingMatRef.current.opacity = (isHighlighted ? 1.0 : 0.65) * playIconFactor * panelOpacity
      }
      if (playTriMatRef.current) {
        playTriMatRef.current.color.copy(scratchThemeColor)
        playTriMatRef.current.opacity = (isHighlighted ? 1.0 : 0.65) * playIconFactor * panelOpacity
      }
    }

    // 7. Seamless 3D-to-2D title flight: un-curve, match 2D HUD position/scale, and hand off cleanly
    const persCamForTitle = camera as THREE.PerspectiveCamera
    const titleFovRad = THREE.MathUtils.degToRad(persCamForTitle.fov || 46)
    const titleFrustumH = 2 * 2.15 * Math.tan(titleFovRad / 2)
    const restingTitleY = -panelHeight / 2 - 0.10

    if (titleGroupRef.current?.position && titleGroupRef.current?.scale) {
      if (fp > 0.001) {
        const titleItemAspect = panelWidth / panelHeight
        const titleCamAspect = persCamForTitle.aspect || (viewport ? viewport.aspect : 16 / 9)
        const titleFrustumW = titleFrustumH * titleCamAspect
        const maxTitleW = 0.90 * titleFrustumW
        const maxTitleH = 0.80 * titleFrustumH
        let titleTargetH = maxTitleW / titleItemAspect
        if (titleTargetH > maxTitleH) titleTargetH = maxTitleH
        const safeFullScale = Math.max(0.01, titleTargetH / panelHeight)

        const winW = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1280
        const winH = typeof window !== 'undefined' && window.innerHeight ? window.innerHeight : 800
        const pxToWorld = titleFrustumH / winH
        const isMd = winW >= 768
        const isSm = winW >= 640
        const targetFontPx = isMd ? 18 : 16
        const bottomPadPx = isMd ? 24 : 12
        const bottomOffsetPx = isSm ? bottomPadPx + 15 : bottomPadPx + 54
        const camTargetY = -titleFrustumH / 2 + (bottomOffsetPx + targetFontPx * 0.65) * pxToWorld
        const localTargetY = camTargetY / safeFullScale
        const localTargetScale = (targetFontPx * pxToWorld) / (0.082 * safeFullScale)

        titleGroupRef.current.position.set(0, THREE.MathUtils.lerp(restingTitleY, localTargetY, fp), 0)
        const ts = THREE.MathUtils.lerp(1.0, localTargetScale, fp)
        titleGroupRef.current.scale.set(ts, ts, ts)
      } else {
        titleGroupRef.current.position.set(0, restingTitleY, 0)
        titleGroupRef.current.scale.set(1, 1, 1)
      }
    }

    if (textRef.current) {
      if ('curveRadius' in textRef.current) {
        textRef.current.curveRadius =
          curveFactor <= 0.001 ? 0 : panelCurveRadius / Math.max(0.05, curveFactor)
      }
      textRef.current.visible = !(isSelected && isOverlayActive)
      if (fp > 0.001) {
        scratchThemeColor.set(isHighlighted ? highlightColorHex : themeColorHex)
        scratchHighlightColor.set(highlightColorHex)
        scratchThemeColor.lerp(scratchHighlightColor, fp)
        textRef.current.color = scratchThemeColor
      }
      if (typeof textRef.current.fillOpacity === 'number') {
        const textBaseOpacity = isHighlighted ? 1.0 : 0.75
        textRef.current.fillOpacity = isSelected
          ? THREE.MathUtils.lerp(textBaseOpacity, 1.0, fp)
          : textBaseOpacity * panelOpacity
      }
    }
  })

  const mountPosition = useMemo(
    () =>
      introCollapse && !reducedMotionRef.current
        ? initialPosition.clone().multiplyScalar(4.5)
        : initialPosition,
    [initialPosition, introCollapse]
  )

  return { mountPosition }
}
