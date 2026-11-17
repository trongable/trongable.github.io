import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GeometryDispatcher } from '../GeometryDispatcher'
import { DEFAULT_GEOMETRY_PARAMS, GeometryMode } from '../geometryConfig'

vi.mock('../HaloMenuRing', () => ({
  HaloMenuRing: () => <div data-testid="geo-halo" />,
}))
vi.mock('../TrefoilMenu', () => ({
  TrefoilMenu: () => <div data-testid="geo-trefoil" />,
}))
vi.mock('../TesseractMenu', () => ({
  TesseractMenu: () => <div data-testid="geo-tesseract" />,
}))
vi.mock('../AstrolabeMenu', () => ({
  AstrolabeMenu: () => <div data-testid="geo-astrolabe" />,
}))
vi.mock('../LorenzMenu', () => ({
  LorenzMenu: () => <div data-testid="geo-lorenz" />,
}))
vi.mock('../OrigamiMenu', () => ({
  OrigamiMenu: () => <div data-testid="geo-origami" />,
}))
vi.mock('../SlingshotMenu', () => ({
  SlingshotMenu: () => <div data-testid="geo-slingshot" />,
}))
vi.mock('../HelixMenu', () => ({
  HelixMenu: () => <div data-testid="geo-helix" />,
}))

describe('GeometryDispatcher Component', () => {
  const modes: GeometryMode[] = [
    'halo',
    'trefoil',
    'tesseract',
    'astrolabe',
    'lorenz',
    'origami',
    'slingshot',
    'helix',
  ]

  modes.forEach((mode) => {
    it(`dispatches to the correct component for mode: ${mode}`, () => {
      render(
        <GeometryDispatcher
          mode={mode}
          params={DEFAULT_GEOMETRY_PARAMS}
          isExpanded={true}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByTestId(`geo-${mode}`)).toBeInTheDocument()
    })
  })

  it('falls back to HaloMenuRing for unknown mode', () => {
    render(
      <GeometryDispatcher
        // @ts-expect-error Testing invalid fallback
        mode="unknown_mode"
        params={DEFAULT_GEOMETRY_PARAMS}
        isExpanded={true}
        onSelect={vi.fn()}
      />
    )

    expect(screen.getByTestId('geo-halo')).toBeInTheDocument()
  })
})
