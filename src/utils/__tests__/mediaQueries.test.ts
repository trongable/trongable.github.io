import { describe, it, expect, afterEach, vi } from 'vitest'
import { isReducedMotionEnabled } from '@/utils/mediaQueries'

describe('isReducedMotionEnabled', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when matchMedia reports reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList)
    expect(isReducedMotionEnabled()).toBe(true)
  })

  it('returns false when matchMedia does not match reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
    } as MediaQueryList)
    expect(isReducedMotionEnabled()).toBe(false)
  })
})
