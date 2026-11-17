import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { App } from '../../App'

// Mock 3D Canvas elements
vi.mock('../../components/canvas/SceneContainer', () => ({
  SceneContainer: () => <div data-testid="mock-scene-container" />,
}))

describe('App Route Navigation', () => {
  it('renders home page by default without a top header navbar', () => {
    window.location.hash = ''
    render(<App />)
    expect(screen.getByTestId('welcome-trigger')).toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })

  it('renders empty about page with return navigation', () => {
    render(<App />)
    act(() => {
      window.location.hash = '#/about'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 1, name: 'about' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return home' })).toBeInTheDocument()
  })

  it('renders empty more page when navigating to /more', () => {
    render(<App />)
    act(() => {
      window.location.hash = '#/more'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 1, name: 'more' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return home' })).toBeInTheDocument()
  })

  it('navigates back to /?halo=true with expanded halo when clicking Return home', () => {
    render(<App />)
    act(() => {
      window.location.hash = '#/about'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    const returnButton = screen.getByRole('button', { name: 'Return home' })
    fireEvent.click(returnButton)
    expect(window.location.hash).toBe('#/?halo=true')
  })
})
