import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AngelPage } from '../AngelPage'
import { RouterProvider, useRouter } from '@/routes/Router'
import { encodeAngelConfig, DEFAULT_ANGEL_CONFIG } from '@/components/angel/angelCatalog'

vi.mock('@/components/angel/AngelStudioCanvas', () => ({
  AngelStudioCanvas: ({ config }: { config: { hairId: string; topId: string; skinTone: string } }) => (
    <div
      data-testid="angel-studio-canvas-mock"
      data-hair={config.hairId}
      data-top={config.topId}
      data-skin={config.skinTone}
    />
  ),
}))

const LocationWatcher = () => {
  const { currentPath, search } = useRouter()
  return <div data-testid="location-watcher" data-path={currentPath} data-search={search} />
}

describe('AngelPage Component', () => {
  afterEach(() => {
    window.localStorage.clear()
    window.location.hash = ''
  })

  it('renders Angel Builder heading with zero sonny phrasing and navigates home', () => {
    window.location.hash = '#/angel'

    const { container } = render(
      <RouterProvider>
        <LocationWatcher />
        <AngelPage />
      </RouterProvider>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('angel builder')
    expect(container.textContent?.toLowerCase()).not.toContain('sonny')

    const canvas = screen.getByTestId('angel-studio-canvas-mock')
    expect(canvas.getAttribute('data-hair')).toBe('none')
    expect(canvas.getAttribute('data-top')).toBe('none')

    const backBtn = screen.getByRole('button', { name: /return home/i })
    fireEvent.click(backBtn)

    const watcher = screen.getByTestId('location-watcher')
    expect(watcher.getAttribute('data-search')).toContain('expanded=true')
  })

  it('allows switching wardrobe categories and selecting items', () => {
    window.location.hash = '#/angel'

    render(
      <RouterProvider>
        <AngelPage />
      </RouterProvider>
    )

    fireEvent.click(screen.getByTestId('tab-hair'))
    fireEvent.click(screen.getByTestId('item-hair-short-crop'))
    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-hair')).toBe('short-crop')

    fireEvent.click(screen.getByTestId('tab-tops'))
    fireEvent.click(screen.getByTestId('item-tops-oversized-hoodie'))
    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-top')).toBe('oversized-hoodie')
  })

  it('hydrates avatar state from URL query param ?a=', () => {
    const encoded = encodeAngelConfig({
      ...DEFAULT_ANGEL_CONFIG,
      hairId: 'long-bob',
      topId: 'graphic-tee',
    })
    window.location.hash = `#/angel?a=${encoded}`

    render(
      <RouterProvider>
        <AngelPage />
      </RouterProvider>
    )

    const canvas = screen.getByTestId('angel-studio-canvas-mock')
    expect(canvas.getAttribute('data-hair')).toBe('long-bob')
    expect(canvas.getAttribute('data-top')).toBe('graphic-tee')
  })
})
