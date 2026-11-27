import React, { useState } from 'react'
import { useRouter } from '@/routes/Router'
import { useTheme, THEME_IDS, THEME_PALETTES } from '@/context/ThemeContext'
import { useAngelContainer, ANGEL_CONTAINER_STYLES } from '@/features/angel/AngelContainerContext'
import { usePowerManager } from '@/hooks/usePowerManager'
import { SceneContainer } from '@/features/scene/SceneContainer'
import { GeometryDispatcher } from '@/features/topologies/GeometryDispatcher'
import {
  GeometryMode,
  GEOMETRY_MODES,
  DEFAULT_GEOMETRY_PARAMS,
  GUIDE_STYLES,
  GuideStyle,
} from '@/features/topologies/config/geometryConfig'
import { GpuGlitchOverlay } from '@/features/effects/GpuGlitchOverlay'
import { TunerSlider, TunerCheckbox, TunerStyleGrid } from '@/features/tuner/TunerControls'
import { scrambleGlyphs } from '@/utils/glyphUtils'
import { getContrastRatio, isValidHex, normalizeHex } from '@/utils/colorUtils'

/**
 * Internal UI Catalog page (`/ui-catalog`), accessible exclusively via the
 * `ui-catalog` command in CyberTerminalLine.
 */
export const UiCatalogPage: React.FC = () => {
  const { navigate } = useRouter()
  const { currentTheme, setTheme, setCustomColor } = useTheme()
  const { containerStyle, setContainerStyle } = useAngelContainer()
  const { targetFps, targetDpr, isSleeping } = usePowerManager()

  const [hexInput, setHexInput] = useState(currentTheme.primary)
  const [sliderValue, setSliderValue] = useState(0.5)
  const [checkboxValue, setCheckboxValue] = useState(true)
  const [guideStyle, setGuideStyle] = useState<GuideStyle>('solid')
  const [sampleText, setSampleText] = useState('ui catalog')
  const [previewMode, setPreviewMode] = useState<GeometryMode>('halo')
  const [isPreviewPaused, setIsPreviewPaused] = useState(false)
  const [isGlitchPreviewActive, setIsGlitchPreviewActive] = useState(false)

  const contrast = getContrastRatio(currentTheme.highlight, '#1c1b22')

  const handleHexChange = (val: string) => {
    setHexInput(val)
    if (isValidHex(val)) {
      const normalized = normalizeHex(val)
      if (normalized) setCustomColor(normalized)
    }
  }

  const triggerGlitchPreview = () => {
    setIsGlitchPreviewActive(true)
    window.setTimeout(() => setIsGlitchPreviewActive(false), 600)
  }

  return (
    <main
      data-testid="ui-catalog-page"
      className="min-h-dvh w-full bg-[#141417] text-neutral-200 px-6 py-16 md:px-12"
    >
      <GpuGlitchOverlay
        isActive={isGlitchPreviewActive}
        duration={600}
        primaryColor={currentTheme.primary}
        imageProbability={0}
      />

      <button
        type="button"
        onClick={() => navigate('/?expanded=true')}
        className="fixed top-6 left-6 z-40 font-mono text-xs text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
        aria-label="Return home"
      >
        ← home
      </button>

      <div className="mx-auto max-w-4xl space-y-12">
        <header className="border-b border-neutral-800 pb-6">
          <p className="font-mono text-[11px] text-neutral-500 mb-1">internal / ui-catalog</p>
          <h1 className="text-xl font-medium text-neutral-100">UI Catalog</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Minimal reference of design tokens, UI primitives, utilities, and 3D scene components.
          </p>
        </header>

        {/* 1. Theme Tokens & Palettes */}
        <section aria-labelledby="section-tokens" className="space-y-4">
          <h2 id="section-tokens" className="font-mono text-xs uppercase tracking-wider text-neutral-400">
            1. Theme Tokens & Palettes
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-[#19191d] p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {THEME_IDS.map((id) => {
                const palette = THEME_PALETTES[id]
                if (!palette) return null
                const isActive = currentTheme.id === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTheme(id)
                      setHexInput(palette.primary)
                    }}
                    className={`flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'border-neutral-300 bg-neutral-800 text-neutral-100'
                        : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: palette.primary }}
                    />
                    {id}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-800 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block mb-1">primary</span>
                <span className="text-neutral-200">{currentTheme.primary}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1">highlight (contrast {contrast}:1)</span>
                <span className="text-neutral-200">{currentTheme.highlight}</span>
              </div>
              <div>
                <label className="text-neutral-500 block mb-1" htmlFor="catalog-hex-input">
                  custom hex
                </label>
                <input
                  id="catalog-hex-input"
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  maxLength={7}
                  className="w-28 rounded border border-neutral-700 bg-[#141417] px-2 py-1 text-xs text-neutral-200"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Tuner UI Primitives */}
        <section aria-labelledby="section-primitives" className="space-y-4">
          <h2 id="section-primitives" className="font-mono text-xs uppercase tracking-wider text-neutral-400">
            2. Tuner UI Primitives
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-[#19191d] p-5 space-y-5 text-xs font-mono">
            <TunerSlider
              label="TunerSlider"
              ariaLabel="Catalog sample slider"
              valueDisplay={sliderValue.toFixed(2)}
              min={0}
              max={1}
              step={0.05}
              value={sliderValue}
              onChange={setSliderValue}
            />
            <TunerCheckbox
              label="TunerCheckbox"
              checked={checkboxValue}
              onChange={setCheckboxValue}
            />
            <TunerStyleGrid
              label="TunerStyleGrid"
              options={GUIDE_STYLES}
              activeValue={guideStyle}
              onSelect={setGuideStyle}
            />
          </div>
        </section>

        {/* 3. Navigation & Terminal */}
        <section aria-labelledby="section-navigation" className="space-y-4">
          <h2 id="section-navigation" className="font-mono text-xs uppercase tracking-wider text-neutral-400">
            3. Navigation & Terminal
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-[#19191d] p-5 space-y-3 font-mono text-xs text-neutral-300">
            <p className="text-neutral-400">
              Global keyboard terminal (`CyberTerminalLine`) commands:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300">
              <li className="rounded border border-neutral-800 px-3 py-2">tuner / tuner enable / tuner disable</li>
              <li className="rounded border border-neutral-800 px-3 py-2">ui-catalog</li>
            </ul>
          </div>
        </section>

        {/* 4. Effects & Text Utilities */}
        <section aria-labelledby="section-effects" className="space-y-4">
          <h2 id="section-effects" className="font-mono text-xs uppercase tracking-wider text-neutral-400">
            4. Effects & Text Utilities
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-[#19191d] p-5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-neutral-200 min-w-28">{sampleText}</span>
              <button
                type="button"
                onClick={() => setSampleText((prev) => (prev === 'ui catalog' ? scrambleGlyphs('ui catalog', 4) : 'ui catalog'))}
                className="rounded border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500 cursor-pointer"
              >
                scrambleGlyphs
              </button>
            </div>
            <button
              type="button"
              onClick={triggerGlitchPreview}
              className="rounded border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500 cursor-pointer"
            >
              Trigger GpuGlitchOverlay
            </button>
          </div>
        </section>

        {/* 5. 3D Scene & Topology Components */}
        <section aria-labelledby="section-3d" className="space-y-4">
          <h2 id="section-3d" className="font-mono text-xs uppercase tracking-wider text-neutral-400">
            5. 3D Scene & Topology Components
          </h2>
          <div className="rounded-lg border border-neutral-800 bg-[#19191d] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex flex-wrap gap-1.5">
                {GEOMETRY_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreviewMode(m.id)}
                    className={`rounded border px-2.5 py-1 cursor-pointer ${
                      previewMode === m.id
                        ? 'border-neutral-300 bg-neutral-800 text-neutral-100'
                        : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewPaused((p) => !p)}
                className="rounded border border-neutral-700 px-2.5 py-1 text-neutral-300 hover:border-neutral-500 cursor-pointer"
              >
                {isPreviewPaused ? 'Resume' : 'Pause'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {ANGEL_CONTAINER_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setContainerStyle(s.id)}
                  className={`rounded border px-2 py-1 cursor-pointer ${
                    containerStyle === s.id
                      ? 'border-neutral-300 bg-neutral-800 text-neutral-100'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative h-72 w-full overflow-hidden rounded border border-neutral-800 bg-[#111114]">
              <SceneContainer
                isGlitching={isGlitchPreviewActive}
                isPaused={isPreviewPaused}
                theme={currentTheme}
                targetFps={targetFps}
                targetDpr={targetDpr}
                isSleeping={isSleeping}
              >
                <GeometryDispatcher
                  mode={previewMode}
                  params={DEFAULT_GEOMETRY_PARAMS}
                  isExpanded={true}
                  onSelect={navigate}
                  isGlitching={isGlitchPreviewActive}
                  isPaused={isPreviewPaused}
                  theme={currentTheme}
                />
              </SceneContainer>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
