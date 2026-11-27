import React from 'react'
import type { ThemeColor } from '@/context/ThemeContext'
import type { GeometryMode, AllGeometryParams } from '@/features/topologies/config/geometryConfig'
import { HaloMenuRing } from '@/features/topologies/menus/HaloMenuRing'
import { TrefoilMenu } from '@/features/topologies/menus/TrefoilMenu'
import { TesseractMenu } from '@/features/topologies/menus/TesseractMenu'
import { AstrolabeMenu } from '@/features/topologies/menus/AstrolabeMenu'
import { LorenzMenu } from '@/features/topologies/menus/LorenzMenu'
import { OrigamiMenu } from '@/features/topologies/menus/OrigamiMenu'
import { SlingshotMenu } from '@/features/topologies/menus/SlingshotMenu'
import { HelixMenu } from '@/features/topologies/menus/HelixMenu'

export interface GeometryDispatcherProps {
  mode: GeometryMode
  params: AllGeometryParams
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  isPaused?: boolean
  theme?: ThemeColor
}

interface TopologyMenuSharedProps<M extends GeometryMode> {
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching: boolean
  isPaused: boolean
  theme?: ThemeColor
  params: AllGeometryParams[M]
}

const PARAM_MENU_COMPONENTS: {
  [K in Exclude<GeometryMode, 'halo'>]: React.ComponentType<TopologyMenuSharedProps<K>>
} = {
  trefoil: TrefoilMenu,
  tesseract: TesseractMenu,
  astrolabe: AstrolabeMenu,
  lorenz: LorenzMenu,
  origami: OrigamiMenu,
  slingshot: SlingshotMenu,
  helix: HelixMenu,
}

/**
 * Dispatches the active 3D navigation topology component for the selected `mode`,
 * falling back to `HaloMenuRing` for `'halo'` or unknown modes.
 */
export const GeometryDispatcher: React.FC<GeometryDispatcherProps> = ({
  mode,
  params,
  isExpanded,
  onSelect,
  isGlitching = false,
  isPaused = false,
  theme,
}) => {
  if (mode !== 'halo' && mode in PARAM_MENU_COMPONENTS) {
    const ActiveMenu = PARAM_MENU_COMPONENTS[mode] as React.ComponentType<
      TopologyMenuSharedProps<typeof mode>
    >
    return (
      <ActiveMenu
        isExpanded={isExpanded}
        onSelect={onSelect}
        isGlitching={isGlitching}
        isPaused={isPaused}
        theme={theme}
        params={params[mode]}
      />
    )
  }

  return (
    <HaloMenuRing
      isExpanded={isExpanded}
      onSelect={onSelect}
      isGlitching={isGlitching}
      isPaused={isPaused}
      theme={theme}
      speed={params.halo.speed}
      radiusScale={params.halo.radius}
      debugRing={params.halo.showGuide}
      tilt={params.halo.tilt}
      yaw={params.halo.yaw}
      guideWidth={params.halo.guideWidth}
      guideStyle={params.halo.guideStyle}
      params={params.halo}
    />
  )
}
