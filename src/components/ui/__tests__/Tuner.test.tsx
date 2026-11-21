import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tuner } from '../Tuner'
import { DEFAULT_GEOMETRY_PARAMS } from '@/components/canvas/geometries/geometryConfig'

describe('Tuner Component', () => {
  it('renders the current active mode label', () => {
    render(
      <Tuner
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

  it('calls onModeChange when clicking the cycle button', () => {
    const onModeChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={onModeChange}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    const cycleButton = screen.getByRole('button', { name: /Current geometry: Halo Ring/i })
    fireEvent.click(cycleButton)
    expect(onModeChange).toHaveBeenCalledWith('trefoil')
  })

  it('toggles drawer when clicking the gear button', () => {
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    const gearButton = screen.getByLabelText('Toggle parameter drawer')
    expect(screen.queryByTestId('geometry-tuner-drawer')).not.toBeInTheDocument()

    fireEvent.click(gearButton)
    expect(screen.getByTestId('geometry-tuner-drawer')).toBeInTheDocument()

    fireEvent.click(gearButton)
    expect(screen.queryByTestId('geometry-tuner-drawer')).not.toBeInTheDocument()
  })

  it('switches between 3D Topologies and VFX & Glitch tabs', () => {
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    // Open drawer
    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))

    // Initially on 3D Topologies tab
    expect(screen.getByText('Halo Ring')).toBeInTheDocument()
    expect(screen.getByText('radius scale')).toBeInTheDocument()

    // Switch to VFX & Glitch tab
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))
    expect(screen.getByText('Preset Palettes')).toBeInTheDocument()
    expect(screen.getByText('Glitch Interval')).toBeInTheDocument()
    expect(screen.getByText('Memory Picture Rate')).toBeInTheDocument()
  })

  it('invokes onThemeChange when clicking a theme button in VFX tab', () => {
    const onThemeChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        currentThemeId="yellow"
        onThemeChange={onThemeChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    const purpleBtn = screen.getByRole('button', { name: /Purple/i })
    fireEvent.click(purpleBtn)
    expect(onThemeChange).toHaveBeenCalledWith('purple')

    const tealBtn = screen.getByRole('button', { name: /Teal/i })
    fireEvent.click(tealBtn)
    expect(onThemeChange).toHaveBeenCalledWith('teal')
  })

  it('invokes onGlitchIntervalChange when adjusting the glitch interval slider', () => {
    const onGlitchIntervalChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        glitchInterval={8}
        onGlitchIntervalChange={onGlitchIntervalChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    const slider = screen.getByLabelText('Glitch Interval')
    fireEvent.change(slider, { target: { value: '4' } })
    expect(onGlitchIntervalChange).toHaveBeenCalledWith(4)
  })

  it('invokes onImageRateChange when adjusting the memory picture rate slider', () => {
    const onImageRateChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        imageRate={1.0}
        onImageRateChange={onImageRateChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    const slider = screen.getByLabelText('Memory Picture Rate')
    fireEvent.change(slider, { target: { value: '50' } })
    expect(onImageRateChange).toHaveBeenCalledWith(0.5)
  })

  it('invokes onTriggerGlitch when clicking the trigger glitch button', () => {
    const onTriggerGlitch = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        onTriggerGlitch={onTriggerGlitch}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    const triggerBtn = screen.getByRole('button', { name: /Trigger Glitch/i })
    fireEvent.click(triggerBtn)
    expect(onTriggerGlitch).toHaveBeenCalled()
  })

  it('invokes onResetParams when clicking reset in Topologies tab', () => {
    const onResetParams = vi.fn()
    render(
      <Tuner
        activeMode="tesseract"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={onResetParams}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    const resetBtn = screen.getByRole('button', { name: /Reset.*to Defaults/i })
    fireEvent.click(resetBtn)
    expect(onResetParams).toHaveBeenCalledWith('tesseract')
  })

  it('renders with z-[60] to remain elevated above the glitch overlay', () => {
    const { container } = render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
      />
    )

    const tunerRoot = container.firstChild as HTMLElement
    expect(tunerRoot).toHaveClass('z-[60]')
  })

  it('handles custom hex input and updates via onCustomColorChange', () => {
    const onCustomColorChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        currentThemePrimary="#e2f872"
        currentThemeHighlight="#f5ff9e"
        onCustomColorChange={onCustomColorChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    const hexInput = screen.getByLabelText('Custom Hex Input')
    expect(hexInput).toBeInTheDocument()

    // Enter a valid 6-char hex
    fireEvent.change(hexInput, { target: { value: '#2e6f70' } })
    expect(onCustomColorChange).toHaveBeenCalledWith('#2e6f70')
  })

  it('displays computed palette and handles lock theme toggle', () => {
    const onToggleThemeLock = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        currentThemePrimary="#2e6f70"
        isThemeLocked={false}
        onToggleThemeLock={onToggleThemeLock}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    expect(screen.getByText('Computed Palette:')).toBeInTheDocument()
    expect(screen.getByText('Auto Highlight:')).toBeInTheDocument()

    const lockCheckbox = screen.getByLabelText('Lock Theme')
    expect(lockCheckbox).not.toBeChecked()

    fireEvent.click(lockCheckbox)
    expect(onToggleThemeLock).toHaveBeenCalledWith(true)
  })

  it('renders Power & Performance controls and triggers onPowerModeChange', () => {
    const onPowerModeChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        powerMode="auto"
        onPowerModeChange={onPowerModeChange}
        isBattery={true}
        targetFps={null}
        targetDpr={1.0}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    expect(screen.getByText('Power & Performance')).toBeInTheDocument()
    expect(screen.getByText('🔋 Battery')).toBeInTheDocument()
    expect(screen.getByText(/Target: Uncapped/i)).toBeInTheDocument()
    expect(screen.getByText(/DPR: 1x/i)).toBeInTheDocument()

    const uncappedBtn = screen.getByRole('button', { name: 'Power mode: uncapped' })
    fireEvent.click(uncappedBtn)
    expect(onPowerModeChange).toHaveBeenCalledWith('uncapped')

    const ecoBtn = screen.getByRole('button', { name: 'Power mode: eco' })
    fireEvent.click(ecoBtn)
    expect(onPowerModeChange).toHaveBeenCalledWith('eco')
  })

  it('adjusts halo tilt, yaw, width, and guide styles in the tuner', () => {
    const onParamChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))

    expect(screen.getByText('tilt / upright')).toBeInTheDocument()
    expect(screen.getByText('yaw')).toBeInTheDocument()
    expect(screen.getByText('guide width')).toBeInTheDocument()
    expect(screen.getByText('guide style')).toBeInTheDocument()

    // Test clicking a guide style button (e.g. 'cage' / wireframe)
    const cageBtn = screen.getByRole('button', { name: 'cage' })
    fireEvent.click(cageBtn)
    expect(onParamChange).toHaveBeenCalledWith('halo', 'guideStyle', 'wireframe')

    // Test clicking 'glow' style button
    const glowBtn = screen.getByRole('button', { name: 'glow' })
    fireEvent.click(glowBtn)
    expect(onParamChange).toHaveBeenCalledWith('halo', 'guideStyle', 'glow')

    // Test unchecking show guide ring (starts checked true by default)
    const showGuideCheckbox = screen.getByRole('checkbox', { name: 'show guide ring' })
    expect(showGuideCheckbox).toBeChecked()
    fireEvent.click(showGuideCheckbox)
    expect(onParamChange).toHaveBeenCalledWith('halo', 'showGuide', false)
  })

  it('adjusts coil style and width for helix in tuner', () => {
    const onParamChange = vi.fn()
    render(
      <Tuner
        activeMode="helix"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('coil width')).toBeInTheDocument()
    expect(screen.getByText('coil style')).toBeInTheDocument()

    const ribbedBtn = screen.getByRole('button', { name: 'ribbed' })
    fireEvent.click(ribbedBtn)
    expect(onParamChange).toHaveBeenCalledWith('helix', 'coilStyle', 'ribbed')
  })

  it('adjusts orbit style and width for slingshot in tuner', () => {
    const onParamChange = vi.fn()
    render(
      <Tuner
        activeMode="slingshot"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('orbit width')).toBeInTheDocument()
    expect(screen.getByText('orbit style')).toBeInTheDocument()

    const dotsBtn = screen.getByRole('button', { name: 'dots' })
    fireEvent.click(dotsBtn)
    expect(onParamChange).toHaveBeenCalledWith('slingshot', 'orbitStyle', 'points')
  })

  it('adjusts wire style for tesseract in tuner', () => {
    const onParamChange = vi.fn()
    render(
      <Tuner
        activeMode="tesseract"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('wire style')).toBeInTheDocument()

    const dashBtn = screen.getByRole('button', { name: 'dash' })
    fireEvent.click(dashBtn)
    expect(onParamChange).toHaveBeenCalledWith('tesseract', 'wireStyle', 'dashed')
  })

  it('adjusts trail style for lorenz in tuner', () => {
    const onParamChange = vi.fn()
    render(
      <Tuner
        activeMode="lorenz"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('trail style')).toBeInTheDocument()

    const dotsBtn = screen.getByRole('button', { name: 'dots' })
    fireEvent.click(dotsBtn)
    expect(onParamChange).toHaveBeenCalledWith('lorenz', 'trailStyle', 'points')
  })

  it('adjusts facet style for origami in tuner', () => {
    const onParamChange = vi.fn()
    render(
      <Tuner
        activeMode="origami"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={onParamChange}
        onResetParams={vi.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('facet style')).toBeInTheDocument()

    const solidBtn = screen.getByRole('button', { name: 'solid' })
    fireEvent.click(solidBtn)
    expect(onParamChange).toHaveBeenCalledWith('origami', 'wireStyle', 'solid')
  })

  it('renders all 6 Sonny 3D container buttons and triggers onSonnyContainerChange', () => {
    const onSonnyContainerChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        sonnyContainer="diorama"
        onSonnyContainerChange={onSonnyContainerChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('Sonny 3D Container')).toBeInTheDocument()

    const dioramaBtn = screen.getByTestId('sonny-container-diorama')
    const pedestalBtn = screen.getByTestId('sonny-container-pedestal')
    const capsuleBtn = screen.getByTestId('sonny-container-capsule')
    const wireboxBtn = screen.getByTestId('sonny-container-wirebox')
    const crystalBtn = screen.getByTestId('sonny-container-crystal')
    const noneBtn = screen.getByTestId('sonny-container-none')

    expect(dioramaBtn).toBeInTheDocument()
    expect(pedestalBtn).toBeInTheDocument()
    expect(capsuleBtn).toBeInTheDocument()
    expect(wireboxBtn).toBeInTheDocument()
    expect(crystalBtn).toBeInTheDocument()
    expect(noneBtn).toBeInTheDocument()

    fireEvent.click(capsuleBtn)
    expect(onSonnyContainerChange).toHaveBeenCalledWith('capsule')

    fireEvent.click(crystalBtn)
    expect(onSonnyContainerChange).toHaveBeenCalledWith('crystal')
  })

  it('renders Distance Labels (HUD) toggle and calls onToggleShowDistance', () => {
    const onToggleShowDistance = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        showDistance={false}
        onToggleShowDistance={onToggleShowDistance}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('Distance Labels (HUD)')).toBeInTheDocument()

    const toggleBtn = screen.getByTestId('toggle-distance-labels')
    expect(toggleBtn).toHaveTextContent('OFF')

    fireEvent.click(toggleBtn)
    expect(onToggleShowDistance).toHaveBeenCalledWith(true)
  })

  it('renders distance metric buttons when showDistance is true and handles selection', () => {
    const onDistanceMetricChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        showDistance={true}
        distanceMetric="euclid"
        onDistanceMetricChange={onDistanceMetricChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByTestId('metric-euclid')).toBeInTheDocument()
    expect(screen.getByTestId('metric-depth')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('metric-depth'))
    expect(onDistanceMetricChange).toHaveBeenCalledWith('depth')
  })

  it('renders Coords (XYZ) toggle when showDistance is true and handles click', () => {
    const onToggleShowCoordinates = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        showDistance={true}
        showCoordinates={true}
        onToggleShowCoordinates={onToggleShowCoordinates}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    const coordsBtn = screen.getByTestId('toggle-coords')
    expect(coordsBtn).toBeInTheDocument()
    expect(coordsBtn).toHaveTextContent('ON')

    fireEvent.click(coordsBtn)
    expect(onToggleShowCoordinates).toHaveBeenCalledWith(false)
  })
})
