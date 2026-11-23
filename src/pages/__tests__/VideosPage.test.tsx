import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { VideosPage } from '../VideosPage'
import { RouterProvider } from '@/routes/Router'
import { ThemeProvider } from '@/context/ThemeContext'
import { VIDEOS_DATA } from '@/components/videos/videoData'
import { clearFrameRegistry } from '@/testUtils/r3fTestUtils'

describe('VideosPage Component', () => {
  beforeEach(() => {
    clearFrameRegistry()
    window.location.hash = '#/videos'
  })

  it('renders navbar, return home button, title, and 3D chamber', () => {
    render(
      <RouterProvider>
        <ThemeProvider>
          <VideosPage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('videos-page')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return home' })).toBeInTheDocument()
    expect(screen.getByTestId('cerebro-chamber-container')).toBeInTheDocument()
  })

  it('provides accessible direct navigation buttons for all 7 videos without author names', () => {
    render(
      <RouterProvider>
        <ThemeProvider>
          <VideosPage />
        </ThemeProvider>
      </RouterProvider>
    )

    VIDEOS_DATA.forEach((video) => {
      expect(
        screen.getByRole('button', {
          name: `Play ${video.title}`,
        })
      ).toBeInTheDocument()
    })
  })

  it('activates theater overlay immediately when clicking a video button', () => {
    vi.useFakeTimers()

    render(
      <RouterProvider>
        <ThemeProvider>
          <VideosPage />
        </ThemeProvider>
      </RouterProvider>
    )

    const firstVideo = VIDEOS_DATA[0]
    const playBtn = screen.getByRole('button', {
      name: `Play ${firstVideo.title}`,
    })

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

  it('navigates back home when clicking return home button', () => {
    render(
      <RouterProvider>
        <ThemeProvider>
          <VideosPage />
        </ThemeProvider>
      </RouterProvider>
    )

    const homeBtn = screen.getByRole('button', { name: 'Return home' })
    fireEvent.click(homeBtn)

    expect(window.location.hash).toBe('#/?expanded=true')
  })

  it('automatically opens video when query parameter ?v=<id> is present', () => {
    window.location.hash = `#/videos?v=${VIDEOS_DATA[1].id}`

    render(
      <RouterProvider>
        <ThemeProvider>
          <VideosPage />
        </ThemeProvider>
      </RouterProvider>
    )

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByTitle(VIDEOS_DATA[1].title)).toBeInTheDocument()
  })
})
