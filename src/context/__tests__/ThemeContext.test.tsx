import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import {
  ThemeProvider,
  useTheme,
  THEME_PALETTES,
  THEME_IDS,
} from '../ThemeContext'

describe('ThemeContext', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>{children}</ThemeProvider>
  )

  it('provides the default Volt Yellow theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.currentTheme.id).toBe('yellow')
    expect(result.current.currentTheme.primary).toBe('#e2f872')
    expect(result.current.currentTheme.highlight).toBe('#f5ff9e')
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#e2f872')
    expect(document.documentElement.style.getPropertyValue('--theme-highlight')).toBe('#f5ff9e')
  })

  it('allows manually switching themes via setTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('purple')
    })

    expect(result.current.currentTheme.id).toBe('purple')
    expect(result.current.currentTheme.primary).toBe('#d4adf0')
    expect(result.current.currentTheme.highlight).toBe('#eddcf9')
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#d4adf0')

    act(() => {
      result.current.setTheme('teal')
    })

    expect(result.current.currentTheme.id).toBe('teal')
    expect(result.current.currentTheme.primary).toBe('#83d4d4')
    expect(result.current.currentTheme.highlight).toBe('#afe5e5')
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#83d4d4')

    // Backwards-compatible 'green' alias sets teal
    act(() => {
      result.current.setTheme('green')
    })
    expect(result.current.currentTheme.id).toBe('teal')
    expect(result.current.currentTheme.primary).toBe('#83d4d4')
  })

  it('randomizes to a different color when randomizeTheme is called', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    const initialId = result.current.currentTheme.id

    act(() => {
      result.current.randomizeTheme()
    })

    const newId = result.current.currentTheme.id
    expect(newId).not.toBe(initialId)
    expect(THEME_IDS).toContain(newId)
    if (newId !== 'custom') {
      expect(result.current.currentTheme.primary).toBe(THEME_PALETTES[newId].primary)
    }
  })

  it('supports initialTheme prop', () => {
    const customWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ThemeProvider initialTheme="purple">{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper: customWrapper })
    expect(result.current.currentTheme.id).toBe('purple')
    expect(result.current.currentTheme.primary).toBe('#d4adf0')
  })

  it('allows setting a custom primary hex color with automatically computed highlight', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setCustomColor('#3498db')
    })

    expect(result.current.currentTheme.id).toBe('custom')
    expect(result.current.currentTheme.primary).toBe('#3498db')
    expect(result.current.currentTheme.highlight).toBeDefined()
    expect(result.current.currentTheme.highlight).not.toBe('#3498db')
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#3498db')
    expect(document.documentElement.style.getPropertyValue('--theme-highlight')).toBe(
      result.current.currentTheme.highlight
    )
  })

  it('allows setting a custom primary and explicit highlight hex color', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setCustomColor('#ff0055', '#ff99bb')
    })

    expect(result.current.currentTheme.id).toBe('custom')
    expect(result.current.currentTheme.primary).toBe('#ff0055')
    expect(result.current.currentTheme.highlight).toBe('#ff99bb')
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#ff0055')
    expect(document.documentElement.style.getPropertyValue('--theme-highlight')).toBe('#ff99bb')
  })

  it('ignores invalid hex values in setCustomColor', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    const initialTheme = result.current.currentTheme

    act(() => {
      result.current.setCustomColor('not-a-color')
    })

    expect(result.current.currentTheme).toEqual(initialTheme)
  })

  it('does not randomize theme when isThemeLocked is true', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setCustomColor('#ff5500')
      result.current.setIsThemeLocked(true)
    })

    expect(result.current.isThemeLocked).toBe(true)
    expect(result.current.currentTheme.primary).toBe('#ff5500')

    act(() => {
      result.current.randomizeTheme()
    })

    // Theme should remain unchanged
    expect(result.current.currentTheme.primary).toBe('#ff5500')
    expect(result.current.currentTheme.id).toBe('custom')

    // Unlock theme and randomize
    act(() => {
      result.current.setIsThemeLocked(false)
    })
    act(() => {
      result.current.randomizeTheme()
    })

    expect(result.current.currentTheme.id).not.toBe('custom')
    expect(THEME_IDS).toContain(result.current.currentTheme.id)
  })
})
