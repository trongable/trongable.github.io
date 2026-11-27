import React from 'react'
import {
  GalleryChamberParams,
  GalleryLayoutMode,
  GALLERY_CHAMBER_PARAM_BOUNDS,
  GALLERY_LAYOUT_PRESETS,
} from '@/features/gallery/data/galleryTunerConfig'
import { TunerCheckbox, TunerSlider, TunerStyleGrid } from '@/features/tuner/TunerControls'

const LAYOUT_OPTIONS: ReadonlyArray<{ id: GalleryLayoutMode; label: string }> = [
  { id: '4-tier', label: '4-Tier (B)' },
  { id: '3-tier', label: '3-Tier (A)' },
]

interface TunerGalleryTabProps {
  videoParams: GalleryChamberParams
  onVideoParamChange: <K extends keyof GalleryChamberParams>(
    key: K,
    val: GalleryChamberParams[K]
  ) => void
  onResetVideoParams: () => void
}

/**
 * Gallery Chamber 3D Laboratory parameter controls.
 */
export const TunerGalleryTab: React.FC<TunerGalleryTabProps> = ({
  videoParams,
  onVideoParamChange,
  onResetVideoParams,
}) => {
  const activeLayoutMode: GalleryLayoutMode = videoParams.tierCount === 3 ? '3-tier' : '4-tier'

  const handleSelectLayout = (mode: GalleryLayoutMode) => {
    const preset = GALLERY_LAYOUT_PRESETS[mode]
    ;(Object.keys(preset) as Array<keyof typeof preset>).forEach((key) => {
      onVideoParamChange(key, preset[key])
    })
  }

  return (
    <div data-testid="gallery-chamber-tuner-tab" className="space-y-2.5">
      <TunerStyleGrid
        label="Chamber Layout"
        options={LAYOUT_OPTIONS}
        activeValue={activeLayoutMode}
        onSelect={handleSelectLayout}
        columns={3}
      />

      <TunerSlider
        label="Sphere Radius"
        ariaLabel="Sphere Radius"
        labelClassName="opacity-80"
        valueDisplay={videoParams.sphereRadius.toFixed(1)}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.sphereRadius.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.sphereRadius.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.sphereRadius.step}
        value={videoParams.sphereRadius}
        onChange={(v) => onVideoParamChange('sphereRadius', v)}
      />

      <TunerSlider
        label="Thumbnail Scale"
        ariaLabel="Thumbnail Scale"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.thumbnailScale.toFixed(2)}x`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.thumbnailScale.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.thumbnailScale.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.thumbnailScale.step}
        value={videoParams.thumbnailScale}
        onChange={(v) => onVideoParamChange('thumbnailScale', v)}
      />

      <TunerSlider
        label="Horizontal Wrap Arc"
        ariaLabel="Horizontal Wrap Arc"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.arcDegrees}°`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.arcDegrees.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.arcDegrees.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.arcDegrees.step}
        value={videoParams.arcDegrees}
        onChange={(v) => onVideoParamChange('arcDegrees', v)}
      />

      <TunerSlider
        label="Row Separation"
        ariaLabel="Row Separation"
        labelClassName="opacity-80"
        valueDisplay={videoParams.rowSeparation.toFixed(2)}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.rowSeparation.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.rowSeparation.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.rowSeparation.step}
        value={videoParams.rowSeparation}
        onChange={(v) => onVideoParamChange('rowSeparation', v)}
      />

      <TunerSlider
        label="Pan Sensitivity"
        ariaLabel="Pan Sensitivity"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.panSensitivity.toFixed(1)}x`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.panSensitivity.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.panSensitivity.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.panSensitivity.step}
        value={videoParams.panSensitivity}
        onChange={(v) => onVideoParamChange('panSensitivity', v)}
      />

      <TunerSlider
        label="Drag Multiplier"
        ariaLabel="Drag Multiplier"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.dragMultiplier.toFixed(1)}x`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.dragMultiplier.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.dragMultiplier.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.dragMultiplier.step}
        value={videoParams.dragMultiplier}
        onChange={(v) => onVideoParamChange('dragMultiplier', v)}
      />

      <TunerSlider
        label="Fling Inertia"
        ariaLabel="Fling Inertia"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.flingInertia.toFixed(1)}x`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.flingInertia.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.flingInertia.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.flingInertia.step}
        value={videoParams.flingInertia}
        onChange={(v) => onVideoParamChange('flingInertia', v)}
      />

      <TunerCheckbox
        label="Free Spin (360°+)"
        ariaLabel="Free Spin (360°+)"
        checked={videoParams.freeSpin}
        onChange={(checked) => onVideoParamChange('freeSpin', checked)}
      />

      <div className="pt-1 border-t border-[var(--theme-primary)]/15">
        <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">Chamber Effects</span>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
          <TunerCheckbox
            label="Intro Collapse"
            ariaLabel="Intro Collapse"
            checked={videoParams.introCollapse}
            onChange={(checked) => onVideoParamChange('introCollapse', checked)}
          />
          <TunerCheckbox
            label="Scatter on Select"
            ariaLabel="Scatter on Select"
            checked={videoParams.scatterOnSelect}
            onChange={(checked) => onVideoParamChange('scatterOnSelect', checked)}
          />
          <TunerCheckbox
            label="Center Gaze Zoom"
            ariaLabel="Center Gaze Zoom"
            checked={videoParams.centerZoom}
            onChange={(checked) => onVideoParamChange('centerZoom', checked)}
          />
          <TunerCheckbox
            label="Vignette"
            ariaLabel="Vignette"
            checked={videoParams.vignette}
            onChange={(checked) => onVideoParamChange('vignette', checked)}
          />
          <TunerCheckbox
            label="Ambient Float"
            ariaLabel="Ambient Float"
            checked={videoParams.ambientFloat}
            onChange={(checked) => onVideoParamChange('ambientFloat', checked)}
          />
          <TunerCheckbox
            label="Corner Reticles"
            ariaLabel="Corner Reticles"
            checked={videoParams.focusReticles}
            onChange={(checked) => onVideoParamChange('focusReticles', checked)}
          />
          <TunerCheckbox
            label="Motion Blur"
            ariaLabel="Motion Blur"
            checked={videoParams.motionBlur}
            onChange={(checked) => onVideoParamChange('motionBlur', checked)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TunerSlider
          label="Max Yaw"
          ariaLabel="Max Yaw"
          labelClassName="opacity-80"
          valueDisplay={videoParams.freeSpin || videoParams.maxYawDeg >= 180 ? '∞ 360°+' : `±${videoParams.maxYawDeg}°`}
          min={GALLERY_CHAMBER_PARAM_BOUNDS.maxYawDeg.min}
          max={GALLERY_CHAMBER_PARAM_BOUNDS.maxYawDeg.max}
          step={GALLERY_CHAMBER_PARAM_BOUNDS.maxYawDeg.step}
          value={videoParams.maxYawDeg}
          onChange={(v) => onVideoParamChange('maxYawDeg', v)}
        />
        <TunerSlider
          label="Max Pitch"
          ariaLabel="Max Pitch"
          labelClassName="opacity-80"
          valueDisplay={`±${videoParams.maxPitchDeg}°`}
          min={GALLERY_CHAMBER_PARAM_BOUNDS.maxPitchDeg.min}
          max={GALLERY_CHAMBER_PARAM_BOUNDS.maxPitchDeg.max}
          step={GALLERY_CHAMBER_PARAM_BOUNDS.maxPitchDeg.step}
          value={videoParams.maxPitchDeg}
          onChange={(v) => onVideoParamChange('maxPitchDeg', v)}
        />
      </div>

      <TunerSlider
        label="Flight Transit Speed"
        ariaLabel="Flight Transit Speed"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.transitSpeed}`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.transitSpeed.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.transitSpeed.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.transitSpeed.step}
        value={videoParams.transitSpeed}
        onChange={(v) => onVideoParamChange('transitSpeed', v)}
      />

      <TunerSlider
        label="Dim Intensity"
        ariaLabel="Dim Intensity"
        labelClassName="opacity-80"
        valueDisplay={`${(videoParams.dimIntensity * 100).toFixed(0)}%`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.dimIntensity.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.dimIntensity.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.dimIntensity.step}
        value={videoParams.dimIntensity}
        onChange={(v) => onVideoParamChange('dimIntensity', v)}
      />

      <TunerSlider
        label="Synaptic Particles"
        ariaLabel="Synaptic Particles"
        labelClassName="opacity-80"
        valueDisplay={`${videoParams.particleCount}`}
        min={GALLERY_CHAMBER_PARAM_BOUNDS.particleCount.min}
        max={GALLERY_CHAMBER_PARAM_BOUNDS.particleCount.max}
        step={GALLERY_CHAMBER_PARAM_BOUNDS.particleCount.step}
        value={videoParams.particleCount}
        onChange={(v) => onVideoParamChange('particleCount', v)}
        integer
      />

      <button
        type="button"
        onClick={onResetVideoParams}
        className="w-full mt-3 py-1.5 px-3 rounded border border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)] hover:text-[#1c1b22] text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] text-center"
      >
        ↺ Reset Gallery Chamber
      </button>
    </div>
  )
}
