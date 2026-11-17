import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../components/canvas/SceneContainer', () => ({
  SceneContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-scene-container">{children}</div>
  ),
}))

vi.mock('../components/canvas/geometries/GeometryDispatcher', () => ({
  GeometryDispatcher: () => <div data-testid="mock-geometry-dispatcher" />,
}))

describe('App Component', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('renders HomePage on root path', () => {
    render(<App />)
    expect(screen.getByTestId('welcome-trigger')).toBeInTheDocument()
  })

  it('renders AboutPage on #/about', () => {
    window.location.hash = '#/about'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('about')
  })

  it('renders MorePage on #/more', () => {
    window.location.hash = '#/more'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('more')
  })
})
