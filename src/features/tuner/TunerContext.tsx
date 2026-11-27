import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from '@/routes/Router'

export interface TunerContextValue {
  isTunerVisible: boolean
  setIsTunerVisible: React.Dispatch<React.SetStateAction<boolean>>
  toggleTuner: (visible?: boolean) => void
  isTerminalOpen: boolean
  setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>
  isStandAlone?: boolean
}

const defaultTunerContextValue: TunerContextValue = {
  isTunerVisible: false,
  setIsTunerVisible: () => {},
  toggleTuner: () => {},
  isTerminalOpen: false,
  setIsTerminalOpen: () => {},
  isStandAlone: true,
}

const TunerContext = createContext<TunerContextValue>(defaultTunerContextValue)

const TUNER_STORAGE_KEY = 'trongngyn_tuner_visible'
const LEGACY_STORAGE_KEY = 'antigravity_tuner_visible'

export const TunerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { queryParams } = useRouter()
  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  const [isTunerVisible, setIsTunerVisibleState] = useState<boolean>(() => {
    try {
      if (
        queryParams?.tuner === 'true' ||
        queryParams?.tuner === '1' ||
        queryParams?.debug === 'true'
      ) {
        return true
      }
      return (
        window.localStorage.getItem(TUNER_STORAGE_KEY) === 'true' ||
        window.localStorage.getItem(LEGACY_STORAGE_KEY) === 'true'
      )
    } catch {
      return false
    }
  })

  // Synchronize state with localStorage
  const setIsTunerVisible: React.Dispatch<React.SetStateAction<boolean>> = useCallback((action) => {
    setIsTunerVisibleState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action
      try {
        if (next) {
          window.localStorage.setItem(TUNER_STORAGE_KEY, 'true')
        } else {
          window.localStorage.removeItem(TUNER_STORAGE_KEY)
          window.localStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      } catch {
        // ignore localStorage errors
      }
      return next
    })
  }, [])

  const toggleTuner = useCallback(
    (explicit?: boolean) => {
      setIsTunerVisible((prev) => (typeof explicit === 'boolean' ? explicit : !prev))
    },
    [setIsTunerVisible]
  )

  // Attach console command helpers for backward compatibility
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    win.tuner = () => {
      toggleTuner()
      return `Tuner visibility: ${!isTunerVisible}`
    }
    win.hideTuner = () => {
      setIsTunerVisible(false)
      return 'Tuner hidden'
    }

    return () => {
      delete win.tuner
      delete win.hideTuner
    }
  }, [isTunerVisible, toggleTuner, setIsTunerVisible])

  return (
    <TunerContext.Provider
      value={{ isTunerVisible, setIsTunerVisible, toggleTuner, isTerminalOpen, setIsTerminalOpen }}
    >
      {children}
    </TunerContext.Provider>
  )
}

export function useTuner(): TunerContextValue {
  return useContext(TunerContext) || defaultTunerContextValue
}
