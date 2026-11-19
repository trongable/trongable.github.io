import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import { computeHighlightColor, normalizeHex, isValidHex } from '@/utils/colorUtils'

export type ThemePresetId = 'yellow' | 'purple' | 'teal'
export type ThemeId = ThemePresetId | 'custom'

export interface ThemeColor {
  id: ThemeId
  name: string
  primary: string
  highlight: string
}

export const THEME_PALETTES: Record<ThemePresetId, ThemeColor> = {
  yellow: {
    id: 'yellow',
    name: 'Volt Yellow',
    primary: '#e2f872',
    highlight: '#f5ff9e',
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    primary: '#d4adf0',
    highlight: '#eddcf9',
  },
  teal: {
    id: 'teal',
    name: 'Teal',
    primary: '#83d4d4',
    highlight: '#afe5e5',
  },
}

export const THEME_IDS: ThemePresetId[] = ['yellow', 'purple', 'teal']

export const DEFAULT_THEME: ThemeColor = THEME_PALETTES.yellow

export interface ThemeContextValue {
  currentTheme: ThemeColor
  randomizeTheme: () => void
  setTheme: (id: ThemeId | 'green') => void
  setCustomColor: (primaryHex: string, highlightHex?: string) => void
  isThemeLocked: boolean
  setIsThemeLocked: React.Dispatch<React.SetStateAction<boolean>>
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: DEFAULT_THEME,
  randomizeTheme: () => {},
  setTheme: () => {},
  setCustomColor: () => {},
  isThemeLocked: false,
  setIsThemeLocked: () => {},
})

export const ThemeProvider: React.FC<{
  children: React.ReactNode
  initialTheme?: ThemeId | 'green'
}> = ({
  children,
  initialTheme = 'yellow',
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(() => {
    const canonical = (initialTheme === 'green' ? 'teal' : initialTheme) as ThemeId
    if (canonical !== 'custom' && THEME_PALETTES[canonical]) {
      return THEME_PALETTES[canonical]
    }
    return DEFAULT_THEME
  })
  const [isThemeLocked, setIsThemeLocked] = useState(false)
  const isThemeLockedRef = useRef(isThemeLocked)
  isThemeLockedRef.current = isThemeLocked

  const setTheme = useCallback((id: ThemeId | 'green') => {
    const canonical = (id === 'green' ? 'teal' : id) as ThemeId
    if (canonical !== 'custom' && THEME_PALETTES[canonical]) {
      setCurrentTheme(THEME_PALETTES[canonical])
    }
  }, [])

  const setCustomColor = useCallback((primaryHex: string, highlightHex?: string) => {
    const cleanPrimary = normalizeHex(primaryHex)
    if (!cleanPrimary) return
    const cleanHighlight =
      highlightHex && isValidHex(highlightHex)
        ? normalizeHex(highlightHex)!
        : computeHighlightColor(cleanPrimary)

    setCurrentTheme({
      id: 'custom',
      name: 'Custom',
      primary: cleanPrimary,
      highlight: cleanHighlight,
    })
  }, [])

  // Randomly pick a new color different from the current one (unless theme is locked)
  const randomizeTheme = useCallback(() => {
    if (isThemeLockedRef.current) return
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
      setCustomColor,
      isThemeLocked,
      setIsThemeLocked,
    }),
    [currentTheme, randomizeTheme, setTheme, setCustomColor, isThemeLocked]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  return useContext(ThemeContext)
}
