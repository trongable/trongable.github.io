import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AngelPage } from '../AngelPage'
import { RouterProvider, useRouter } from '@/routes/Router'
import { TunerProvider } from '@/features/tuner/TunerContext'
import {
  ANGEL_AVATAR_STORAGE_KEY,
  DEFAULT_ANGEL_CONFIG,
  encodeAngelConfig,
} from '@/features/angel/angelCatalog'

vi.mock('@/features/angel/AngelStudioCanvas', () => ({
  AngelStudioCanvas: ({
    config,
    focusPreset,
    isTurntableActive,
    canvasRef,
  }: {
    config: { hairId: string; topId: string; skinTone: string }
    focusPreset: string
    isTurntableActive: boolean
    canvasRef?: { current: HTMLCanvasElement | null }
  }) => {
    if (canvasRef && !canvasRef.current) {
      const el = document.createElement('canvas')
      el.toDataURL = vi.fn(() => 'data:image/png;base64,MOCKPNG')
      canvasRef.current = el
    }
    return (
      <div
        data-testid="angel-studio-canvas-mock"
        data-hair={config.hairId}
        data-top={config.topId}
        data-skin={config.skinTone}
        data-focus={focusPreset}
        data-spin={String(isTurntableActive)}
      />
    )
  },
}))

const LocationWatcher = () => {
  const { currentPath, search } = useRouter()
  return <div data-testid="location-watcher" data-path={currentPath} data-search={search} />
}

describe('AngelPage Component', () => {
  afterEach(() => {
    window.localStorage.clear()
    window.location.hash = ''
    vi.restoreAllMocks()
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

  it('allows switching wardrobe categories, focus, spin, randomize, reset, share, and save png', () => {
    window.location.hash = '#/angel'
    const writeTextMock = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

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

    fireEvent.click(screen.getByRole('button', { name: 'face' }))
    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-focus')).toBe('face')

    fireEvent.click(screen.getByRole('button', { name: /spin off/i }))
    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-spin')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'share' }))
    expect(writeTextMock).toHaveBeenCalled()
    expect(window.location.hash).toContain('#/angel?a=')

    fireEvent.click(screen.getByRole('button', { name: 'save png' }))
    expect(clickSpy).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'random' }))
    fireEvent.click(screen.getByRole('button', { name: 'reset' }))
    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-hair')).toBe('none')
    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-top')).toBe('none')
  })

  it('hydrates avatar state from URL query param ?a= or localStorage and renders Tuner when visible', () => {
    const encoded = encodeAngelConfig({
      ...DEFAULT_ANGEL_CONFIG,
      hairId: 'long-bob',
      topId: 'graphic-tee',
    })
    window.location.hash = `#/angel?a=${encoded}`

    const { unmount } = render(
      <RouterProvider>
        <TunerProvider>
          <AngelPage />
        </TunerProvider>
      </RouterProvider>
    )

    const canvas = screen.getByTestId('angel-studio-canvas-mock')
    expect(canvas.getAttribute('data-hair')).toBe('long-bob')
    expect(canvas.getAttribute('data-top')).toBe('graphic-tee')
    unmount()

    // Fallback to localStorage when ?a= is absent, with ?tuner=true
    window.localStorage.setItem(
      ANGEL_AVATAR_STORAGE_KEY,
      encodeAngelConfig({ ...DEFAULT_ANGEL_CONFIG, hairId: 'short-crop' })
    )
    window.location.hash = '#/angel?tuner=true'

    render(
      <RouterProvider>
        <TunerProvider>
          <AngelPage />
        </TunerProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('angel-studio-canvas-mock').getAttribute('data-hair')).toBe('short-crop')
    expect(screen.getByTestId('geometry-tuner')).toBeInTheDocument()
    fireEvent.click(screen.getByText('✕'))
  })
})
