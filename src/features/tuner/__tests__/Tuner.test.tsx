import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tuner } from '@/features/tuner/Tuner'
import { DEFAULT_GEOMETRY_PARAMS } from '@/features/topologies/config/geometryConfig'

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

  it('renders all 6 Angel 3D container buttons and triggers onAngelContainerChange', () => {
    const onAngelContainerChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        angelContainer="diorama"
        onAngelContainerChange={onAngelContainerChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText('Angel 3D Container')).toBeInTheDocument()

    const dioramaBtn = screen.getByTestId('angel-container-diorama')
    const pedestalBtn = screen.getByTestId('angel-container-pedestal')
    const capsuleBtn = screen.getByTestId('angel-container-capsule')
    const wireboxBtn = screen.getByTestId('angel-container-wirebox')
    const crystalBtn = screen.getByTestId('angel-container-crystal')
    const noneBtn = screen.getByTestId('angel-container-none')

    expect(dioramaBtn).toBeInTheDocument()
    expect(pedestalBtn).toBeInTheDocument()
    expect(capsuleBtn).toBeInTheDocument()
    expect(wireboxBtn).toBeInTheDocument()
    expect(crystalBtn).toBeInTheDocument()
    expect(noneBtn).toBeInTheDocument()

    fireEvent.click(capsuleBtn)
    expect(onAngelContainerChange).toHaveBeenCalledWith('capsule')

    fireEvent.click(crystalBtn)
    expect(onAngelContainerChange).toHaveBeenCalledWith('crystal')
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

  it('renders Coord Frame buttons when showCoordinates is true and handles selection', () => {
    const onCoordFrameChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        showDistance={true}
        showCoordinates={true}
        coordFrame="view"
        onCoordFrameChange={onCoordFrameChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByTestId('frame-view')).toBeInTheDocument()
    expect(screen.getByTestId('frame-world')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('frame-world'))
    expect(onCoordFrameChange).toHaveBeenCalledWith('world')
  })

  it('renders animation pause button next to launcher pill and responds to click', () => {
    const onTogglePause = vi.fn()
    const { rerender } = render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={false}
        onTogglePause={onTogglePause}
      />
    )

    const pauseBtn = screen.getByTestId('animation-pause-button')
    expect(pauseBtn).toBeInTheDocument()
    expect(pauseBtn).toHaveTextContent('⏸')
    expect(pauseBtn).toHaveAttribute('aria-label', 'Pause all animations and visual effects')

    fireEvent.click(pauseBtn)
    expect(onTogglePause).toHaveBeenCalledWith(true)

    // Re-render as paused
    rerender(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={true}
        onTogglePause={onTogglePause}
      />
    )

    expect(pauseBtn).toHaveTextContent('▶')
    expect(pauseBtn).toHaveAttribute('aria-label', 'Resume animations and visual effects')

    fireEvent.click(pauseBtn)
    expect(onTogglePause).toHaveBeenCalledWith(false)
  })

  it('renders Animation Engine toggle row in VFX tab and handles click', () => {
    const onTogglePause = vi.fn()
    const { rerender } = render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={false}
        onTogglePause={onTogglePause}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    fireEvent.click(screen.getByRole('button', { name: 'VFX & Glitch' }))

    const engineToggle = screen.getByTestId('toggle-pause-drawer')
    expect(engineToggle).toBeInTheDocument()
    expect(engineToggle).toHaveTextContent('RUNNING (LIVE)')

    fireEvent.click(engineToggle)
    expect(onTogglePause).toHaveBeenCalledWith(true)

    // Re-render as paused
    rerender(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={true}
        onTogglePause={onTogglePause}
      />
    )

    expect(engineToggle).toHaveTextContent('PAUSED (FROZEN)')
  })

  it('renders Camera Elevation buttons in 3D tab and handles selection', () => {
    const onCameraElevationChange = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        showDistance={true}
        cameraElevation="elevated"
        onCameraElevationChange={onCameraElevationChange}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByText(/Camera Angle/)).toBeInTheDocument()

    const eyeLevelBtn = screen.getByTestId('elevation-eye-level')
    const elevatedBtn = screen.getByTestId('elevation-elevated')

    expect(eyeLevelBtn).toBeInTheDocument()
    expect(elevatedBtn).toBeInTheDocument()

    fireEvent.click(eyeLevelBtn)
    expect(onCameraElevationChange).toHaveBeenCalledWith('eye-level')

    fireEvent.click(elevatedBtn)
    expect(onCameraElevationChange).toHaveBeenCalledWith('elevated')
  })

  it('renders Camera Orbit Inspection drawer controls when paused and handles angle adjustments', () => {
    const onCameraAnglesChange = vi.fn()
    const onResetCameraAngles = vi.fn()
    render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={true}
        cameraAngles={{ yaw: 0, pitch: 25, distance: 6 }}
        onCameraAnglesChange={onCameraAnglesChange}
        onResetCameraAngles={onResetCameraAngles}
      />
    )

    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByTestId('camera-orbit-inspection-drawer')).toBeInTheDocument()

    // Yaw slider
    const yawSlider = screen.getByTestId('slider-yaw')
    fireEvent.change(yawSlider, { target: { value: '45' } })
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 45, pitch: 25, distance: 6 })

    // Pitch slider
    const pitchSlider = screen.getByTestId('slider-pitch')
    fireEvent.change(pitchSlider, { target: { value: '60' } })
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 0, pitch: 60, distance: 6 })

    // Distance slider
    const distSlider = screen.getByTestId('slider-distance')
    fireEvent.change(distSlider, { target: { value: '8.5' } })
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 0, pitch: 25, distance: 8.5 })

    // Preset Front
    fireEvent.click(screen.getByTestId('preset-front'))
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 0, pitch: 0, distance: 6 })

    // Preset Side
    fireEvent.click(screen.getByTestId('preset-side'))
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 90, pitch: 0, distance: 6 })

    // Preset Top
    fireEvent.click(screen.getByTestId('preset-top'))
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 0, pitch: 85, distance: 6 })

    // Reset button
    fireEvent.click(screen.getByTestId('reset-camera-angles'))
    expect(onResetCameraAngles).toHaveBeenCalled()
  })

  it('renders compact floating inspection dock when isPaused is true and drawer is closed', () => {
    const onCameraAnglesChange = vi.fn()
    const onResetCameraAngles = vi.fn()
    const { rerender } = render(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={true}
        cameraAngles={{ yaw: 0, pitch: 25, distance: 6 }}
        onCameraAnglesChange={onCameraAnglesChange}
        onResetCameraAngles={onResetCameraAngles}
      />
    )

    expect(screen.getByTestId('compact-inspection-dock')).toBeInTheDocument()

    // Compact yaw slider
    const compactYaw = screen.getByTestId('compact-slider-yaw')
    fireEvent.change(compactYaw, { target: { value: '30' } })
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 30, pitch: 25, distance: 6 })

    // Compact pitch slider
    const compactPitch = screen.getByTestId('compact-slider-pitch')
    fireEvent.change(compactPitch, { target: { value: '45' } })
    expect(onCameraAnglesChange).toHaveBeenCalledWith({ yaw: 0, pitch: 45, distance: 6 })

    // Compact reset button
    fireEvent.click(screen.getByTestId('compact-reset-btn'))
    expect(onResetCameraAngles).toHaveBeenCalled()

    // Opening the drawer should hide the compact dock to avoid overlap
    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.queryByTestId('compact-inspection-dock')).not.toBeInTheDocument()

    // Not paused: compact dock should not render
    rerender(
      <Tuner
        activeMode="halo"
        onModeChange={vi.fn()}
        params={DEFAULT_GEOMETRY_PARAMS}
        onParamChange={vi.fn()}
        onResetParams={vi.fn()}
        isPaused={false}
      />
    )
    expect(screen.queryByTestId('compact-inspection-dock')).not.toBeInTheDocument()
  })

  it('renders Gallery Chamber tab and controls when isGalleryPage is true', () => {
    const onVideoParamChange = vi.fn()
    const onResetVideoParams = vi.fn()

    const { rerender } = render(
      <Tuner
        isGalleryPage={true}
        onVideoParamChange={onVideoParamChange}
        onResetVideoParams={onResetVideoParams}
      />
    )

    // Bottom pill displays chamber: gallery
    expect(screen.getByText('chamber:')).toBeInTheDocument()
    expect(screen.getByText('gallery')).toBeInTheDocument()

    // Open drawer
    fireEvent.click(screen.getByLabelText('Toggle parameter drawer'))
    expect(screen.getByRole('button', { name: 'Gallery Chamber' })).toBeInTheDocument()
    expect(screen.getByText('Chamber Layout')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4-Tier (B)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3-Tier (A)' })).toBeInTheDocument()
    expect(screen.getByText('Sphere Radius')).toBeInTheDocument()
    expect(screen.getByText('Thumbnail Scale')).toBeInTheDocument()
    expect(screen.getByLabelText('Free Spin (360°+)')).toBeChecked()
    expect(screen.getByLabelText('Intro Collapse')).toBeChecked()
    expect(screen.getByLabelText('Scatter on Select')).toBeChecked()
    expect(screen.getByLabelText('Center Gaze Zoom')).toBeChecked()
    expect(screen.getByLabelText('Vignette')).toBeChecked()
    expect(screen.getByLabelText('Ambient Float')).toBeChecked()
    expect(screen.getByLabelText('Corner Reticles')).toBeChecked()
    expect(screen.getByLabelText('Motion Blur')).not.toBeChecked()

    // Toggle Free Spin and Chamber Effect checkboxes
    fireEvent.click(screen.getByLabelText('Free Spin (360°+)'))
    expect(onVideoParamChange).toHaveBeenCalledWith('freeSpin', false)
    fireEvent.click(screen.getByLabelText('Ambient Float'))
    expect(onVideoParamChange).toHaveBeenCalledWith('ambientFloat', false)

    // Toggle layout preset to 3-Tier (A)
    fireEvent.click(screen.getByRole('button', { name: '3-Tier (A)' }))
    expect(onVideoParamChange).toHaveBeenCalledWith('tierCount', 3)
    expect(onVideoParamChange).toHaveBeenCalledWith('sphereRadius', 6.0)
    expect(onVideoParamChange).toHaveBeenCalledWith('arcDegrees', 360)

    // Change sphere radius slider
    const radiusSlider = screen.getByLabelText('Sphere Radius')
    fireEvent.change(radiusSlider, { target: { value: '4.8' } })
    expect(onVideoParamChange).toHaveBeenCalledWith('sphereRadius', 4.8)

    // Reset gallery parameters
    const resetBtn = screen.getByRole('button', { name: /Reset Gallery Chamber/i })
    fireEvent.click(resetBtn)
    expect(onResetVideoParams).toHaveBeenCalled()

    // When paused, pause button uses cyber emerald green accent
    rerender(
      <Tuner
        isGalleryPage={true}
        isPaused={true}
        onVideoParamChange={onVideoParamChange}
        onResetVideoParams={onResetVideoParams}
      />
    )
    const pauseBtn = screen.getByTestId('animation-pause-button')
    expect(pauseBtn.className).toContain('text-[#10b981]')
  })
})
