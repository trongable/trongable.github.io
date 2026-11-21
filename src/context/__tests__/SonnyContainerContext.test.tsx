import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  SonnyContainerProvider,
  useSonnyContainer,
  SONNY_CONTAINER_STYLES,
  DEFAULT_SONNY_CONTAINER,
  SONNY_CONTAINER_STORAGE_KEY,
  isValidSonnyContainer,
  SonnyContainerStyle,
} from '../SonnyContainerContext'

const TestConsumer: React.FC = () => {
  const { containerStyle, setContainerStyle, containerMeta } = useSonnyContainer()
  return (
    <div>
      <span data-testid="container-style">{containerStyle}</span>
      <span data-testid="container-name">{containerMeta.name}</span>
      <button
        data-testid="set-capsule"
        onClick={() => setContainerStyle('capsule')}
      >
        Capsule
      </button>
      <button
        data-testid="set-crystal"
        onClick={() => setContainerStyle('crystal')}
      >
        Crystal
      </button>
      <button
        data-testid="set-invalid"
        onClick={() => setContainerStyle('invalid' as SonnyContainerStyle)}
      >
        Invalid
      </button>
    </div>
  )
}

describe('SonnyContainerContext', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('exports 6 distinct container styles with valid metadata', () => {
    expect(SONNY_CONTAINER_STYLES).toHaveLength(6)
    const ids = SONNY_CONTAINER_STYLES.map((s) => s.id)
    expect(ids).toEqual(['diorama', 'pedestal', 'capsule', 'wirebox', 'crystal', 'none'])
  })

  it('validates container styles properly', () => {
    expect(isValidSonnyContainer('diorama')).toBe(true)
    expect(isValidSonnyContainer('pedestal')).toBe(true)
    expect(isValidSonnyContainer('capsule')).toBe(true)
    expect(isValidSonnyContainer('wirebox')).toBe(true)
    expect(isValidSonnyContainer('crystal')).toBe(true)
    expect(isValidSonnyContainer('none')).toBe(true)
    expect(isValidSonnyContainer('box')).toBe(false)
    expect(isValidSonnyContainer(123)).toBe(false)
    expect(isValidSonnyContainer(null)).toBe(false)
  })

  it('provides default container style (capsule)', () => {
    render(
      <SonnyContainerProvider>
        <TestConsumer />
      </SonnyContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent(DEFAULT_SONNY_CONTAINER)
    expect(screen.getByTestId('container-name')).toHaveTextContent('Stasis Cryo-Pod')
  })

  it('switches container style and persists to localStorage', () => {
    render(
      <SonnyContainerProvider>
        <TestConsumer />
      </SonnyContainerProvider>
    )

    act(() => {
      screen.getByTestId('set-crystal').click()
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('crystal')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Origami Crystal Cage')
    expect(window.localStorage.getItem(SONNY_CONTAINER_STORAGE_KEY)).toBe('crystal')

    act(() => {
      screen.getByTestId('set-capsule').click()
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('capsule')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Stasis Cryo-Pod')
    expect(window.localStorage.getItem(SONNY_CONTAINER_STORAGE_KEY)).toBe('capsule')
  })

  it('ignores invalid container style updates', () => {
    render(
      <SonnyContainerProvider>
        <TestConsumer />
      </SonnyContainerProvider>
    )

    act(() => {
      screen.getByTestId('set-invalid').click()
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('capsule')
  })

  it('initializes from localStorage if valid stored value exists', () => {
    window.localStorage.setItem(SONNY_CONTAINER_STORAGE_KEY, 'wirebox')

    render(
      <SonnyContainerProvider>
        <TestConsumer />
      </SonnyContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent('wirebox')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Neon Wirebox Vitrine')
  })

  it('initializes from URL query param if present', () => {
    window.history.replaceState({}, '', '/?container=pedestal')

    render(
      <SonnyContainerProvider>
        <TestConsumer />
      </SonnyContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent('pedestal')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Hologram Pedestal')
  })

  it('initializes from initialStyle prop', () => {
    render(
      <SonnyContainerProvider initialStyle="crystal">
        <TestConsumer />
      </SonnyContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent('crystal')
  })

  it('synchronizes container state when storage event occurs', () => {
    render(
      <SonnyContainerProvider>
        <TestConsumer />
      </SonnyContainerProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SONNY_CONTAINER_STORAGE_KEY,
          newValue: 'none',
        })
      )
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('none')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Floating Sprite')
  })
})
