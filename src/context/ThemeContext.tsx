import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export type ThemeId = 'yellow' | 'pink' | 'green' | 'orange'

export interface ThemeColor {
  id: ThemeId
  name: string
  primary: string
  highlight: string
}

export const THEME_PALETTES: Record<ThemeId, ThemeColor> = {
  yellow: {
    id: 'yellow',
    name: 'Volt Yellow',
    primary: '#e2f872',
    highlight: '#f5ff9e',
  },
  pink: {
    id: 'pink',
    name: 'Toxic Pink',
    primary: '#ff007f',
    highlight: '#ff70ba',
  },
  green: {
    id: 'green',
    name: 'Toxic Green',
    primary: '#39ff14',
    highlight: '#8fff70',
  },
  orange: {
    id: 'orange',
    name: 'Toxic Orange',
    primary: '#ff3c00',
    highlight: '#ff8855',
  },
}

export const THEME_IDS: ThemeId[] = ['yellow', 'pink', 'green', 'orange']

export const DEFAULT_THEME: ThemeColor = THEME_PALETTES.yellow

export interface ThemeContextValue {
  currentTheme: ThemeColor
  randomizeTheme: () => void
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: DEFAULT_THEME,
  randomizeTheme: () => {},
  setTheme: () => {},
})

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialTheme?: ThemeId }> = ({
  children,
  initialTheme = 'yellow',
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(() => THEME_PALETTES[initialTheme] || DEFAULT_THEME)

  const setTheme = useCallback((id: ThemeId) => {
    if (THEME_PALETTES[id]) {
      setCurrentTheme(THEME_PALETTES[id])
    }
  }, [])

  // Randomly pick a new neon color different from the current one
  const randomizeTheme = useCallback(() => {
    setCurrentTheme((prev) => {
      const candidates = THEME_IDS.filter((id) => id !== prev.id)
      const nextId = candidates[Math.floor(Math.random() * candidates.length)]
      return THEME_PALETTES[nextId]
    })
  }, [])

  // Propagate custom CSS variables to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-primary', currentTheme.primary)
      document.documentElement.style.setProperty('--theme-highlight', currentTheme.highlight)
    }
  }, [currentTheme])

  const value = useMemo(
    () => ({
      currentTheme,
      randomizeTheme,
      setTheme,
    }),
    [currentTheme, randomizeTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext)
}
