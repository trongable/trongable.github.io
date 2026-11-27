export type GeometryMode =
  | 'halo'
  | 'trefoil'
  | 'tesseract'
  | 'astrolabe'
  | 'lorenz'
  | 'origami'
  | 'slingshot'
  | 'helix'

export interface GeometryMeta {
  id: GeometryMode
  name: string
  label: string
  description: string
}

export const GEOMETRY_MODES: GeometryMeta[] = [
  {
    id: 'halo',
    name: 'Halo Ring',
    label: 'halo',
    description: 'Flat horizontal 25° counterclockwise ring',
  },
  {
    id: 'trefoil',
    name: 'Trefoil Knot',
    label: 'trefoil',
    description: 'Non-orientable 3D Torus Knot endless loop',
  },
  {
    id: 'tesseract',
    name: '4D Tesseract',
    label: 'tesseract',
    description: '4D-to-3D hypercube inside-out dimensional projection',
  },
  {
    id: 'astrolabe',
    name: 'Tri-Axial Astrolabe',
    label: 'astrolabe',
    description: '3 concentric tilted gimbal rings with magnetic lock',
  },
  {
    id: 'lorenz',
    name: 'Strange Attractor',
    label: 'lorenz',
    description: 'Lorenz butterfly-wing differential chaos manifold',
  },
  {
    id: 'origami',
    name: 'Origami Polyhedron',
    label: 'origami',
    description: 'Tumbling crystal that mechanically blossoms into UI panels',
  },
  {
    id: 'slingshot',
    name: 'Gravitational Slingshot',
    label: 'slingshot',
    description: 'Eccentric Keplerian orbits with periapsis whip acceleration',
  },
  {
    id: 'helix',
    name: 'Toroidal Helix',
    label: 'helix',
    description: 'Dual corkscrew particle accelerator tunnel',
  },
]

export type GuideStyle =
  | 'solid'
  | 'wireframe'
  | 'glow'
  | 'hex'
  | 'dashed'
  | 'points'
  | 'ribbed'

export const GUIDE_STYLES: { id: GuideStyle; label: string }[] = [
  { id: 'solid', label: 'solid' },
  { id: 'wireframe', label: 'cage' },
  { id: 'glow', label: 'glow' },
  { id: 'hex', label: 'hex' },
  { id: 'dashed', label: 'dash' },
  { id: 'points', label: 'dots' },
  { id: 'ribbed', label: 'ribbed' },
]

export type LineGuideStyle = 'solid' | 'dashed' | 'points'

export const LINE_GUIDE_STYLES: { id: LineGuideStyle; label: string }[] = [
  { id: 'solid', label: 'solid' },
  { id: 'dashed', label: 'dash' },
  { id: 'points', label: 'dots' },
]

export const FACET_GUIDE_STYLES: { id: GuideStyle; label: string }[] = [
  { id: 'wireframe', label: 'cage' },
  { id: 'solid', label: 'solid' },
  { id: 'points', label: 'dots' },
]

export interface HaloParams {
  speed: number
  radius: number
  showGuide: boolean
  tilt: number // degrees: -90° to 90° (0° = flat horizontal, 90° = vertical upright)
  yaw: number  // degrees: 0° to 360° (azimuth heading)
  guideWidth: number // 0.005 to 0.045
  guideStyle: GuideStyle
}

export interface TrefoilParams {
  speed: number
  scale: number
  tubeRadius: number
  showTrack: boolean
  trackStyle: GuideStyle
}

export interface TesseractParams {
  speed4D: number
  distance: number
  cubeSize: number
  showWires: boolean
  wireStyle: LineGuideStyle
}

export interface AstrolabeParams {
  speed: number
  ringSpread: number
  tiltAngle: number
  showRings: boolean
  ringWidth: number
  ringStyle: GuideStyle
}

export interface LorenzParams {
  speed: number
  scale: number
  rho: number
  showParticles: boolean
  trailStyle: LineGuideStyle
}

export interface OrigamiParams {
  unfold: number
  tumbleSpeed: number
  facetScale: number
  showWires: boolean
  wireStyle: GuideStyle
}

export interface SlingshotParams {
  eccentricity: number
  axis: number
  acceleration: number
  showOrbits: boolean
  orbitWidth: number
  orbitStyle: GuideStyle
}

export interface HelixParams {
  speed: number
  coils: number
  radius: number
  showCoil: boolean
  coilWidth: number
  coilStyle: GuideStyle
}

export interface AllGeometryParams {
  halo: HaloParams
  trefoil: TrefoilParams
  tesseract: TesseractParams
  astrolabe: AstrolabeParams
  lorenz: LorenzParams
  origami: OrigamiParams
  slingshot: SlingshotParams
  helix: HelixParams
}

export const DEFAULT_GEOMETRY_PARAMS: AllGeometryParams = {
  halo: {
    speed: 0.0825,
    radius: 1.0,
    showGuide: true,
    tilt: 0,
    yaw: 0,
    guideWidth: 0.015,
    guideStyle: 'solid',
  },
  trefoil: {
    speed: 0.20,
    scale: 1.1,
    tubeRadius: 0.015,
    showTrack: true,
    trackStyle: 'wireframe',
  },
  tesseract: {
    speed4D: 0.25,
    distance: 2.2,
    cubeSize: 1.15,
    showWires: true,
    wireStyle: 'solid',
  },
  astrolabe: {
    speed: 1.0,
    ringSpread: 1.0,
    tiltAngle: 45,
    showRings: true,
    ringWidth: 0.012,
    ringStyle: 'solid',
  },
  lorenz: {
    speed: 0.008,
    scale: 0.065,
    rho: 28,
    showParticles: true,
    trailStyle: 'solid',
  },
  origami: {
    unfold: 1.0,
    tumbleSpeed: 0.12,
    facetScale: 0.60,
    showWires: true,
    wireStyle: 'wireframe',
  },
  slingshot: {
    eccentricity: 0.68,
    axis: 2.0,
    acceleration: 1.0,
    showOrbits: true,
    orbitWidth: 0.012,
    orbitStyle: 'solid',
  },
  helix: {
    speed: 0.22,
    coils: 6,
    radius: 1.8,
    showCoil: true,
    coilWidth: 0.012,
    coilStyle: 'solid',
  },
}

export const DEFAULT_GEOMETRY_MODE: GeometryMode = 'tesseract'

export function isValidGeometryMode(mode: string): mode is GeometryMode {
  return GEOMETRY_MODES.some((m) => m.id === mode)
}
