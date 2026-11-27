import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export type AngelContainerStyle = 'diorama' | 'pedestal' | 'capsule' | 'wirebox' | 'crystal' | 'none'

export interface AngelContainerMeta {
  id: AngelContainerStyle
  name: string
  label: string
  description: string
}

export const ANGEL_CONTAINER_STYLES: AngelContainerMeta[] = [
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

export const DEFAULT_ANGEL_CONTAINER: AngelContainerStyle = 'capsule'
export const ANGEL_CONTAINER_STORAGE_KEY = 'trongngyn_angel_container'

export function isValidAngelContainer(val: unknown): val is AngelContainerStyle {
  return (
    typeof val === 'string' &&
    ['diorama', 'pedestal', 'capsule', 'wirebox', 'crystal', 'none'].includes(val)
  )
}

export interface AngelContainerContextValue {
  containerStyle: AngelContainerStyle
  setContainerStyle: (style: AngelContainerStyle) => void
  containerMeta: AngelContainerMeta
}

const defaultContainerMeta =
  ANGEL_CONTAINER_STYLES.find((meta) => meta.id === DEFAULT_ANGEL_CONTAINER) ??
  ANGEL_CONTAINER_STYLES[0]

const AngelContainerContext = createContext<AngelContainerContextValue>({
  containerStyle: DEFAULT_ANGEL_CONTAINER,
  setContainerStyle: () => {},
  containerMeta: defaultContainerMeta,
})

export const AngelContainerProvider: React.FC<{
  children: React.ReactNode
  initialStyle?: AngelContainerStyle
}> = ({ children, initialStyle }) => {
  const [containerStyle, setContainerStyleState] = useState<AngelContainerStyle>(() => {
    if (initialStyle && isValidAngelContainer(initialStyle)) {
      return initialStyle
    }

    if (typeof window !== 'undefined') {
      try {
        const queryParams = new URLSearchParams(window.location.search)
        const paramVal = queryParams.get('container')
        if (paramVal && isValidAngelContainer(paramVal)) {
          return paramVal
        }

        const stored = window.localStorage.getItem(ANGEL_CONTAINER_STORAGE_KEY)
        if (stored && isValidAngelContainer(stored)) {
          return stored
        }
      } catch {
        // Ignore localStorage / window access errors
      }
    }
    return DEFAULT_ANGEL_CONTAINER
  })

  const setContainerStyle = useCallback((style: AngelContainerStyle) => {
    if (!isValidAngelContainer(style)) return
    setContainerStyleState(style)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ANGEL_CONTAINER_STORAGE_KEY, style)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  // Keep in sync with storage across tabs/windows
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ANGEL_CONTAINER_STORAGE_KEY && e.newValue && isValidAngelContainer(e.newValue)) {
        setContainerStyleState(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const containerMeta = useMemo(() => {
    return (
      ANGEL_CONTAINER_STYLES.find((meta) => meta.id === containerStyle) ??
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
    <AngelContainerContext.Provider value={value}>
      {children}
    </AngelContainerContext.Provider>
  )
}

export const useAngelContainer = (): AngelContainerContextValue => {
  return useContext(AngelContainerContext)
}
