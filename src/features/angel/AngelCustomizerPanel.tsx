import React, { useState } from 'react'
import { ANGEL_CONTAINER_STYLES } from '@/features/angel/AngelContainerContext'
import {
  AngelAvatarConfig,
  AngelCategory,
  getItemsByCategory,
  toggleAccessory,
} from '@/features/angel/angelCatalog'
import type { CameraFocusPreset } from '@/features/angel/AngelStudioCanvas'
import { BodyCustomizerTab, ColorRow } from '@/features/angel/CustomizerControls'

const CATEGORIES: { id: AngelCategory; label: string }[] = [
  { id: 'body', label: 'body' },
  { id: 'hair', label: 'hair' },
  { id: 'accessories', label: 'acc' },
  { id: 'tops', label: 'tops' },
  { id: 'bottoms', label: 'bottoms' },
  { id: 'footwear', label: 'shoes' },
  { id: 'stage', label: 'stage' },
]

type WardrobeSlotCategory = 'hair' | 'tops' | 'bottoms' | 'footwear'

const SLOT_CONFIG_KEYS: Record<
  WardrobeSlotCategory,
  { idKey: 'hairId' | 'topId' | 'bottomId' | 'footwearId'; colorKey: 'hairColor' | 'topColor' | 'bottomColor' | 'footwearColor' }
> = {
  hair: { idKey: 'hairId', colorKey: 'hairColor' },
  tops: { idKey: 'topId', colorKey: 'topColor' },
  bottoms: { idKey: 'bottomId', colorKey: 'bottomColor' },
  footwear: { idKey: 'footwearId', colorKey: 'footwearColor' },
}

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

  const isWardrobeSlot = (tab: AngelCategory): tab is WardrobeSlotCategory =>
    tab === 'hair' || tab === 'tops' || tab === 'bottoms' || tab === 'footwear'

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
        {activeTab === 'body' && <BodyCustomizerTab config={config} onUpdate={update} />}

        {isWardrobeSlot(activeTab) && (() => {
          const { idKey, colorKey } = SLOT_CONFIG_KEYS[activeTab]
          const selectedId = config[idKey]
          return (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {getItemsByCategory(activeTab).map((item) => {
                  const isSelected = selectedId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`item-${activeTab}-${item.id}`}
                      onClick={() => update(idKey, item.id)}
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
              {selectedId !== 'none' && (
                <ColorRow
                  label={`${activeTab} color`}
                  value={config[colorKey]}
                  onChange={(hex) => update(colorKey, hex)}
                />
              )}
            </>
          )
        })()}

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
