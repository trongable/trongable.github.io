import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UiCatalogPage } from '../UiCatalogPage'
import { RouterProvider } from '@/routes/Router'
import { ThemeProvider } from '@/context/ThemeContext'
import { AngelContainerProvider } from '@/features/angel/AngelContainerContext'

vi.mock('@/features/scene/SceneContainer', () => ({
  SceneContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-catalog-scene">{children}</div>
  ),
}))

vi.mock('@/features/topologies/GeometryDispatcher', () => ({
  GeometryDispatcher: ({ mode }: { mode: string }) => (
    <div data-testid="mock-catalog-dispatcher" data-mode={mode} />
  ),
}))

describe('UiCatalogPage', () => {
  beforeEach(() => {
    window.location.hash = '#/ui-catalog'
  })

  const renderPage = () =>
    render(
      <RouterProvider>
        <ThemeProvider>
          <AngelContainerProvider>
            <UiCatalogPage />
          </AngelContainerProvider>
        </ThemeProvider>
      </RouterProvider>
    )

  it('renders all 5 component catalog sections and return home button', () => {
    renderPage()

    expect(screen.getByTestId('ui-catalog-page')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return home' })).toBeInTheDocument()
    expect(screen.getByText('1. Theme Tokens & Palettes')).toBeInTheDocument()
    expect(screen.getByText('2. Tuner UI Primitives')).toBeInTheDocument()
    expect(screen.getByText('3. Navigation & Terminal')).toBeInTheDocument()
    expect(screen.getByText('4. Effects & Text Utilities')).toBeInTheDocument()
    expect(screen.getByText('5. 3D Scene & Topology Components')).toBeInTheDocument()
  })

  it('switches topology mode and Angel container in the 3D preview section', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'trefoil' }))
    expect(screen.getByTestId('mock-catalog-dispatcher')).toHaveAttribute('data-mode', 'trefoil')

    fireEvent.click(screen.getByRole('button', { name: 'Return home' }))
    expect(window.location.hash).toBe('#/?expanded=true')
  })
})
