import { describe, it, expect, vi, afterEach } from 'vitest'
import * as THREE from 'three'
import { createAngelFaceTexture } from '../faceTexture'
import type { EyeStyle, MouthStyle } from '../angelCatalog'

describe('createAngelFaceTexture', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an sRGB CanvasTexture with flipY = false across all eye and mouth variants', () => {
    const eyeStyles: EyeStyle[] = ['side-glance', 'forward', 'happy', 'wink', 'starlight']
    const mouthStyles: MouthStyle[] = ['smile', 'pout', 'grin']

    for (const eyeStyle of eyeStyles) {
      for (const mouthStyle of mouthStyles) {
        const tex = createAngelFaceTexture({
          eyeStyle,
          eyeColor: '#3a261d',
          blushIntensity: eyeStyle === 'happy' ? 0 : 0.7,
          blushColor: '#ff8a9b',
          freckles: eyeStyle === 'starlight',
          mouthStyle,
        })

        expect(tex).toBeInstanceOf(THREE.CanvasTexture)
        expect(tex?.flipY).toBe(false)
        expect(tex?.colorSpace).toBe(THREE.SRGBColorSpace)
        tex?.dispose()
      }
    }
  })

  it('returns null gracefully when 2d canvas context is unavailable', () => {
    const origGetContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext

    try {
      const tex = createAngelFaceTexture({
        eyeStyle: 'forward',
        eyeColor: '#222222',
        blushIntensity: 0.5,
        blushColor: '#ff8a9b',
        freckles: true,
        mouthStyle: 'smile',
      })
      expect(tex).toBeNull()
    } finally {
      HTMLCanvasElement.prototype.getContext = origGetContext
    }
  })
})
