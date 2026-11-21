import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export type SonnyContainerStyle = 'diorama' | 'pedestal' | 'capsule' | 'wirebox' | 'crystal' | 'none'

export interface SonnyContainerMeta {
  id: SonnyContainerStyle
  name: string
  label: string
  description: string
}

export const SONNY_CONTAINER_STYLES: SonnyContainerMeta[] = [
  {
    id: 'diorama',
    name: 'L-Shaped Diorama',
    label: 'diorama',
    description: 'Architectural display stand with back wall and square floor base',
  },
  {
    id: 'pedestal',
    name: 'Hologram Pedestal',
    label: 'pedestal',
    description: 'Floating circular projector disc with concentric neon emitter ring',
  },
  {
    id: 'capsule',
    name: 'Stasis Cryo-Pod',
    label: 'capsule',
    description: 'Cylindrical sci-fi containment chamber with top/bottom rings and glass shell',
  },
  {
    id: 'wirebox',
    name: 'Neon Wirebox Vitrine',
    label: 'wirebox',
    description: 'Orthogonal 3D bounding glass vitrine with glowing wireframe edges',
  },
  {
    id: 'crystal',
    name: 'Origami Crystal Cage',
    label: 'crystal',
    description: 'Polyhedral crystalline cage with glowing gem lattice and translucent facets',
  },
  {
    id: 'none',
    name: 'Floating Sprite',
    label: 'none',
    description: 'Pure floating holographic character with zero background geometry',
  },
]

export const DEFAULT_SONNY_CONTAINER: SonnyContainerStyle = 'capsule'
export const SONNY_CONTAINER_STORAGE_KEY = 'trongngyn_sonny_container'

export function isValidSonnyContainer(val: unknown): val is SonnyContainerStyle {
  return (
    typeof val === 'string' &&
    ['diorama', 'pedestal', 'capsule', 'wirebox', 'crystal', 'none'].includes(val)
  )
}

export interface SonnyContainerContextValue {
  containerStyle: SonnyContainerStyle
  setContainerStyle: (style: SonnyContainerStyle) => void
  containerMeta: SonnyContainerMeta
}

const defaultContainerMeta =
  SONNY_CONTAINER_STYLES.find((meta) => meta.id === DEFAULT_SONNY_CONTAINER) ??
  SONNY_CONTAINER_STYLES[0]

const SonnyContainerContext = createContext<SonnyContainerContextValue>({
  containerStyle: DEFAULT_SONNY_CONTAINER,
  setContainerStyle: () => {},
  containerMeta: defaultContainerMeta,
})

export const SonnyContainerProvider: React.FC<{
  children: React.ReactNode
  initialStyle?: SonnyContainerStyle
}> = ({ children, initialStyle }) => {
  const [containerStyle, setContainerStyleState] = useState<SonnyContainerStyle>(() => {
    if (initialStyle && isValidSonnyContainer(initialStyle)) {
      return initialStyle
    }

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const paramVal = queryParams.get('container')
        if (paramVal && isValidSonnyContainer(paramVal)) {
          return paramVal
        }

        const stored = window.localStorage.getItem(SONNY_CONTAINER_STORAGE_KEY)
        if (stored && isValidSonnyContainer(stored)) {
          return stored
        }
      } catch {
        // Ignore localStorage / window access errors
      }
    }
    return DEFAULT_SONNY_CONTAINER
  })

  const setContainerStyle = useCallback((style: SonnyContainerStyle) => {
    if (!isValidSonnyContainer(style)) return
    setContainerStyleState(style)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(SONNY_CONTAINER_STORAGE_KEY, style)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  // Keep in sync with storage across tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SONNY_CONTAINER_STORAGE_KEY && e.newValue && isValidSonnyContainer(e.newValue)) {
        setContainerStyleState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const containerMeta = useMemo(() => {
    return (
      SONNY_CONTAINER_STYLES.find((meta) => meta.id === containerStyle) ??
      defaultContainerMeta
    )
  }, [containerStyle])

  const value = useMemo(
    () => ({
      containerStyle,
      setContainerStyle,
      containerMeta,
    }),
    [containerStyle, setContainerStyle, containerMeta]
  )

  return (
    <SonnyContainerContext.Provider value={value}>
      {children}
    </SonnyContainerContext.Provider>
  )
}

export const useSonnyContainer = (): SonnyContainerContextValue => {
  return useContext(SonnyContainerContext)
}
