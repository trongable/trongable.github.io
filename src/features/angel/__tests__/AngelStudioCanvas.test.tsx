import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AngelStudioCanvas } from '@/features/angel/AngelStudioCanvas'
import { DEFAULT_ANGEL_CONFIG } from '@/features/angel/angelCatalog'

vi.mock('@/features/angel/AngelAvatarRig', () => ({
  AngelAvatarRig: () => <div data-testid="mock-angel-rig" />,
}))

describe('AngelStudioCanvas', () => {
  it('renders canvas, switches camera focus presets, and respects sleeping frameloop', () => {
    const canvasRef = React.createRef<HTMLCanvasElement | null>()

    const { rerender } = render(
      <AngelStudioCanvas
        config={DEFAULT_ANGEL_CONFIG}
        primaryColorHex="#e2f872"
        highlightColorHex="#f5ff9e"
        focusPreset="full"
        isTurntableActive={false}
        canvasRef={canvasRef}
      />
    )

    expect(screen.getByTestId('angel-studio-canvas')).toBeInTheDocument()
    const r3fCanvas = screen.getByTestId('r3f-canvas')
    expect(r3fCanvas.getAttribute('data-frameloop')).toBe('demand')

    rerender(
      <AngelStudioCanvas
        config={DEFAULT_ANGEL_CONFIG}
        primaryColorHex="#e2f872"
        highlightColorHex="#f5ff9e"
        focusPreset="face"
        isTurntableActive={true}
        targetFps={null}
      />
    )
    expect(screen.getByTestId('r3f-canvas').getAttribute('data-frameloop')).toBe('always')

    rerender(
      <AngelStudioCanvas
        config={DEFAULT_ANGEL_CONFIG}
        primaryColorHex="#e2f872"
        highlightColorHex="#f5ff9e"
        focusPreset="feet"
        isTurntableActive={false}
        isSleeping={true}
      />
    )
    expect(screen.getByTestId('r3f-canvas').getAttribute('data-frameloop')).toBe('never')
  })
})
