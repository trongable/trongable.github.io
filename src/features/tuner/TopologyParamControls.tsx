import React from 'react'
import {
  GeometryMode,
  AllGeometryParams,
  GUIDE_STYLES,
  LINE_GUIDE_STYLES,
  FACET_GUIDE_STYLES,
} from '@/features/topologies/config/geometryConfig'
import { TunerSlider, TunerCheckbox, TunerStyleGrid } from '@/features/tuner/TunerControls'

interface TopologyParamControlsProps {
  activeMode: GeometryMode
  params: AllGeometryParams
  onParamChange: <M extends GeometryMode, K extends keyof AllGeometryParams[M]>(
    mode: M,
    key: K,
    val: AllGeometryParams[M][K]
  ) => void
}

/**
 * Mode-specific parameter sliders, guide style selectors, and visibility checkboxes
 * for the currently selected 3D topology.
 */
export const TopologyParamControls: React.FC<TopologyParamControlsProps> = ({
  activeMode,
  params,
  onParamChange,
}) => (
  <div className="space-y-3 pt-1">
    {activeMode === 'halo' && (
      <>
        <TunerSlider label="speed" valueDisplay={params.halo.speed.toFixed(3)} min="0.02" max="0.25" step="0.005" value={params.halo.speed} onChange={(v) => onParamChange('halo', 'speed', v)} />
        <TunerSlider label="radius scale" valueDisplay={`${params.halo.radius.toFixed(2)}x`} min="0.6" max="1.8" step="0.05" value={params.halo.radius} onChange={(v) => onParamChange('halo', 'radius', v)} />
        <TunerSlider label="tilt / upright" valueDisplay={`${params.halo.tilt.toFixed(0)}°`} min="-90" max="90" step="1" value={params.halo.tilt} onChange={(v) => onParamChange('halo', 'tilt', v)} />
        <TunerSlider label="yaw" valueDisplay={`${params.halo.yaw.toFixed(0)}°`} min="0" max="360" step="1" value={params.halo.yaw} onChange={(v) => onParamChange('halo', 'yaw', v)} />
        <TunerSlider label="guide width" valueDisplay={params.halo.guideWidth.toFixed(3)} min="0.005" max="0.045" step="0.002" value={params.halo.guideWidth} onChange={(v) => onParamChange('halo', 'guideWidth', v)} />
        <TunerStyleGrid label="guide style" options={GUIDE_STYLES} activeValue={params.halo.guideStyle} onSelect={(v) => onParamChange('halo', 'guideStyle', v)} />
        <TunerCheckbox label="show guide ring" checked={params.halo.showGuide} onChange={(v) => onParamChange('halo', 'showGuide', v)} />
      </>
    )}

    {activeMode === 'trefoil' && (
      <>
        <TunerSlider label="transit speed" valueDisplay={params.trefoil.speed.toFixed(2)} min="0.05" max="0.50" step="0.01" value={params.trefoil.speed} onChange={(v) => onParamChange('trefoil', 'speed', v)} />
        <TunerSlider label="knot scale" valueDisplay={`${params.trefoil.scale.toFixed(2)}x`} min="0.6" max="1.8" step="0.05" value={params.trefoil.scale} onChange={(v) => onParamChange('trefoil', 'scale', v)} />
        <TunerSlider label="tube radius" valueDisplay={params.trefoil.tubeRadius.toFixed(3)} min="0.005" max="0.045" step="0.002" value={params.trefoil.tubeRadius} onChange={(v) => onParamChange('trefoil', 'tubeRadius', v)} />
        <TunerStyleGrid label="track style" options={GUIDE_STYLES} activeValue={params.trefoil.trackStyle} onSelect={(v) => onParamChange('trefoil', 'trackStyle', v)} />
        <TunerCheckbox label="show knot track ribbon" checked={params.trefoil.showTrack} onChange={(v) => onParamChange('trefoil', 'showTrack', v)} />
      </>
    )}

    {activeMode === 'tesseract' && (
      <>
        <TunerSlider label="4D spin speed" valueDisplay={params.tesseract.speed4D.toFixed(2)} min="0.05" max="0.70" step="0.02" value={params.tesseract.speed4D} onChange={(v) => onParamChange('tesseract', 'speed4D', v)} />
        <TunerSlider label="projection distance" valueDisplay={params.tesseract.distance.toFixed(2)} min="1.4" max="3.2" step="0.05" value={params.tesseract.distance} onChange={(v) => onParamChange('tesseract', 'distance', v)} />
        <TunerSlider label="cube size" valueDisplay={`${params.tesseract.cubeSize.toFixed(2)}x`} min="0.6" max="1.8" step="0.05" value={params.tesseract.cubeSize} onChange={(v) => onParamChange('tesseract', 'cubeSize', v)} />
        <TunerStyleGrid label="wire style" options={LINE_GUIDE_STYLES} activeValue={params.tesseract.wireStyle} onSelect={(v) => onParamChange('tesseract', 'wireStyle', v)} columns={3} />
        <TunerCheckbox label="show wireframe lattice" checked={params.tesseract.showWires} onChange={(v) => onParamChange('tesseract', 'showWires', v)} />
      </>
    )}

    {activeMode === 'astrolabe' && (
      <>
        <TunerSlider label="speed multiplier" valueDisplay={`${params.astrolabe.speed.toFixed(2)}x`} min="0.2" max="2.5" step="0.05" value={params.astrolabe.speed} onChange={(v) => onParamChange('astrolabe', 'speed', v)} />
        <TunerSlider label="ring spacing" valueDisplay={`${params.astrolabe.ringSpread.toFixed(2)}x`} min="0.6" max="1.6" step="0.05" value={params.astrolabe.ringSpread} onChange={(v) => onParamChange('astrolabe', 'ringSpread', v)} />
        <TunerSlider label="tilt spread" valueDisplay={`${params.astrolabe.tiltAngle}°`} min="15" max="75" step="1" value={params.astrolabe.tiltAngle} onChange={(v) => onParamChange('astrolabe', 'tiltAngle', v)} integer />
        <TunerSlider label="ring width" valueDisplay={params.astrolabe.ringWidth.toFixed(3)} min="0.005" max="0.045" step="0.002" value={params.astrolabe.ringWidth} onChange={(v) => onParamChange('astrolabe', 'ringWidth', v)} />
        <TunerStyleGrid label="ring style" options={GUIDE_STYLES} activeValue={params.astrolabe.ringStyle} onSelect={(v) => onParamChange('astrolabe', 'ringStyle', v)} />
        <TunerCheckbox label="show gimbal rings" checked={params.astrolabe.showRings} onChange={(v) => onParamChange('astrolabe', 'showRings', v)} />
      </>
    )}

    {activeMode === 'lorenz' && (
      <>
        <TunerSlider label="simulation step (dt)" valueDisplay={params.lorenz.speed.toFixed(4)} min="0.003" max="0.016" step="0.0005" value={params.lorenz.speed} onChange={(v) => onParamChange('lorenz', 'speed', v)} />
        <TunerSlider label="manifold scale" valueDisplay={params.lorenz.scale.toFixed(3)} min="0.03" max="0.11" step="0.005" value={params.lorenz.scale} onChange={(v) => onParamChange('lorenz', 'scale', v)} />
        <TunerSlider label="Rayleigh number (rho)" valueDisplay={`${params.lorenz.rho}`} min="16" max="38" step="1" value={params.lorenz.rho} onChange={(v) => onParamChange('lorenz', 'rho', v)} integer />
        <TunerStyleGrid label="trail style" options={LINE_GUIDE_STYLES} activeValue={params.lorenz.trailStyle} onSelect={(v) => onParamChange('lorenz', 'trailStyle', v)} columns={3} />
        <TunerCheckbox label="show ribbon trails" checked={params.lorenz.showParticles} onChange={(v) => onParamChange('lorenz', 'showParticles', v)} />
      </>
    )}

    {activeMode === 'origami' && (
      <>
        <TunerSlider label="unfold bloom" valueDisplay={`${params.origami.unfold.toFixed(2)}x`} min="0.0" max="1.4" step="0.05" value={params.origami.unfold} onChange={(v) => onParamChange('origami', 'unfold', v)} />
        <TunerSlider label="tumble speed" valueDisplay={params.origami.tumbleSpeed.toFixed(2)} min="0.03" max="0.40" step="0.01" value={params.origami.tumbleSpeed} onChange={(v) => onParamChange('origami', 'tumbleSpeed', v)} />
        <TunerSlider label="facet scale" valueDisplay={`${params.origami.facetScale.toFixed(2)}x`} min="0.3" max="1.6" step="0.05" value={params.origami.facetScale} onChange={(v) => onParamChange('origami', 'facetScale', v)} />
        <TunerStyleGrid label="facet style" options={FACET_GUIDE_STYLES} activeValue={params.origami.wireStyle} onSelect={(v) => onParamChange('origami', 'wireStyle', v)} columns={3} />
        <TunerCheckbox label="show core wireframe" checked={params.origami.showWires} onChange={(v) => onParamChange('origami', 'showWires', v)} />
      </>
    )}

    {activeMode === 'slingshot' && (
      <>
        <TunerSlider label="eccentricity (e)" valueDisplay={params.slingshot.eccentricity.toFixed(2)} min="0.2" max="0.86" step="0.02" value={params.slingshot.eccentricity} onChange={(v) => onParamChange('slingshot', 'eccentricity', v)} />
        <TunerSlider label="semi-major axis" valueDisplay={`${params.slingshot.axis.toFixed(2)}x`} min="1.2" max="2.8" step="0.05" value={params.slingshot.axis} onChange={(v) => onParamChange('slingshot', 'axis', v)} />
        <TunerSlider label="whip acceleration" valueDisplay={`${params.slingshot.acceleration.toFixed(2)}x`} min="0.4" max="2.2" step="0.05" value={params.slingshot.acceleration} onChange={(v) => onParamChange('slingshot', 'acceleration', v)} />
        <TunerSlider label="orbit width" valueDisplay={params.slingshot.orbitWidth.toFixed(3)} min="0.005" max="0.045" step="0.002" value={params.slingshot.orbitWidth} onChange={(v) => onParamChange('slingshot', 'orbitWidth', v)} />
        <TunerStyleGrid label="orbit style" options={GUIDE_STYLES} activeValue={params.slingshot.orbitStyle} onSelect={(v) => onParamChange('slingshot', 'orbitStyle', v)} />
        <TunerCheckbox label="show elliptical orbits" checked={params.slingshot.showOrbits} onChange={(v) => onParamChange('slingshot', 'showOrbits', v)} />
      </>
    )}

    {activeMode === 'helix' && (
      <>
        <TunerSlider label="transit speed" valueDisplay={params.helix.speed.toFixed(2)} min="0.05" max="0.50" step="0.01" value={params.helix.speed} onChange={(v) => onParamChange('helix', 'speed', v)} />
        <TunerSlider label="coils" valueDisplay={`${params.helix.coils}`} min="3" max="10" step="1" value={params.helix.coils} onChange={(v) => onParamChange('helix', 'coils', v)} integer />
        <TunerSlider label="torus radius" valueDisplay={`${params.helix.radius.toFixed(2)}x`} min="1.0" max="2.6" step="0.05" value={params.helix.radius} onChange={(v) => onParamChange('helix', 'radius', v)} />
        <TunerSlider label="coil width" valueDisplay={params.helix.coilWidth.toFixed(3)} min="0.005" max="0.045" step="0.002" value={params.helix.coilWidth} onChange={(v) => onParamChange('helix', 'coilWidth', v)} />
        <TunerStyleGrid label="coil style" options={GUIDE_STYLES} activeValue={params.helix.coilStyle} onSelect={(v) => onParamChange('helix', 'coilStyle', v)} />
        <TunerCheckbox label="show corkscrew coil" checked={params.helix.showCoil} onChange={(v) => onParamChange('helix', 'showCoil', v)} />
      </>
    )}
  </div>
)
