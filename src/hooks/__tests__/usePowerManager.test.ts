import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePowerManager, getStoredPowerMode } from '../usePowerManager'

describe('usePowerManager', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads default power mode as auto with uncapped FPS and managed DPR', () => {
    expect(getStoredPowerMode()).toBe('auto')
    const { result } = renderHook(() => usePowerManager())
    expect(result.current.powerMode).toBe('auto')
    expect(result.current.targetFps).toBeNull() // Uncapped native refresh
    expect(result.current.targetDpr).toEqual([1, 2])
    expect(result.current.isSleeping).toBe(false)
  })

  it('changes power mode and persists to localStorage with trongngyn_ prefix', () => {
    const { result } = renderHook(() => usePowerManager())

    act(() => {
      result.current.setPowerMode('eco')
    })

    expect(result.current.powerMode).toBe('eco')
    expect(window.localStorage.getItem('trongngyn_power_mode')).toBe('eco')
    expect(result.current.targetDpr).toBe(1.0) // Reduced DPR
    expect(result.current.targetFps).toBeNull() // Uncapped native refresh

    act(() => {
      result.current.setPowerMode('uncapped')
    })

    expect(result.current.powerMode).toBe('uncapped')
    expect(window.localStorage.getItem('trongngyn_power_mode')).toBe('uncapped')
    expect(result.current.targetFps).toBeNull() // Uncapped native refresh
    expect(result.current.targetDpr).toEqual([1, 2])
  })

  it('drops targetFps to 0 and flags isSleeping when document becomes hidden', () => {
    const { result } = renderHook(() => usePowerManager())

    expect(result.current.isSleeping).toBe(false)
    expect(result.current.targetFps).toBeNull()

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.isSleeping).toBe(true)
    expect(result.current.targetFps).toBe(0)
    expect(result.current.isDocumentVisible).toBe(false)

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.isSleeping).toBe(false)
    expect(result.current.targetFps).toBeNull()
    expect(result.current.isDocumentVisible).toBe(true)
  })

  it('allows uncapped FPS in auto mode and manages DPR based on power source', () => {
    const { result } = renderHook(() => usePowerManager())

    expect(result.current.powerMode).toBe('auto')
    expect(result.current.isBattery).toBe(false) // AC power default in test environment
    expect(result.current.targetFps).toBeNull() // Uncapped FPS
    expect(result.current.targetDpr).toEqual([1, 2]) // Full resolution on AC
  })
})
