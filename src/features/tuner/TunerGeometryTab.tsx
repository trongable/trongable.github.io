import React from 'react'
import {
  GeometryMode,
  GEOMETRY_MODES,
  AllGeometryParams,
} from '@/features/topologies/config/geometryConfig'
import { AngelContainerStyle, ANGEL_CONTAINER_STYLES } from '@/features/angel/AngelContainerContext'
import type { DistanceMetric, CoordFrame, CameraElevation } from '@/context/DebugDistanceContext'
import type { CameraAngles } from '@/features/scene/SceneContainer'
import { TopologyParamControls } from '@/features/tuner/TopologyParamControls'

interface TunerGeometryTabProps {
  activeMode: GeometryMode
  currentMetaName: string
  onModeChange: (mode: GeometryMode) => void
  params: AllGeometryParams
  onParamChange: <M extends GeometryMode, K extends keyof AllGeometryParams[M]>(
    mode: M,
    key: K,
    val: AllGeometryParams[M][K]
  ) => void
  onResetParams: (mode: GeometryMode) => void
  activeAngelContainer: AngelContainerStyle
  onContainerChange: (style: AngelContainerStyle) => void
  activeShowDistance: boolean
  onToggleDistance: () => void
  activeDistanceMetric: DistanceMetric
  onSetMetric: (metric: DistanceMetric) => void
  activeShowCoords: boolean
  onToggleCoords: () => void
  activeCoordFrame: CoordFrame
  onSetCoordFrame: (frame: CoordFrame) => void
  activeCameraElevation: CameraElevation
  onSetCameraElevation: (elevation: CameraElevation) => void
  isPaused: boolean
  cameraAngles?: CameraAngles
  onCameraAnglesChange?: (angles: CameraAngles) => void
  onResetCameraAngles?: () => void
}

/**
 * 3D Topologies tab: mode selector, Angel container style, telemetry HUD toggles,
 * 360° camera orbit inspection, and per-topology parameter controls.
 */
export const TunerGeometryTab: React.FC<TunerGeometryTabProps> = ({
  activeMode,
  currentMetaName,
  onModeChange,
  params,
  onParamChange,
  onResetParams,
  activeAngelContainer,
  onContainerChange,
  activeShowDistance,
  onToggleDistance,
  activeDistanceMetric,
  onSetMetric,
  activeShowCoords,
  onToggleCoords,
  activeCoordFrame,
  onSetCoordFrame,
  activeCameraElevation,
  onSetCameraElevation,
  isPaused,
  cameraAngles,
  onCameraAnglesChange,
  onResetCameraAngles,
}) => (
  <div>
    {/* Direct Mode Selector Grid */}
    <div className="grid grid-cols-4 gap-1.5 mb-3">
      {GEOMETRY_MODES.map((mode) => {
        const isActive = mode.id === activeMode
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onModeChange(mode.id)}
            className={`px-1.5 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
              isActive
                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
            }`}
            title={mode.name}
          >
            {mode.label}
          </button>
        )
      })}
    </div>

    {/* Angel 3D Container Selector */}
    <div className="mb-3 pt-2.5 border-t border-[var(--theme-primary)]/20">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-semibold uppercase tracking-wider text-[10px]">
          Angel 3D Container
        </span>
        <span className="text-[10px] opacity-70 lowercase">{activeAngelContainer}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px]">
        {ANGEL_CONTAINER_STYLES.map((style) => {
          const isContainerActive = activeAngelContainer === style.id
          return (
            <button
              key={style.id}
              type="button"
              data-testid={`angel-container-${style.id}`}
              onClick={() => onContainerChange(style.id)}
              className={`px-1 py-1 rounded transition-colors cursor-pointer text-center truncate capitalize ${
                isContainerActive
                  ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                  : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
              }`}
              title={style.description}
            >
              {style.label}
            </button>
          )
        })}
      </div>
    </div>

    {/* Debug Telemetry Controls */}
    <div className="mb-3 pt-2.5 border-t border-[var(--theme-primary)]/20">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-semibold uppercase tracking-wider text-[10px] block">
            Distance Labels (HUD)
          </span>
          <span className="text-[9px] opacity-60">Show camera distance above objects</span>
        </div>
        <button
          type="button"
          data-testid="toggle-distance-labels"
          onClick={onToggleDistance}
          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
            activeShowDistance
              ? 'bg-[var(--theme-primary)] text-[#1c1b22]'
              : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
          }`}
        >
          {activeShowDistance ? 'ON' : 'OFF'}
        </button>
      </div>

      {activeShowDistance && (
        <>
          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--theme-primary)]/10 text-[9px]">
            <span className="opacity-70">Metric:</span>
            <div className="flex gap-1">
              <button
                type="button"
                data-testid="metric-euclid"
                onClick={() => onSetMetric('euclid')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                  activeDistanceMetric === 'euclid'
                    ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                    : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
                }`}
                title="Radial 3D Euclidean distance (d: X.XX)"
              >
                Euclid (d:)
              </button>
              <button
                type="button"
                data-testid="metric-depth"
                onClick={() => onSetMetric('depth')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                  activeDistanceMetric === 'depth'
                    ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                    : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
                }`}
                title="Camera view-plane perpendicular depth (z: X.XX)"
              >
                View Depth (z:)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--theme-primary)]/10 text-[9px]">
            <span className="opacity-70">Coords (XYZ):</span>
            <button
              type="button"
              data-testid="toggle-coords"
              onClick={onToggleCoords}
              className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                activeShowCoords
                  ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                  : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
              }`}
              title="Display real-time 3D (x, y, z) coordinates"
            >
              {activeShowCoords ? 'ON' : 'OFF'}
            </button>
          </div>

          {activeShowCoords && (
            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--theme-primary)]/10 text-[9px]">
              <span className="opacity-70">Coord Frame:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  data-testid="frame-view"
                  onClick={() => onSetCoordFrame('view')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                    activeCoordFrame === 'view'
                      ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                      : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
                  }`}
                  title="Screen View Space: Screen-relative coordinates (x: right, y: up, z: front)"
                >
                  View (Screen)
                </button>
                <button
                  type="button"
                  data-testid="frame-world"
                  onClick={() => onSetCoordFrame('world')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                    activeCoordFrame === 'world'
                      ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                      : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
                  }`}
                  title="World Space: Global manifold coordinates (x, y, z)"
                >
                  World (Global)
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[var(--theme-primary)]/10 text-[9px]">
            <span className="opacity-70">Camera Angle:</span>
            <div className="flex gap-1">
              <button
                type="button"
                data-testid="elevation-elevated"
                onClick={() => onSetCameraElevation('elevated')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                  activeCameraElevation === 'elevated'
                    ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                    : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
                }`}
                title="Elevated (25° downward pitch): [0, 2.55, 5.45] looking down at scene origin"
              >
                Elevated (25°)
              </button>
              <button
                type="button"
                data-testid="elevation-eye-level"
                onClick={() => onSetCameraElevation('eye-level')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                  activeCameraElevation === 'eye-level'
                    ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-bold'
                    : 'border border-[var(--theme-primary)]/30 opacity-60 hover:opacity-100'
                }`}
                title="Eye-Level (0° pitch): Pure horizontal perspective [0, 0, 6.0] eliminating vertical elevation skew"
              >
                Eye-Level (0°)
              </button>
            </div>
          </div>
        </>
      )}
    </div>

    {/* 360° Camera Orbit Inspection */}
    <div
      data-testid="camera-orbit-inspection-drawer"
      className={`p-2.5 rounded border mb-3 transition-colors ${
        isPaused
          ? 'border-[#10b981]/50 bg-[#10b981]/5 shadow-sm'
          : 'border-[var(--theme-primary)]/20 bg-[var(--theme-primary)]/5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold opacity-90">Camera Orbit Inspection</span>
          {isPaused && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#10b981] text-white">
              PAUSED
            </span>
          )}
        </div>
        <button
          type="button"
          data-testid="reset-camera-angles"
          onClick={onResetCameraAngles}
          className="text-[9px] uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-[var(--theme-highlight)] cursor-pointer"
          title="Reset camera angles to default view"
        >
          ↺ reset
        </button>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5 text-[10px] font-mono">
          <span className="opacity-70">Yaw (Azimuth)</span>
          <span className="text-[var(--theme-primary)] font-bold">
            {cameraAngles?.yaw !== undefined
              ? `${cameraAngles.yaw > 0 ? '+' : ''}${cameraAngles.yaw.toFixed(0)}°`
              : '0°'}
          </span>
        </div>
        <input
          type="range"
          data-testid="slider-yaw"
          min="-180"
          max="180"
          step="1"
          value={cameraAngles?.yaw ?? 0}
          onChange={(e) =>
            onCameraAnglesChange?.({
              ...(cameraAngles ?? { yaw: 0, pitch: 25.07, distance: 6.017 }),
              yaw: parseFloat(e.target.value),
            })
          }
          className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
        />
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5 text-[10px] font-mono">
          <span className="opacity-70">Pitch (Elevation)</span>
          <span className="text-[var(--theme-primary)] font-bold">
            {cameraAngles?.pitch !== undefined
              ? `${cameraAngles.pitch > 0 ? '+' : ''}${cameraAngles.pitch.toFixed(0)}°`
              : '25°'}
          </span>
        </div>
        <input
          type="range"
          data-testid="slider-pitch"
          min="-85"
          max="85"
          step="1"
          value={cameraAngles?.pitch ?? 25.07}
          onChange={(e) =>
            onCameraAnglesChange?.({
              ...(cameraAngles ?? { yaw: 0, pitch: 25.07, distance: 6.017 }),
              pitch: parseFloat(e.target.value),
            })
          }
          className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
        />
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-0.5 text-[10px] font-mono">
          <span className="opacity-70">Distance (Zoom)</span>
          <span className="text-[var(--theme-primary)] font-bold">
            {cameraAngles?.distance !== undefined ? `${cameraAngles.distance.toFixed(1)}x` : '6.0x'}
          </span>
        </div>
        <input
          type="range"
          data-testid="slider-distance"
          min="2.5"
          max="12.0"
          step="0.1"
          value={cameraAngles?.distance ?? 6.017}
          onChange={(e) =>
            onCameraAnglesChange?.({
              ...(cameraAngles ?? { yaw: 0, pitch: 25.07, distance: 6.017 }),
              distance: parseFloat(e.target.value),
            })
          }
          className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
        />
      </div>

      <div className="flex gap-1 pt-1 border-t border-[var(--theme-primary)]/10 text-[9px] font-mono">
        <button
          type="button"
          data-testid="preset-front"
          onClick={() =>
            onCameraAnglesChange?.({
              ...(cameraAngles ?? { distance: 6.017 }),
              yaw: 0,
              pitch: 0,
              distance: cameraAngles?.distance ?? 6.0,
            })
          }
          className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
          title="Front Eye-Level (Yaw 0°, Pitch 0°)"
        >
          Front
        </button>
        <button
          type="button"
          data-testid="preset-side"
          onClick={() =>
            onCameraAnglesChange?.({
              ...(cameraAngles ?? { distance: 6.017 }),
              yaw: 90,
              pitch: 0,
              distance: cameraAngles?.distance ?? 6.0,
            })
          }
          className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
          title="Side Profile (Yaw 90°, Pitch 0°)"
        >
          Side
        </button>
        <button
          type="button"
          data-testid="preset-top"
          onClick={() =>
            onCameraAnglesChange?.({
              ...(cameraAngles ?? { distance: 6.017 }),
              yaw: 0,
              pitch: 85,
              distance: cameraAngles?.distance ?? 6.0,
            })
          }
          className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
          title="Top Birds-Eye (Pitch 85°)"
        >
          Top
        </button>
      </div>
    </div>

    <TopologyParamControls
      activeMode={activeMode}
      params={params}
      onParamChange={onParamChange}
    />

    {/* Dedicated Reset Button for Active Geometry */}
    <div className="pt-2.5 border-t border-[var(--theme-primary)]/20 mt-3">
      <button
        type="button"
        onClick={() => onResetParams(activeMode)}
        className="w-full py-1.5 px-3 rounded border border-[var(--theme-primary)]/40 hover:bg-[var(--theme-primary)]/15 text-[11px] font-semibold cursor-pointer transition-colors text-center"
      >
        ↺ Reset {currentMetaName} to Defaults
      </button>
    </div>
  </div>
)
