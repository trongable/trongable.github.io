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

export interface HaloParams {
  speed: number
  radius: number
  showGuide: boolean
}

export interface TrefoilParams {
  speed: number
  scale: number
  tubeRadius: number
  showTrack: boolean
}

export interface TesseractParams {
  speed4D: number
  distance: number
  cubeSize: number
  showWires: boolean
}

export interface AstrolabeParams {
  speed: number
  ringSpread: number
  tiltAngle: number
  showRings: boolean
}

export interface LorenzParams {
  speed: number
  scale: number
  rho: number
  showParticles: boolean
}

export interface OrigamiParams {
  unfold: number
  tumbleSpeed: number
  facetScale: number
  showWires: boolean
}

export interface SlingshotParams {
  eccentricity: number
  axis: number
  acceleration: number
  showOrbits: boolean
}

export interface HelixParams {
  speed: number
  coils: number
  radius: number
  showCoil: boolean
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
    showGuide: false,
  },
  trefoil: {
    speed: 0.20,
    scale: 1.1,
    tubeRadius: 0.015,
    showTrack: true,
  },
  tesseract: {
    speed4D: 0.25,
    distance: 2.2,
    cubeSize: 1.15,
    showWires: true,
  },
  astrolabe: {
    speed: 1.0,
    ringSpread: 1.0,
    tiltAngle: 45,
    showRings: true,
  },
  lorenz: {
    speed: 0.008,
    scale: 0.065,
    rho: 28,
    showParticles: true,
  },
  origami: {
    unfold: 1.0,
    tumbleSpeed: 0.12,
    facetScale: 1.0,
    showWires: true,
  },
  slingshot: {
    eccentricity: 0.68,
    axis: 2.0,
    acceleration: 1.0,
    showOrbits: true,
  },
  helix: {
    speed: 0.22,
    coils: 6,
    radius: 1.8,
    showCoil: true,
  },
}

export const DEFAULT_GEOMETRY_MODE: GeometryMode = 'tesseract'

export function isValidGeometryMode(mode: string): mode is GeometryMode {
  return GEOMETRY_MODES.some((m) => m.id === mode)
}
