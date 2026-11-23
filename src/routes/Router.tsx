import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type RoutePath = '/' | '/about' | '/more' | '/sonny' | '/videos'

export interface RouteLocation {
  currentPath: string
  search: string
  queryParams: Record<string, string>
}

export interface RouterContextType {
  currentPath: string
  search: string
  queryParams: Record<string, string>
  navigate: (path: string) => void
}

export function parseLocation(): RouteLocation {
  if (typeof window === 'undefined') {
    return { currentPath: '/', search: '', queryParams: {} }
  }

  const hash = window.location.hash
  let rawPath = ''
  let hashSearch = ''

  if (hash.startsWith('#/')) {
    const raw = hash.slice(1) // e.g. '/about' or '/?halo=true'
    const qIndex = raw.indexOf('?')
    if (qIndex !== -1) {
      rawPath = raw.slice(0, qIndex) || '/'
      hashSearch = raw.slice(qIndex)
    } else {
      rawPath = raw || '/'
    }
  } else {
    rawPath = window.location.pathname.replace(/\/$/, '') || '/'
  }

  // Combine query parameters from window.location.search and hash search
  const searchParams = new URLSearchParams(window.location.search)
  if (hashSearch) {
    const hashParams = new URLSearchParams(hashSearch)
    hashParams.forEach((val, key) => searchParams.set(key, val))
  }

  const queryParams: Record<string, string> = {}
  searchParams.forEach((val, key) => {
    queryParams[key] = val
  })

  const fullSearch = searchParams.toString() ? `?${searchParams.toString()}` : ''

  return {
    currentPath: rawPath === '' ? '/' : rawPath,
    search: fullSearch,
    queryParams,
  }
}

const RouterContext = createContext<RouterContextType>({
  currentPath: '/',
  search: '',
  queryParams: {},
  navigate: () => {},
})

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locationState, setLocationState] = useState<RouteLocation>(() => parseLocation())

  useEffect(() => {
    const handlePopState = () => {
      setLocationState(parseLocation())
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  const navigate = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer')
      return
    }

    // Use hash for GitHub Pages to ensure zero 404 reload issues
    window.location.hash = `#${path.startsWith('/') ? path : `/${path}`}`
    setLocationState(parseLocation())
    window.scrollTo(0, 0)
  }

  return (
    <RouterContext.Provider
      value={{
        currentPath: locationState.currentPath,
        search: locationState.search,
        queryParams: locationState.queryParams,
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  )
}

export const useRouter = () => useContext(RouterContext)
