import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CerebroSphereWall } from '../CerebroSphereWall'
import { ThemeProvider } from '@/context/ThemeContext'
import { runFrames, clearFrameRegistry } from '@/testUtils/r3fTestUtils'

describe('CerebroSphereWall Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
  })

  it('renders within the 3D scene without crashing', () => {
    render(
      <ThemeProvider>
        <CerebroSphereWall />
      </ThemeProvider>
    )

    expect(screen.getByTestId('cerebro-sphere-wall')).toBeInTheDocument()
  })

  it('renders when dimmed during active video playback', () => {
    render(
      <ThemeProvider>
        <CerebroSphereWall isDimmed={true} />
      </ThemeProvider>
    )

    expect(screen.getByTestId('cerebro-sphere-wall')).toBeInTheDocument()
  })

  it('animates floating synaptic particles during frame step', () => {
    render(
      <ThemeProvider>
        <CerebroSphereWall />
      </ThemeProvider>
    )

    // Run animation frames
    act(() => {
      runFrames(10, 0.016)
    })

    expect(screen.getByTestId('cerebro-sphere-wall')).toBeInTheDocument()
  })
})
