export type GalleryLayoutMode = '4-tier' | '3-tier'

export interface GalleryChamberParams {
  tierCount: 3 | 4
  freeSpin: boolean
  introCollapse: boolean
  scatterOnSelect: boolean
  centerZoom: boolean
  vignette: boolean
  ambientFloat: boolean
  focusReticles: boolean
  motionBlur: boolean
  sphereRadius: number
  thumbnailScale: number
  arcDegrees: number
  rowSeparation: number
  panSensitivity: number
  dragMultiplier: number
  flingInertia: number
  maxYawDeg: number
  maxPitchDeg: number
  transitSpeed: number
  dimIntensity: number
  particleCount: number
}

// Retain alias for backward compatibility
export type VideoChamberParams = GalleryChamberParams

export const GALLERY_LAYOUT_PRESETS: Record<
  GalleryLayoutMode,
  Pick<
    GalleryChamberParams,
    'tierCount' | 'freeSpin' | 'sphereRadius' | 'arcDegrees' | 'rowSeparation' | 'maxYawDeg' | 'thumbnailScale'
  >
> = {
  '4-tier': {
    tierCount: 4,
    freeSpin: true,
    sphereRadius: 5.5,
    arcDegrees: 360,
    rowSeparation: 1.55,
    maxYawDeg: 180,
    thumbnailScale: 1.0,
  },
  '3-tier': {
    tierCount: 3,
    freeSpin: true,
    sphereRadius: 6.0,
    arcDegrees: 360,
    rowSeparation: 1.80,
    maxYawDeg: 180,
    thumbnailScale: 1.0,
  },
}

export const DEFAULT_GALLERY_CHAMBER_PARAMS: GalleryChamberParams = {
  ...GALLERY_LAYOUT_PRESETS['4-tier'],
  introCollapse: true,
  scatterOnSelect: true,
  centerZoom: true,
  vignette: true,
  ambientFloat: true,
  focusReticles: true,
  motionBlur: false,
  panSensitivity: 1.2,
  dragMultiplier: 1.8,
  flingInertia: 1.9,
  maxPitchDeg: 36,
  transitSpeed: 16,
  dimIntensity: 0.90,
  particleCount: 120,
}

// Backward-compatible alias
export const DEFAULT_VIDEO_CHAMBER_PARAMS = DEFAULT_GALLERY_CHAMBER_PARAMS

export const GALLERY_CHAMBER_PARAM_BOUNDS = {
  sphereRadius: { min: 3.5, max: 7.0, step: 0.1 },
  thumbnailScale: { min: 0.7, max: 1.4, step: 0.05 },
  arcDegrees: { min: 80, max: 360, step: 5 },
  rowSeparation: { min: 0.6, max: 2.5, step: 0.05 },
  panSensitivity: { min: 0.5, max: 3.0, step: 0.1 },
  dragMultiplier: { min: 0.2, max: 3.0, step: 0.1 },
  flingInertia: { min: 0.0, max: 2.5, step: 0.1 },
  maxYawDeg: { min: 30, max: 180, step: 1 },
  maxPitchDeg: { min: 0, max: 45, step: 1 },
  transitSpeed: { min: 4, max: 24, step: 1 },
  dimIntensity: { min: 0.50, max: 1.0, step: 0.05 },
  particleCount: { min: 0, max: 300, step: 10 },
}

export const VIDEO_CHAMBER_PARAM_BOUNDS = GALLERY_CHAMBER_PARAM_BOUNDS
