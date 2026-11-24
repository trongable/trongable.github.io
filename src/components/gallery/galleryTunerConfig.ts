export interface GalleryChamberParams {
  sphereRadius: number
  thumbnailScale: number
  arcDegrees: number
  rowSeparation: number
  panSensitivity: number
  maxYawDeg: number
  maxPitchDeg: number
  transitSpeed: number
  dimIntensity: number
  particleCount: number
}

// Retain alias for backward compatibility
export type VideoChamberParams = GalleryChamberParams

export const DEFAULT_GALLERY_CHAMBER_PARAMS: GalleryChamberParams = {
  sphereRadius: 4.5,
  thumbnailScale: 1.0,
  arcDegrees: 220,
  rowSeparation: 1.80,
  panSensitivity: 1.0,
  maxYawDeg: 140,
  maxPitchDeg: 32,
  transitSpeed: 16,
  dimIntensity: 0.90,
  particleCount: 120,
}

// Backward-compatible alias
export const DEFAULT_VIDEO_CHAMBER_PARAMS = DEFAULT_GALLERY_CHAMBER_PARAMS

export const GALLERY_CHAMBER_PARAM_BOUNDS = {
  sphereRadius: { min: 3.5, max: 7.0, step: 0.1 },
  thumbnailScale: { min: 0.7, max: 1.4, step: 0.05 },
  arcDegrees: { min: 80, max: 280, step: 5 },
  rowSeparation: { min: 0.6, max: 2.5, step: 0.05 },
  panSensitivity: { min: 0.5, max: 3.0, step: 0.1 },
  maxYawDeg: { min: 30, max: 180, step: 1 },
  maxPitchDeg: { min: 0, max: 45, step: 1 },
  transitSpeed: { min: 4, max: 24, step: 1 },
  dimIntensity: { min: 0.50, max: 1.0, step: 0.05 },
  particleCount: { min: 0, max: 300, step: 10 },
}

export const VIDEO_CHAMBER_PARAM_BOUNDS = GALLERY_CHAMBER_PARAM_BOUNDS
