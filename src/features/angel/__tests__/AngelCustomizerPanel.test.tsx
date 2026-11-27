import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AngelCustomizerPanel } from '@/features/angel/AngelCustomizerPanel'
import { DEFAULT_ANGEL_CONFIG, AngelAvatarConfig } from '@/features/angel/angelCatalog'

function renderPanel(initial: AngelAvatarConfig = DEFAULT_ANGEL_CONFIG) {
  const onChange = vi.fn()
  const onReset = vi.fn()
  const onRandomize = vi.fn()
  const onCopyLink = vi.fn()
  const onSavePng = vi.fn()
  const onFocusChange = vi.fn()
  const onToggleTurntable = vi.fn()

  const utils = render(
    <AngelCustomizerPanel
      config={initial}
      onChange={onChange}
      onReset={onReset}
      onRandomize={onRandomize}
      onCopyLink={onCopyLink}
      onSavePng={onSavePng}
      copiedLink={false}
      focusPreset="full"
      onFocusChange={onFocusChange}
      isTurntableActive={false}
      onToggleTurntable={onToggleTurntable}
    />
  )

  return {
    ...utils,
    onChange,
    onReset,
    onRandomize,
    onCopyLink,
    onSavePng,
    onFocusChange,
    onToggleTurntable,
  }
}

describe('AngelCustomizerPanel', () => {
  it('handles body controls: skin tone, eyes, mouth, blush, freckles, and wings', () => {
    const { onChange } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Skin tone porcelain' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ skinTone: '#f7dfd0' }))

    fireEvent.change(screen.getByLabelText('Custom skin tone'), { target: { value: '#abcdef' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ skinTone: '#abcdef' }))

    fireEvent.click(screen.getByRole('button', { name: 'starlight' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ eyeStyle: 'starlight' }))

    fireEvent.click(screen.getByRole('button', { name: 'soft pout' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mouthStyle: 'pout' }))

    fireEvent.change(screen.getByLabelText('Cheek blush intensity'), { target: { value: '0.25' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ blushIntensity: 0.25 }))

    fireEvent.click(screen.getByRole('button', { name: /freckles:/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ freckles: true }))

    fireEvent.click(screen.getByRole('button', { name: /wings:/i }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ wingsEnabled: false }))

    // Eye color and wing color swatches / custom picker
    const swatchBtns = screen.getAllByRole('button', { name: /Select color #d4adf0/i })
    fireEvent.click(swatchBtns[0])
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ eyeColor: '#d4adf0' }))

    fireEvent.change(screen.getByLabelText('Custom wing color'), { target: { value: '#123456' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ wingColor: '#123456' }))
  })

  it('switches across wardrobe and stage tabs and updates selections & colors', () => {
    const dressedConfig: AngelAvatarConfig = {
      ...DEFAULT_ANGEL_CONFIG,
      hairId: 'short-crop',
      accessoryIds: ['halo'],
      topId: 'oversized-hoodie',
      bottomId: 'cargo-pants',
      footwearId: 'sneakers',
    }
    const { onChange } = renderPanel(dressedConfig)

    fireEvent.click(screen.getByTestId('tab-hair'))
    fireEvent.click(screen.getByTestId('item-hair-long-bob'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ hairId: 'long-bob' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select color #e2f872' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ hairColor: '#e2f872' }))

    fireEvent.click(screen.getByTestId('tab-accessories'))
    fireEvent.click(screen.getByTestId('item-accessories-round-glasses'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ accessoryIds: ['halo', 'round-glasses'] })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Select color #83d4d4' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ accessoryColor: '#83d4d4' }))

    fireEvent.click(screen.getByTestId('tab-tops'))
    fireEvent.click(screen.getByTestId('item-tops-graphic-tee'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ topId: 'graphic-tee' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select color #eb6b34' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ topColor: '#eb6b34' }))

    fireEvent.click(screen.getByTestId('tab-bottoms'))
    fireEvent.click(screen.getByTestId('item-bottoms-athletic-shorts'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ bottomId: 'athletic-shorts' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select color #424a68' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ bottomColor: '#424a68' }))

    fireEvent.click(screen.getByTestId('tab-footwear'))
    fireEvent.click(screen.getByTestId('item-footwear-slides'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ footwearId: 'slides' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select color #f4f4f6' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ footwearColor: '#f4f4f6' }))

    fireEvent.click(screen.getByTestId('tab-stage'))
    fireEvent.click(screen.getByTestId('stage-capsule'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ containerStyle: 'capsule' }))
  })

  it('triggers focus presets, turntable spin, and bottom studio actions', () => {
    const {
      onFocusChange,
      onToggleTurntable,
      onRandomize,
      onReset,
      onCopyLink,
      onSavePng,
    } = renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'face' }))
    expect(onFocusChange).toHaveBeenCalledWith('face')

    fireEvent.click(screen.getByRole('button', { name: 'feet' }))
    expect(onFocusChange).toHaveBeenCalledWith('feet')

    fireEvent.click(screen.getByRole('button', { name: /spin off/i }))
    expect(onToggleTurntable).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'random' }))
    expect(onRandomize).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'share' }))
    expect(onCopyLink).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'save png' }))
    expect(onSavePng).toHaveBeenCalledTimes(1)
  })
})
