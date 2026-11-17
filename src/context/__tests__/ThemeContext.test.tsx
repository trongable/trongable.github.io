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
      result.current.setTheme('pink')
    })

    expect(result.current.currentTheme.id).toBe('pink')
    expect(result.current.currentTheme.primary).toBe('#ff007f')
    expect(result.current.currentTheme.highlight).toBe('#ff70ba')
    expect(document.documentElement.style.getPropertyValue('--theme-primary')).toBe('#ff007f')

    act(() => {
      result.current.setTheme('green')
    })

    expect(result.current.currentTheme.id).toBe('green')
    expect(result.current.currentTheme.primary).toBe('#39ff14')

    act(() => {
      result.current.setTheme('orange')
    })

    expect(result.current.currentTheme.id).toBe('orange')
    expect(result.current.currentTheme.primary).toBe('#ff3c00')
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
    expect(result.current.currentTheme.primary).toBe(THEME_PALETTES[newId].primary)
  })

  it('supports initialTheme prop', () => {
    const customWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ThemeProvider initialTheme="orange">{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper: customWrapper })
    expect(result.current.currentTheme.id).toBe('orange')
    expect(result.current.currentTheme.primary).toBe('#ff3c00')
  })
})
