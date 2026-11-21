import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  DebugDistanceProvider,
  useDebugDistance,
  DEBUG_DISTANCE_STORAGE_KEY,
  DEBUG_DISTANCE_METRIC_KEY,
  DEBUG_DISTANCE_COORDS_KEY,
} from '../DebugDistanceContext'

const TestConsumer: React.FC = () => {
  const {
    showDistance,
    setShowDistance,
    toggleDistance,
    distanceMetric,
    setDistanceMetric,
    toggleDistanceMetric,
    showCoordinates,
    setShowCoordinates,
    toggleCoordinates,
  } = useDebugDistance()
  return (
    <div>
      <span data-testid="distance-status">{showDistance ? 'ENABLED' : 'DISABLED'}</span>
      <span data-testid="metric-status">{distanceMetric}</span>
      <span data-testid="coords-status">{showCoordinates ? 'ENABLED' : 'DISABLED'}</span>
      <button data-testid="toggle-btn" onClick={toggleDistance}>
        Toggle
      </button>
      <button data-testid="enable-btn" onClick={() => setShowDistance(true)}>
        Enable
      </button>
      <button data-testid="disable-btn" onClick={() => setShowDistance(false)}>
        Disable
      </button>
      <button data-testid="set-depth-btn" onClick={() => setDistanceMetric('depth')}>
        Set Depth
      </button>
      <button data-testid="toggle-metric-btn" onClick={toggleDistanceMetric}>
        Toggle Metric
      </button>
      <button data-testid="toggle-coords-btn" onClick={toggleCoordinates}>
        Toggle Coords
      </button>
      <button data-testid="disable-coords-btn" onClick={() => setShowCoordinates(false)}>
        Disable Coords
      </button>
    </div>
  )
}

describe('DebugDistanceContext', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('provides false as default showDistance state', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('distance-status')).toHaveTextContent('DISABLED')
  })

  it('toggles distance state and persists to localStorage', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    act(() => {
      screen.getByTestId('toggle-btn').click()
    })

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_STORAGE_KEY)).toBe('true')

    act(() => {
      screen.getByTestId('toggle-btn').click()
    })

    expect(screen.getByTestId('distance-status')).toHaveTextContent('DISABLED')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_STORAGE_KEY)).toBe('false')
  })

  it('sets distance state explicitly via setShowDistance', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    act(() => {
      screen.getByTestId('enable-btn').click()
    })

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_STORAGE_KEY)).toBe('true')

    act(() => {
      screen.getByTestId('disable-btn').click()
    })

    expect(screen.getByTestId('distance-status')).toHaveTextContent('DISABLED')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_STORAGE_KEY)).toBe('false')
  })

  it('initializes from localStorage if stored as true', () => {
    window.localStorage.setItem(DEBUG_DISTANCE_STORAGE_KEY, 'true')

    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
  })

  it('initializes from ?dist=true URL parameter', () => {
    window.history.replaceState({}, '', '/?dist=true')

    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
  })

  it('initializes from ?debugDistance=1 URL parameter', () => {
    window.history.replaceState({}, '', '/?debugDistance=1')

    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
  })

  it('initializes from initialShow prop', () => {
    render(
      <DebugDistanceProvider initialShow={true}>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
  })

  it('synchronizes distance state on storage event', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: DEBUG_DISTANCE_STORAGE_KEY,
          newValue: 'true',
        })
      )
    })

    expect(screen.getByTestId('distance-status')).toHaveTextContent('ENABLED')
  })

  it('provides euclid as default distance metric and switches to depth', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('metric-status')).toHaveTextContent('euclid')

    act(() => {
      screen.getByTestId('set-depth-btn').click()
    })

    expect(screen.getByTestId('metric-status')).toHaveTextContent('depth')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_METRIC_KEY)).toBe('depth')

    act(() => {
      screen.getByTestId('toggle-metric-btn').click()
    })

    expect(screen.getByTestId('metric-status')).toHaveTextContent('euclid')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_METRIC_KEY)).toBe('euclid')
  })

  it('initializes metric from ?metric=depth URL parameter and localStorage', () => {
    window.history.replaceState({}, '', '/?metric=depth')

    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('metric-status')).toHaveTextContent('depth')
  })

  it('synchronizes distance metric on storage event', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: DEBUG_DISTANCE_METRIC_KEY,
          newValue: 'depth',
        })
      )
    })

    expect(screen.getByTestId('metric-status')).toHaveTextContent('depth')
  })

  it('provides true as default showCoordinates state and toggles properly', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('coords-status')).toHaveTextContent('ENABLED')

    act(() => {
      screen.getByTestId('toggle-coords-btn').click()
    })

    expect(screen.getByTestId('coords-status')).toHaveTextContent('DISABLED')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_COORDS_KEY)).toBe('false')

    act(() => {
      screen.getByTestId('toggle-coords-btn').click()
    })

    expect(screen.getByTestId('coords-status')).toHaveTextContent('ENABLED')
    expect(window.localStorage.getItem(DEBUG_DISTANCE_COORDS_KEY)).toBe('true')
  })

  it('initializes coordinates from ?coords=false URL parameter and localStorage', () => {
    window.history.replaceState({}, '', '/?coords=false')

    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    expect(screen.getByTestId('coords-status')).toHaveTextContent('DISABLED')
  })

  it('synchronizes coordinates on storage event', () => {
    render(
      <DebugDistanceProvider>
        <TestConsumer />
      </DebugDistanceProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: DEBUG_DISTANCE_COORDS_KEY,
          newValue: 'false',
        })
      )
    })

    expect(screen.getByTestId('coords-status')).toHaveTextContent('DISABLED')
  })
})
