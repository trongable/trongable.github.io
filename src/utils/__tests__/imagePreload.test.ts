import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  preloadAndDecodeImage,
  isImageDecoded,
  clearImagePreloadCache,
} from '../imagePreload'

describe('imagePreload utility', () => {
  const originalImage = globalThis.Image

  beforeEach(() => {
    clearImagePreloadCache()
  })

  afterEach(() => {
    globalThis.Image = originalImage
    clearImagePreloadCache()
  })

  it('resolves immediately and returns false for empty or undefined URLs', async () => {
    await preloadAndDecodeImage(undefined)
    await preloadAndDecodeImage(null)
    await preloadAndDecodeImage('')
    expect(isImageDecoded(undefined)).toBe(false)
    expect(isImageDecoded('')).toBe(false)
  })

  it('uses HTMLImageElement.prototype.decode when available and marks URL as decoded', async () => {
    const mockDecode = vi.fn().mockResolvedValue(undefined)

    class MockImageWithDecode {
      src = ''
      decode = mockDecode
    }

    globalThis.Image = MockImageWithDecode as any

    const testUrl = '/images/gallery/bison-hillside.jpg'
    expect(isImageDecoded(testUrl)).toBe(false)

    await preloadAndDecodeImage(testUrl)

    expect(mockDecode).toHaveBeenCalledTimes(1)
    expect(isImageDecoded(testUrl)).toBe(true)

    // Second call should return early from cache without invoking decode again
    await preloadAndDecodeImage(testUrl)
    expect(mockDecode).toHaveBeenCalledTimes(1)
  })

  it('gracefully handles decode() rejection without throwing', async () => {
    const mockDecode = vi.fn().mockRejectedValue(new Error('Decoding failed'))

    class MockFailingImage {
      src = ''
      decode = mockDecode
    }

    globalThis.Image = MockFailingImage as any

    const testUrl = '/images/gallery/failing-image.jpg'
    await expect(preloadAndDecodeImage(testUrl)).resolves.not.toThrow()
    expect(isImageDecoded(testUrl)).toBe(true)
  })

  it('falls back to onload when decode() is not supported', async () => {
    class MockLegacyImage {
      private _src = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(value: string) {
        this._src = value
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 10)
      }

      get src() {
        return this._src
      }
    }

    globalThis.Image = MockLegacyImage as any

    const testUrl = '/images/gallery/legacy-image.jpg'
    await preloadAndDecodeImage(testUrl)

    expect(isImageDecoded(testUrl)).toBe(true)
  })

  it('clears decoded image cache with clearImagePreloadCache()', async () => {
    const mockDecode = vi.fn().mockResolvedValue(undefined)
    class MockImage {
      src = ''
      decode = mockDecode
    }
    globalThis.Image = MockImage as any

    const testUrl = '/images/gallery/test-clear.jpg'
    await preloadAndDecodeImage(testUrl)
    expect(isImageDecoded(testUrl)).toBe(true)

    clearImagePreloadCache()
    expect(isImageDecoded(testUrl)).toBe(false)
  })
})
