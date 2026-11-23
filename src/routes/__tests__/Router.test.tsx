import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { parseLocation, RouterProvider, useRouter } from '../Router'

describe('Router Module', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('parseLocation Function', () => {
    it('returns root path and empty queryParams when hash and search are empty', () => {
      // Given: empty location
      window.location.hash = ''

      // When: parsing location
      const loc = parseLocation()

      // Then: root path is parsed
      expect(loc.currentPath).toBe('/')
      expect(loc.search).toBe('')
      expect(loc.queryParams).toEqual({})
    })

    it('extracts path and query parameters from hash route containing query string', () => {
      // Given: hash route with query parameters
      window.location.hash = '#/about?geo=trefoil&tuner=true'

      // When: parsing location
      const loc = parseLocation()

      // Then: path and params are extracted correctly
      expect(loc.currentPath).toBe('/about')
      expect(loc.queryParams.geo).toBe('trefoil')
      expect(loc.queryParams.tuner).toBe('true')
      expect(loc.search).toContain('geo=trefoil')
    })

    it('extracts root path when hash is just #/?halo=true', () => {
      // Given: hash with root path and query
      window.location.hash = '#/?halo=true'

      // When: parsing location
      const loc = parseLocation()

      // Then: path is /
      expect(loc.currentPath).toBe('/')
      expect(loc.queryParams.halo).toBe('true')
    })
  })

  describe('useRouter & RouterProvider Navigation', () => {
    it('provides current path from RouterProvider context', () => {
      // Given: hash set to #/more
      window.location.hash = '#/more'

      // When: mounting hook within RouterProvider
      const { result } = renderHook(() => useRouter(), {
        wrapper: RouterProvider,
      })

      // Then: currentPath is /more
      expect(result.current.currentPath).toBe('/more')
    })

    it('updates currentPath when navigate is called with internal route', () => {
      // Given: mounted router hook
      const { result } = renderHook(() => useRouter(), {
        wrapper: RouterProvider,
      })

      // When: navigating to /sonny
      act(() => {
        result.current.navigate('/sonny')
      })

      // Then: location updates to #/sonny
      expect(window.location.hash).toBe('#/sonny')
      expect(result.current.currentPath).toBe('/sonny')
    })

    it('opens external URL in new tab when navigate is called with https:// link', () => {
      // Given: window.open spy
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const { result } = renderHook(() => useRouter(), {
        wrapper: RouterProvider,
      })

      // When: navigating to external URL
      act(() => {
        result.current.navigate('https://dc-hardcore.com')
      })

      // Then: window.open is called with target _blank
      expect(openSpy).toHaveBeenCalledWith('https://dc-hardcore.com', '_blank', 'noopener,noreferrer')
    })

    it('responds to popstate and hashchange window events', () => {
      // Given: mounted router hook
      const { result } = renderHook(() => useRouter(), {
        wrapper: RouterProvider,
      })

      // When: hash changes via browser navigation
      act(() => {
        window.location.hash = '#/about'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })

      // Then: router context reflects updated location
      expect(result.current.currentPath).toBe('/about')
    })
  })
})
