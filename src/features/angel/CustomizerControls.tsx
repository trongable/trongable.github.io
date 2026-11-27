import React from 'react'
import {
  EYE_STYLES,
  MOUTH_STYLES,
  SKIN_TONE_PRESETS,
  SWATCH_PALETTE,
} from '@/features/angel/angelCatalog'
import type { AngelAvatarConfig } from '@/features/angel/angelCatalog'

interface ColorRowProps {
  label: string
  value: string
  onChange: (hex: string) => void
}

/**
 * Palette swatch row with a custom native color input picker.
 */
export const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange }) => (
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

interface BodyCustomizerTabProps {
  config: AngelAvatarConfig
  onUpdate: <K extends keyof AngelAvatarConfig>(key: K, val: AngelAvatarConfig[K]) => void
}

/**
 * Body tab controls: skin tone, eye style/color, expression, blush, freckles, and wings.
 */
export const BodyCustomizerTab: React.FC<BodyCustomizerTabProps> = ({ config, onUpdate }) => (
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
              onClick={() => onUpdate('skinTone', tone.hex)}
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
            onChange={(e) => onUpdate('skinTone', e.target.value)}
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
            onClick={() => onUpdate('eyeStyle', eye.id)}
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
      onChange={(hex) => onUpdate('eyeColor', hex)}
    />

    <div className="pt-2 border-t border-[var(--theme-primary)]/15">
      <span className="block text-[10px] opacity-70 mb-1.5">expression</span>
      <div className="grid grid-cols-3 gap-1">
        {MOUTH_STYLES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onUpdate('mouthStyle', m.id)}
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
        onChange={(e) => onUpdate('blushIntensity', parseFloat(e.target.value))}
        className="w-full accent-[var(--theme-primary)] cursor-pointer h-1 bg-[var(--theme-primary)]/20 rounded-lg appearance-none"
        aria-label="Cheek blush intensity"
      />
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => onUpdate('freckles', !config.freckles)}
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
          onClick={() => onUpdate('wingsEnabled', !config.wingsEnabled)}
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
        onChange={(hex) => onUpdate('wingColor', hex)}
      />
    )}
  </>
)
