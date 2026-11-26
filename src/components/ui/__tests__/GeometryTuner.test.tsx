import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tuner as GeometryTuner } from '@/components/ui/Tuner'
import { DEFAULT_GEOMETRY_PARAMS } from '@/components/canvas/geometries/geometryConfig'

describe('GeometryTuner Component', () => {
  it('renders the current active mode label', () => {
    render(
      <GeometryTuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    expect(screen.getByText('geo:')).toBeInTheDocument()
    expect(screen.getByText('halo')).toBeInTheDocument()
  })

  it('calls onModeChange with next mode when clicking the mode cycle button', () => {
    const onModeChange = vi.fn()
    render(
      <GeometryTuner
        activeMode="halo"
        onModeChange={onModeChange}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    const cycleButton = screen.getByRole('button', { name: /Current geometry: Halo Ring/i })
    fireEvent.click(cycleButton)

    // Next mode after halo is trefoil
    expect(onModeChange).toHaveBeenCalledWith('trefoil')
  })

  it('toggles parameter drawer when clicking the gear icon', () => {
    render(
      <GeometryTuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    const gearButton = screen.getByLabelText('Toggle parameter drawer')

    // Initially closed
    expect(screen.queryByTestId('geometry-tuner-drawer')).not.toBeInTheDocument()

    // Click to open
    fireEvent.click(gearButton)
    expect(screen.getByTestId('geometry-tuner-drawer')).toBeInTheDocument()

    // Click to close
    fireEvent.click(gearButton)
    expect(screen.queryByTestId('geometry-tuner-drawer')).not.toBeInTheDocument()
  })

  it('invokes onParamChange when adjusting a slider in the drawer', () => {
    const onParamChange = vi.fn()
    render(
      <GeometryTuner
        activeMode="trefoil"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    // Open drawer
    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))

    const speedLabel = screen.getByText('transit speed')
    const speedSlider = speedLabel.closest('div')?.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
    expect(speedSlider).toBeInTheDocument()

    fireEvent.change(speedSlider, { target: { value: '0.35' } })
    expect(onParamChange).toHaveBeenCalledWith('trefoil', 'speed', 0.35)
  })

  it('calls onResetParams when clicking reset', () => {
    const onResetParams = vi.fn()
    render(
      <GeometryTuner
        activeMode="tesseract"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={onResetParams}
      />
    )

    // Open drawer
    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))

    const resetButton = screen.getByRole('button', { name: /Reset.*to Defaults/i })
    fireEvent.click(resetButton)

    expect(onResetParams).toHaveBeenCalledWith('tesseract')
  })
})
