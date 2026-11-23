export interface VideoChamberParams {
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

export const DEFAULT_VIDEO_CHAMBER_PARAMS: VideoChamberParams = {
  sphereRadius: 4.5,
  thumbnailScale: 1.0,
  arcDegrees: 100,
  rowSeparation: 1.8,
  panSensitivity: 1.0,
  maxYawDeg: 32,
  maxPitchDeg: 8,
  transitSpeed: 16,
  dimIntensity: 0.90,
  particleCount: 120,
}

export const VIDEO_CHAMBER_PARAM_BOUNDS = {
  sphereRadius: { min: 3.5, max: 7.0, step: 0.1 },
  thumbnailScale: { min: 0.7, max: 1.4, step: 0.05 },
  arcDegrees: { min: 60, max: 160, step: 5 },
  rowSeparation: { min: 0.8, max: 2.2, step: 0.05 },
  panSensitivity: { min: 0.5, max: 3.0, step: 0.1 },
  maxYawDeg: { min: 15, max: 75, step: 1 },
  maxPitchDeg: { min: 0, max: 25, step: 1 },
  transitSpeed: { min: 4, max: 24, step: 1 },
  dimIntensity: { min: 0.50, max: 1.0, step: 0.05 },
  particleCount: { min: 0, max: 300, step: 10 },
}
