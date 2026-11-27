import type React from 'react'
import * as THREE from 'three'

/**
 * Smoothly interpolates a topology group's scale and opacity toward expanded or
 * collapsed state in-place, enforcing the energy-governance sleep guard.
 *
 * @returns `true` when collapsed and fully shrunk (`<= 0.051`), signaling the
 * caller's `useFrame` loop to exit early and skip all math/buffer writes.
 */
export function updateExpandCollapse(
  group: THREE.Group,
  currentScale: React.MutableRefObject<number>,
  currentOpacity: React.MutableRefObject<number>,
  isExpanded: boolean,
  delta: number
): boolean {
  const targetScale = isExpanded ? 1 : 0.05
  const targetOpacity = isExpanded ? 1 : 0
  const alpha = Math.min(delta * 4.5, 1)

  currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, alpha)
  currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, alpha)

  group.scale.setScalar(currentScale.current)
  group.visible = currentScale.current > 0.06

  // Sleep guard: bypass calculations when collapsed and fully shrunk
  if (!isExpanded && currentScale.current <= 0.051) {
    if (group.visible) group.visible = false
    return true
  }

  return false
}
