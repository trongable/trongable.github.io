import React from 'react'

interface TunerSliderProps {
  label: string
  valueDisplay: string
  min: number | string
  max: number | string
  step: number | string
  value: number
  onChange: (value: number) => void
  ariaLabel?: string
  integer?: boolean
  labelClassName?: string
  inputClassName?: string
}

/**
 * Reusable range slider primitive for Tuner tabs.
 */
export const TunerSlider: React.FC<TunerSliderProps> = ({
  label,
  valueDisplay,
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel,
  integer = false,
  labelClassName = 'opacity-100',
  inputClassName = 'w-full accent-[var(--theme-primary)] cursor-pointer',
}) => (
  <div>
    <div className="flex justify-between mb-1 text-[11px]">
      <span className={labelClassName}>{label}</span>
      <span className="font-semibold">{valueDisplay}</span>
    </div>
    <input
      type="range"
      aria-label={ariaLabel}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(integer ? parseInt(e.target.value, 10) : parseFloat(e.target.value))}
      className={inputClassName}
    />
  </div>
)

interface TunerCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel?: string
}

/**
 * Reusable checkbox toggle primitive for Tuner tabs.
 */
export const TunerCheckbox: React.FC<TunerCheckboxProps> = ({
  label,
  checked,
  onChange,
  ariaLabel,
}) => (
  <label className="flex items-center gap-2 cursor-pointer pt-1">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="accent-[var(--theme-primary)]"
      aria-label={ariaLabel}
    />
    <span>{label}</span>
  </label>
)

interface StyleOption<T extends string> {
  id: T
  label: string
}

interface TunerStyleGridProps<T extends string> {
  label: string
  options: readonly StyleOption<T>[]
  activeValue: T
  onSelect: (value: T) => void
  columns?: 3 | 4
}

/**
 * Reusable segmented style selector grid (3 or 4 columns).
 */
export function TunerStyleGrid<T extends string>({
  label,
  options,
  activeValue,
  onSelect,
  columns = 4,
}: TunerStyleGridProps<T>) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-wider opacity-70 mb-1">{label}</span>
      <div className={`grid ${columns === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-1`}>
        {options.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => onSelect(st.id)}
            className={`px-1 py-1 text-[10px] rounded transition-colors cursor-pointer text-center truncate ${
              activeValue === st.id
                ? 'bg-[var(--theme-primary)] text-[#1c1b22] font-semibold'
                : 'border border-[var(--theme-primary)]/30 opacity-70 hover:opacity-100 hover:border-[var(--theme-primary)]'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  )
}
