import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { GalleryPage } from '../GalleryPage'
import { RouterProvider } from '@/routes/Router'
import { ThemeProvider } from '@/context/ThemeContext'
import { GALLERY_DATA, VIDEOS_DATA } from '@/features/gallery/data/galleryData'
import { clearFrameRegistry } from '@/testUtils/r3fTestUtils'

describe('GalleryPage Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
    window.location.hash = '#/gallery'
  })

  it('renders navbar, return home button, and 3D chamber', () => {
    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('gallery-page')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return home' })).toBeInTheDocument()
    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })

  it('provides accessible direct navigation buttons for all gallery items', () => {
    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    GALLERY_DATA.forEach((item) => {
      const name = item.type === 'video' ? `Play ${item.title}` : `View ${item.title}`
      const matches = screen.getAllByRole('button', { name })
      expect(matches.length).toBeGreaterThan(0)
      expect(screen.getByTestId(`gallery-nav-btn-${item.id}`)).toBeInTheDocument()
    })
  })

  it('activates video theater overlay when clicking a video button', () => {
    vi.useFakeTimers()

    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    const firstVideo = VIDEOS_DATA[0]
    const playBtn = screen.getByTestId(`gallery-nav-btn-${firstVideo.id}`)

    fireEvent.click(playBtn)

    // Advance 3D fly-to-center animation timer (340ms)
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByTitle(firstVideo.title)).toBeInTheDocument()

    // Dismiss theater view (triggers 180ms smooth exit fade)
    const returnBtn = screen.getByRole('button', { name: 'Return to chamber' })
    fireEvent.click(returnBtn)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.queryByTestId('video-theater-overlay')).not.toBeInTheDocument()

    // Advance flight-back to wall slot timer (320ms)
    act(() => {
      vi.advanceTimersByTime(350)
    })

    vi.useRealTimers()
  })

  it('activates photo focus view when clicking a photo item', () => {
    vi.useFakeTimers()

    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    const photoItem = GALLERY_DATA.find((item) => item.type === 'photo')!
    const viewBtn = screen.getByTestId(`gallery-nav-btn-${photoItem.id}`)

    fireEvent.click(viewBtn)

    // Advance 3D fly-to-center animation timer (340ms)
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByAltText(photoItem.title)).toBeInTheDocument()

    // Dismiss photo view
    const returnBtn = screen.getByRole('button', { name: 'Return to chamber' })
    fireEvent.click(returnBtn)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.queryByTestId('video-theater-overlay')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('navigates back home when clicking return home button', () => {
    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    const homeBtn = screen.getByRole('button', { name: 'Return home' })
    fireEvent.click(homeBtn)

    expect(window.location.hash).toBe('#/?expanded=true')
  })

  it('automatically opens video when query parameter ?v=<id> is present', () => {
    window.location.hash = `#/gallery?v=${VIDEOS_DATA[1].id}`

    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByTitle(VIDEOS_DATA[1].title)).toBeInTheDocument()
  })

  it('automatically opens photo when query parameter ?item=<id> is present', () => {
    const photoItem = GALLERY_DATA.find((item) => item.type === 'photo')!
    window.location.hash = `#/gallery?item=${photoItem.id}`

    render(
      <RouterProvider>
        <ThemeProvider>
          <GalleryPage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByAltText(photoItem.title)).toBeInTheDocument()
  })
})
