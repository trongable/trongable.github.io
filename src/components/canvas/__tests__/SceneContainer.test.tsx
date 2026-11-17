import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SceneContainer } from '../SceneContainer'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useThree: () => ({
    camera: { position: { x: 0, y: 2.55, z: 5.45 }, lookAt: vi.fn() },
    pointer: { x: 0, y: 0 },
  }),
  useFrame: vi.fn(),
}))

vi.mock('../ParticleField', () => ({
  ParticleField: () => <div data-testid="particle-field" />,
}))

describe('SceneContainer Component', () => {
  it('renders canvas and children properly', () => {
    render(
      <SceneContainer>
        <div data-testid="child-content">test child</div>
      </SceneContainer>
    )

    expect(screen.getByTestId('scene-container')).toBeInTheDocument()
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('particle-field')).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
  })

  it('applies glitch translation class when isGlitching is true', () => {
    render(
      <SceneContainer isGlitching={true}>
        <div>content</div>
      </SceneContainer>
    )

    const container = screen.getByTestId('scene-container')
    expect(container.className).toContain('translate-x-[1.5px]')
  })
})
