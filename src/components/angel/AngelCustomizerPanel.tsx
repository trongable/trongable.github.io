import React, { useState } from 'react'
import { ANGEL_CONTAINER_STYLES } from '@/context/AngelContainerContext'
import {
  AngelAvatarConfig,
  AngelCategory,
  EYE_STYLES,
  MOUTH_STYLES,
  SKIN_TONE_PRESETS,
  SWATCH_PALETTE,
  getItemsByCategory,
  toggleAccessory,
} from './angelCatalog'
import type { CameraFocusPreset } from './AngelStudioCanvas'

const CATEGORIES: { id: AngelCategory; label: string }[] = [
  { id: 'body', label: 'body' },
  { id: 'hair', label: 'hair' },
  { id: 'accessories', label: 'acc' },
  { id: 'tops', label: 'tops' },
  { id: 'bottoms', label: 'bottoms' },
  { id: 'footwear', label: 'shoes' },
  { id: 'stage', label: 'stage' },
]

interface ColorRowProps {
  label: string
  value: string
  onChange: (hex: string) => void
}

const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange }) => (
  <div className="pt-2 border-t border-[var(--theme-primary)]/15">
    <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono">
      <span className="opacity-70">{label}</span>
      <span className="opacity-90">{value}</span>
    </div>
    <div className="flex flex-wrap items-center gap-1.5">
      {SWATCH_PALETTE.map((hex) => {
        const active = value.toLowerCase() === hex.toLowerCase()
        return (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
              active
                ? 'border-[var(--theme-highlight)] scale-110 ring-1 ring-[var(--theme-highlight)]'
                : 'border-white/20 hover:scale-105'
            }`}
            style={{ backgroundColor: hex }}
            aria-label={`Select color ${hex}`}
          />
        )
      })}
      <label className="relative w-5 h-5 rounded-full border border-[var(--theme-primary)]/40 overflow-hidden cursor-pointer flex items-center justify-center text-[9px] font-mono">
        +
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={`Custom ${label}`}
        />
      </label>
    </div>
  </div>
)

export interface AngelCustomizerPanelProps {
  config: AngelAvatarConfig
  onChange: (next: AngelAvatarConfig) => void
  onReset: () => void
  onRandomize: () => void
  onCopyLink: () => void
  onSavePng: () => void
  copiedLink: boolean
  focusPreset: CameraFocusPreset
  onFocusChange: (preset: CameraFocusPreset) => void
  isTurntableActive: boolean
  onToggleTurntable: () => void
}

export const AngelCustomizerPanel: React.FC<AngelCustomizerPanelProps> = ({
  config,
  onChange,
  onReset,
  onRandomize,
  onCopyLink,
  onSavePng,
  copiedLink,
  focusPreset,
  onFocusChange,
  isTurntableActive,
  onToggleTurntable,
}) => {
  const [activeTab, setActiveTab] = useState<AngelCategory>('body')

  const update = <K extends keyof AngelAvatarConfig>(key: K, val: AngelAvatarConfig[K]) => {
    onChange({ ...config, [key]: val })
  }

  return (
    <aside
      data-testid="angel-customizer-panel"
      className="fixed bottom-0 inset-x-0 md:inset-x-auto md:right-6 md:top-6 md:bottom-6 md:w-80 z-30 flex flex-col bg-[#131217]/90 backdrop-blur-md border-t md:border border-[var(--theme-primary)]/30 md:rounded-xl text-[var(--theme-primary)] font-mono text-xs select-none max-h-[46dvh] md:max-h-none"
    >
      {/* Top Studio Controls */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--theme-primary)]/20">
        <div className="flex items-center gap-1">
          {(['full', 'face', 'feet'] as CameraFocusPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onFocusChange(preset)}
              className={`px-2 py-0.5 rounded text-[10px] lowercase cursor-pointer transition-colors ${
                focusPreset === preset
                  ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                  : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onToggleTurntable}
          className={`px-2 py-0.5 rounded text-[10px] lowercase cursor-pointer transition-colors ${
            isTurntableActive
              ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
              : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100'
          }`}
        >
          {isTurntableActive ? 'spin on' : 'spin off'}
        </button>
      </div>

      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Angel Builder Categories"
        className="flex overflow-x-auto gap-1 px-3 py-2 border-b border-[var(--theme-primary)]/20 no-scrollbar"
      >
        {CATEGORIES.map((cat) => {
          const active = activeTab === cat.id
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={active}
              data-testid={`tab-${cat.id}`}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1 rounded text-[10px] tracking-wider lowercase shrink-0 cursor-pointer transition-colors ${
                active
                  ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                  : 'border border-[var(--theme-primary)]/25 opacity-75 hover:opacity-100 hover:border-[var(--theme-primary)]'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
        {activeTab === 'body' && (
          <>
            <div>
              <span className="block text-[10px] opacity-70 mb-1.5">skin tone</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {SKIN_TONE_PRESETS.map((tone) => {
                  const active = config.skinTone.toLowerCase() === tone.hex.toLowerCase()
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => update('skinTone', tone.hex)}
                      title={tone.label}
                      aria-label={`Skin tone ${tone.label}`}
                      className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                        active
                          ? 'border-[var(--theme-highlight)] scale-110 ring-1 ring-[var(--theme-highlight)]'
                          : 'border-white/25 hover:scale-105'
                      }`}
                      style={{ backgroundColor: tone.hex }}
                    />
                  )
                })}
                <label className="relative w-6 h-6 rounded-full border border-[var(--theme-primary)]/40 overflow-hidden cursor-pointer flex items-center justify-center text-[10px]">
                  +
                  <input
                    type="color"
                    value={config.skinTone}
                    onChange={(e) => update('skinTone', e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Custom skin tone"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--theme-primary)]/15">
              <span className="block text-[10px] opacity-70 mb-1.5">eyes</span>
              <div className="grid grid-cols-3 gap-1">
                {EYE_STYLES.map((eye) => (
                  <button
                    key={eye.id}
                    type="button"
                    onClick={() => update('eyeStyle', eye.id)}
                    className={`px-2 py-1 rounded text-[10px] lowercase cursor-pointer ${
                      config.eyeStyle === eye.id
                        ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                        : 'border border-[var(--theme-primary)]/25 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {eye.label}
                  </button>
                ))}
              </div>
            </div>

            <ColorRow
              label="eye color"
              value={config.eyeColor}
              onChange={(hex) => update('eyeColor', hex)}
            />

            <div className="pt-2 border-t border-[var(--theme-primary)]/15">
              <span className="block text-[10px] opacity-70 mb-1.5">expression</span>
              <div className="grid grid-cols-3 gap-1">
                {MOUTH_STYLES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update('mouthStyle', m.id)}
                    className={`px-2 py-1 rounded text-[10px] lowercase cursor-pointer ${
                      config.mouthStyle === m.id
                        ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                        : 'border border-[var(--theme-primary)]/25 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--theme-primary)]/15 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="opacity-70">cheek blush</span>
                <span>{Math.round(config.blushIntensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.blushIntensity}
                onChange={(e) => update('blushIntensity', parseFloat(e.target.value))}
                className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
                aria-label="Cheek blush intensity"
              />
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => update('freckles', !config.freckles)}
                  className={`px-2.5 py-1 rounded text-[10px] lowercase cursor-pointer ${
                    config.freckles
                      ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                      : 'border border-[var(--theme-primary)]/25 opacity-75 hover:opacity-100'
                  }`}
                >
                  freckles: {config.freckles ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  onClick={() => update('wingsEnabled', !config.wingsEnabled)}
                  className={`px-2.5 py-1 rounded text-[10px] lowercase cursor-pointer ${
                    config.wingsEnabled
                      ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                      : 'border border-[var(--theme-primary)]/25 opacity-75 hover:opacity-100'
                  }`}
                >
                  wings: {config.wingsEnabled ? 'on' : 'off'}
                </button>
              </div>
            </div>

            {config.wingsEnabled && (
              <ColorRow
                label="wing color"
                value={config.wingColor}
                onChange={(hex) => update('wingColor', hex)}
              />
            )}
          </>
        )}

        {(activeTab === 'hair' ||
          activeTab === 'tops' ||
          activeTab === 'bottoms' ||
          activeTab === 'footwear') && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {getItemsByCategory(activeTab).map((item) => {
                const selectedId =
                  activeTab === 'hair'
                    ? config.hairId
                    : activeTab === 'tops'
                      ? config.topId
                      : activeTab === 'bottoms'
                        ? config.bottomId
                        : config.footwearId
                const isSelected = selectedId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`item-${activeTab}-${item.id}`}
                    onClick={() => {
                      if (activeTab === 'hair') update('hairId', item.id)
                      else if (activeTab === 'tops') update('topId', item.id)
                      else if (activeTab === 'bottoms') update('bottomId', item.id)
                      else update('footwearId', item.id)
                    }}
                    className={`px-2.5 py-2 rounded text-[11px] lowercase text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                        : 'border border-[var(--theme-primary)]/25 opacity-80 hover:opacity-100 hover:border-[var(--theme-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
            {(() => {
              const selectedId =
                activeTab === 'hair'
                  ? config.hairId
                  : activeTab === 'tops'
                    ? config.topId
                    : activeTab === 'bottoms'
                      ? config.bottomId
                      : config.footwearId
              const colorVal =
                activeTab === 'hair'
                  ? config.hairColor
                  : activeTab === 'tops'
                    ? config.topColor
                    : activeTab === 'bottoms'
                      ? config.bottomColor
                      : config.footwearColor
              if (selectedId === 'none') return null
              return (
                <ColorRow
                  label={`${activeTab} color`}
                  value={colorVal}
                  onChange={(hex) => {
                    if (activeTab === 'hair') update('hairColor', hex)
                    else if (activeTab === 'tops') update('topColor', hex)
                    else if (activeTab === 'bottoms') update('bottomColor', hex)
                    else update('footwearColor', hex)
                  }}
                />
              )
            })()}
          </>
        )}

        {activeTab === 'accessories' && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {getItemsByCategory('accessories').map((item) => {
                const isSelected = config.accessoryIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`item-accessories-${item.id}`}
                    onClick={() =>
                      update('accessoryIds', toggleAccessory(config.accessoryIds, item.id))
                    }
                    className={`px-2.5 py-2 rounded text-[11px] lowercase text-left cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                        : 'border border-[var(--theme-primary)]/25 opacity-80 hover:opacity-100 hover:border-[var(--theme-primary)]'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
            {config.accessoryIds.length > 0 && (
              <ColorRow
                label="accessory color"
                value={config.accessoryColor}
                onChange={(hex) => update('accessoryColor', hex)}
              />
            )}
          </>
        )}

        {activeTab === 'stage' && (
          <div className="grid grid-cols-2 gap-1.5">
            {ANGEL_CONTAINER_STYLES.map((st) => {
              const isSelected = config.containerStyle === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  data-testid={`stage-${st.id}`}
                  onClick={() => update('containerStyle', st.id)}
                  className={`px-2.5 py-2 rounded text-[11px] lowercase text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                      : 'border border-[var(--theme-primary)]/25 opacity-80 hover:opacity-100 hover:border-[var(--theme-primary)]'
                  }`}
                  title={st.description}
                >
                  {st.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="grid grid-cols-4 gap-1.5 px-3 py-2.5 border-t border-[var(--theme-primary)]/20">
        <button
          type="button"
          onClick={onRandomize}
          className="py-1.5 rounded border border-[var(--theme-primary)]/35 hover:bg-[var(--theme-primary)]/15 text-[10px] lowercase cursor-pointer transition-colors"
        >
          random
        </button>
        <button
          type="button"
          onClick={onReset}
          className="py-1.5 rounded border border-[var(--theme-primary)]/35 hover:bg-[var(--theme-primary)]/15 text-[10px] lowercase cursor-pointer transition-colors"
        >
          reset
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className="py-1.5 rounded border border-[var(--theme-primary)]/35 hover:bg-[var(--theme-primary)]/15 text-[10px] lowercase cursor-pointer transition-colors"
        >
          {copiedLink ? 'copied!' : 'share'}
        </button>
        <button
          type="button"
          onClick={onSavePng}
          className="py-1.5 rounded bg-[var(--theme-primary)] text-[#1c1b22] font-semibold hover:opacity-90 text-[10px] lowercase cursor-pointer transition-opacity"
        >
          save png
        </button>
      </div>
    </aside>
  )
}
