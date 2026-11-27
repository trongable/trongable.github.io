import React from 'react'
import type { CameraAngles } from '@/features/scene/SceneContainer'

interface CompactInspectDockProps {
  cameraAngles?: CameraAngles
  onCameraAnglesChange?: (angles: CameraAngles) => void
  onResetCameraAngles?: () => void
}

/**
 * Floating compact orbit inspection dock shown above the HUD pill when paused
 * and the main Tuner drawer is collapsed.
 */
export const CompactInspectDock: React.FC<CompactInspectDockProps> = ({
  cameraAngles,
  onCameraAnglesChange,
  onResetCameraAngles,
}) => (
  <div
    data-testid="compact-inspection-dock"
    className="mb-2 p-2.5 rounded-xl border border-[#10b981]/40 bg-[#1c1b22]/95 backdrop-blur-md shadow-2xl w-64 text-left pointer-events-auto"
  >
    <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#10b981]/20">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
          Inspect Orbit
        </span>
        <span className="text-[9px] font-mono opacity-60">Paused</span>
      </div>
      <button
        type="button"
        data-testid="compact-reset-btn"
        onClick={onResetCameraAngles}
        className="text-[9px] uppercase tracking-wider text-[var(--theme-primary)] opacity-70 hover:opacity-100 cursor-pointer"
        title="Reset camera angles"
      >
        ↺ reset
      </button>
    </div>

    <div className="mb-1.5">
      <div className="flex justify-between text-[9px] font-mono mb-0.5">
        <span className="opacity-70">Yaw</span>
        <span className="text-[var(--theme-primary)] font-bold">
          {cameraAngles?.yaw !== undefined
            ? `${cameraAngles.yaw > 0 ? '+' : ''}${cameraAngles.yaw.toFixed(0)}°`
            : '0°'}
        </span>
      </div>
      <input
        type="range"
        data-testid="compact-slider-yaw"
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

    <div className="mb-1.5">
      <div className="flex justify-between text-[9px] font-mono mb-0.5">
        <span className="opacity-70">Pitch</span>
        <span className="text-[var(--theme-primary)] font-bold">
          {cameraAngles?.pitch !== undefined
            ? `${cameraAngles.pitch > 0 ? '+' : ''}${cameraAngles.pitch.toFixed(0)}°`
            : '25°'}
        </span>
      </div>
      <input
        type="range"
        data-testid="compact-slider-pitch"
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

    <div className="flex gap-1 pt-1 text-[8px] font-mono">
      <button
        type="button"
        data-testid="compact-preset-front"
        onClick={() =>
          onCameraAnglesChange?.({
            ...(cameraAngles ?? { distance: 6.017 }),
            yaw: 0,
            pitch: 0,
            distance: cameraAngles?.distance ?? 6.0,
          })
        }
        className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
      >
        Front
      </button>
      <button
        type="button"
        data-testid="compact-preset-side"
        onClick={() =>
          onCameraAnglesChange?.({
            ...(cameraAngles ?? { distance: 6.017 }),
            yaw: 90,
            pitch: 0,
            distance: cameraAngles?.distance ?? 6.0,
          })
        }
        className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
      >
        Side
      </button>
      <button
        type="button"
        data-testid="compact-preset-top"
        onClick={() =>
          onCameraAnglesChange?.({
            ...(cameraAngles ?? { distance: 6.017 }),
            yaw: 0,
            pitch: 85,
            distance: cameraAngles?.distance ?? 6.0,
          })
        }
        className="flex-1 py-0.5 rounded border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)] cursor-pointer text-center"
      >
        Top
      </button>
    </div>
  </div>
)
