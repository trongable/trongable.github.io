import React from 'react'
import { ThemeColor } from '@/context/ThemeContext'
import { GeometryMode, AllGeometryParams } from './geometryConfig'
import { HaloMenuRing } from './HaloMenuRing'
import { TrefoilMenu } from './TrefoilMenu'
import { TesseractMenu } from './TesseractMenu'
import { AstrolabeMenu } from './AstrolabeMenu'
import { LorenzMenu } from './LorenzMenu'
import { OrigamiMenu } from './OrigamiMenu'
import { SlingshotMenu } from './SlingshotMenu'
import { HelixMenu } from './HelixMenu'

export interface GeometryDispatcherProps {
  mode: GeometryMode
  params: AllGeometryParams
  isExpanded: boolean
  onSelect: (path: string) => void
  isGlitching?: boolean
  theme?: ThemeColor
}

export const GeometryDispatcher: React.FC<GeometryDispatcherProps> = ({
  mode,
  params,
  isExpanded,
  onSelect,
  isGlitching = false,
  theme,
}) => {
  switch (mode) {
    case 'trefoil':
      return (
        <TrefoilMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.trefoil}
        />
      )

    case 'tesseract':
      return (
        <TesseractMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.tesseract}
        />
      )

    case 'astrolabe':
      return (
        <AstrolabeMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.astrolabe}
        />
      )

    case 'lorenz':
      return (
        <LorenzMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.lorenz}
        />
      )

    case 'origami':
      return (
        <OrigamiMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.origami}
        />
      )

    case 'slingshot':
      return (
        <SlingshotMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.slingshot}
        />
      )

    case 'helix':
      return (
        <HelixMenu
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          params={params.helix}
        />
      )

    case 'halo':
    default:
      return (
        <HaloMenuRing
          isExpanded={isExpanded}
          onSelect={onSelect}
          isGlitching={isGlitching}
          theme={theme}
          speed={params.halo.speed}
          radiusScale={params.halo.radius}
        />
      )
  }
}
