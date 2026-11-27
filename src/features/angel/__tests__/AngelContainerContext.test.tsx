import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import {
  AngelContainerProvider,
  useAngelContainer,
  ANGEL_CONTAINER_STYLES,
  DEFAULT_ANGEL_CONTAINER,
  ANGEL_CONTAINER_STORAGE_KEY,
  isValidAngelContainer,
  AngelContainerStyle,
} from '@/features/angel/AngelContainerContext'

const TestConsumer: React.FC = () => {
  const { containerStyle, setContainerStyle, containerMeta } = useAngelContainer()
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
        onClick={() => setContainerStyle('invalid' as AngelContainerStyle)}
      >
        Invalid
      </button>
    </div>
  )
}

describe('AngelContainerContext', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('exports 6 distinct container styles with valid metadata', () => {
    expect(ANGEL_CONTAINER_STYLES).toHaveLength(6)
    const ids = ANGEL_CONTAINER_STYLES.map((s) => s.id)
    expect(ids).toEqual(['diorama', 'pedestal', 'capsule', 'wirebox', 'crystal', 'none'])
  })

  it('validates container styles properly', () => {
    expect(isValidAngelContainer('diorama')).toBe(true)
    expect(isValidAngelContainer('pedestal')).toBe(true)
    expect(isValidAngelContainer('capsule')).toBe(true)
    expect(isValidAngelContainer('wirebox')).toBe(true)
    expect(isValidAngelContainer('crystal')).toBe(true)
    expect(isValidAngelContainer('none')).toBe(true)
    expect(isValidAngelContainer('box')).toBe(false)
    expect(isValidAngelContainer(123)).toBe(false)
    expect(isValidAngelContainer(null)).toBe(false)
  })

  it('provides default container style (capsule)', () => {
    render(
      <AngelContainerProvider>
        <TestConsumer />
      </AngelContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent(DEFAULT_ANGEL_CONTAINER)
    expect(screen.getByTestId('container-name')).toHaveTextContent('Stasis Cryo-Pod')
  })

  it('switches container style and persists to localStorage', () => {
    render(
      <AngelContainerProvider>
        <TestConsumer />
      </AngelContainerProvider>
    )

    act(() => {
      screen.getByTestId('set-crystal').click()
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('crystal')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Origami Crystal Cage')
    expect(window.localStorage.getItem(ANGEL_CONTAINER_STORAGE_KEY)).toBe('crystal')

    act(() => {
      screen.getByTestId('set-capsule').click()
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('capsule')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Stasis Cryo-Pod')
    expect(window.localStorage.getItem(ANGEL_CONTAINER_STORAGE_KEY)).toBe('capsule')
  })

  it('ignores invalid container style updates', () => {
    render(
      <AngelContainerProvider>
        <TestConsumer />
      </AngelContainerProvider>
    )

    act(() => {
      screen.getByTestId('set-invalid').click()
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('capsule')
  })

  it('initializes from localStorage if valid stored value exists', () => {
    window.localStorage.setItem(ANGEL_CONTAINER_STORAGE_KEY, 'wirebox')

    render(
      <AngelContainerProvider>
        <TestConsumer />
      </AngelContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent('wirebox')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Neon Wirebox Vitrine')
  })

  it('initializes from URL query param if present', () => {
    window.history.replaceState({}, '', '/?container=pedestal')

    render(
      <AngelContainerProvider>
        <TestConsumer />
      </AngelContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent('pedestal')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Hologram Pedestal')
  })

  it('initializes from initialStyle prop', () => {
    render(
      <AngelContainerProvider initialStyle="crystal">
        <TestConsumer />
      </AngelContainerProvider>
    )

    expect(screen.getByTestId('container-style')).toHaveTextContent('crystal')
  })

  it('synchronizes container state when storage event occurs', () => {
    render(
      <AngelContainerProvider>
        <TestConsumer />
      </AngelContainerProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: ANGEL_CONTAINER_STORAGE_KEY,
          newValue: 'none',
        })
      )
    })

    expect(screen.getByTestId('container-style')).toHaveTextContent('none')
    expect(screen.getByTestId('container-name')).toHaveTextContent('Floating Sprite')
  })
})
