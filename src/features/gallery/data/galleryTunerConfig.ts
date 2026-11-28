export interface GalleryChamberParams {
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
  particleCount: number
}

// Retain alias for backward compatibility
export type VideoChamberParams = GalleryChamberParams

export const DEFAULT_GALLERY_CHAMBER_PARAMS: GalleryChamberParams = {
  freeSpin: true,
  sphereRadius: 5.5,
  arcDegrees: 360,
  rowSeparation: 1.55,
  maxYawDeg: 180,
  thumbnailScale: 1.0,
  introCollapse: true,
  scatterOnSelect: true,
  centerZoom: true,
  vignette: true,
  ambientFloat: true,
  focusReticles: true,
  motionBlur: false,
  panSensitivity: 1.0,
  dragMultiplier: 1.2,
  flingInertia: 1.9,
  maxPitchDeg: 36,
  transitSpeed: 16,
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
  particleCount: { min: 0, max: 300, step: 10 },
}

export const VIDEO_CHAMBER_PARAM_BOUNDS = GALLERY_CHAMBER_PARAM_BOUNDS
