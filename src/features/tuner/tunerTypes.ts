import type { GeometryMode, AllGeometryParams } from '@/features/topologies/config/geometryConfig'
import type { ThemeId } from '@/context/ThemeContext'
import type { AngelContainerStyle } from '@/features/angel/AngelContainerContext'
import type { DistanceMetric, CoordFrame, CameraElevation } from '@/context/DebugDistanceContext'
import type { CameraAngles } from '@/features/scene/SceneContainer'
import type { PowerMode } from '@/hooks/usePowerManager'
import type { GalleryChamberParams } from '@/features/gallery/data/galleryTunerConfig'

export type TunerTabId = 'geo' | 'vfx'

export interface TunerProps {
  activeMode?: GeometryMode
  onModeChange?: (mode: GeometryMode) => void
  params?: AllGeometryParams
  onParamChange?: <M extends GeometryMode, K extends keyof AllGeometryParams[M]>(
    mode: M,
    key: K,
    val: AllGeometryParams[M][K]
  ) => void
  onResetParams?: (mode: GeometryMode) => void
  onClose?: () => void
  // VFX & Glitch Controls
  currentThemeId?: ThemeId
  currentThemePrimary?: string
  currentThemeHighlight?: string
  onThemeChange?: (id: ThemeId) => void
  onCustomColorChange?: (primaryHex: string) => void
  isThemeLocked?: boolean
  onToggleThemeLock?: (locked: boolean) => void
  glitchInterval?: number
  onGlitchIntervalChange?: (seconds: number) => void
  imageRate?: number
  onImageRateChange?: (rate: number) => void
  onTriggerGlitch?: () => void
  // Power & Performance Controls
  powerMode?: PowerMode
  onPowerModeChange?: (mode: PowerMode) => void
  isBattery?: boolean
  targetFps?: number | null
  targetDpr?: number | [number, number]
  // Angel 3D Container Controls
  angelContainer?: AngelContainerStyle
  onAngelContainerChange?: (style: AngelContainerStyle) => void
  // Debug & Telemetry Controls
  showDistance?: boolean
  onToggleShowDistance?: (show: boolean) => void
  distanceMetric?: DistanceMetric
  onDistanceMetricChange?: (metric: DistanceMetric) => void
  showCoordinates?: boolean
  onToggleShowCoordinates?: (show: boolean) => void
  coordFrame?: CoordFrame
  onCoordFrameChange?: (frame: CoordFrame) => void
  cameraElevation?: CameraElevation
  onCameraElevationChange?: (elevation: CameraElevation) => void
  // Camera Orbit Inspection
  cameraAngles?: CameraAngles
  onCameraAnglesChange?: (angles: CameraAngles) => void
  onResetCameraAngles?: () => void
  // Animation / Effect Pause
  isPaused?: boolean
  onTogglePause?: (paused?: boolean) => void
  // Gallery Chamber Specific Controls
  isGalleryPage?: boolean
  videoParams?: GalleryChamberParams
  onVideoParamChange?: <K extends keyof GalleryChamberParams>(
    key: K,
    val: GalleryChamberParams[K]
  ) => void
  onResetVideoParams?: () => void
}
