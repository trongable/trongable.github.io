import { describe, it, expect } from 'vitest'
import {
  DEFAULT_ANGEL_CONFIG,
  decodeAngelConfig,
  encodeAngelConfig,
  getItemsByCategory,
  randomizeAngelConfig,
  toggleAccessory,
} from '../angelCatalog'

describe('angelCatalog', () => {
  it('defaults to a bald and nude angel base with wings', () => {
    expect(DEFAULT_ANGEL_CONFIG.hairId).toBe('none')
    expect(DEFAULT_ANGEL_CONFIG.topId).toBe('none')
    expect(DEFAULT_ANGEL_CONFIG.bottomId).toBe('none')
    expect(DEFAULT_ANGEL_CONFIG.footwearId).toBe('none')
    expect(DEFAULT_ANGEL_CONFIG.accessoryIds).toEqual([])
    expect(DEFAULT_ANGEL_CONFIG.wingsEnabled).toBe(true)
  })

  it('round-trips avatar configuration through URL encoding', () => {
    const custom = {
      ...DEFAULT_ANGEL_CONFIG,
      skinTone: '#d99e78',
      hairId: 'short-crop',
      topId: 'oversized-hoodie',
      bottomId: 'cargo-pants',
      footwearId: 'sneakers',
      accessoryIds: ['round-glasses', 'halo'],
    }
    const encoded = encodeAngelConfig(custom)
    expect(encoded.length).toBeGreaterThan(10)
    const decoded = decodeAngelConfig(encoded)
    expect(decoded).toEqual(custom)
  })

  it('sanitizes invalid item IDs and malformed payloads safely', () => {
    expect(decodeAngelConfig('not-valid-base64!!!')).toBeNull()
    const badJson = btoa(JSON.stringify({ hairId: 'nonexistent', topId: 'graphic-tee', accessoryIds: ['bad', 'halo'] }))
    const decoded = decodeAngelConfig(badJson)
    expect(decoded?.hairId).toBe('none')
    expect(decoded?.topId).toBe('graphic-tee')
    expect(decoded?.accessoryIds).toEqual(['halo'])
  })

  it('toggles accessories cleanly', () => {
    const added = toggleAccessory([], 'halo')
    expect(added).toEqual(['halo'])
    const addedSecond = toggleAccessory(added, 'round-glasses')
    expect(addedSecond).toEqual(['halo', 'round-glasses'])
    const removed = toggleAccessory(addedSecond, 'halo')
    expect(removed).toEqual(['round-glasses'])
  })

  it('provides starter items for every wardrobe category and randomizes validly', () => {
    expect(getItemsByCategory('hair').length).toBeGreaterThanOrEqual(3)
    expect(getItemsByCategory('accessories').length).toBeGreaterThanOrEqual(2)
    expect(getItemsByCategory('tops').length).toBeGreaterThanOrEqual(3)
    expect(getItemsByCategory('bottoms').length).toBeGreaterThanOrEqual(3)
    expect(getItemsByCategory('footwear').length).toBeGreaterThanOrEqual(3)

    const rand = randomizeAngelConfig('pedestal')
    expect(rand.containerStyle).toBe('pedestal')
    expect(rand.skinTone).toMatch(/^#/)
  })
})
