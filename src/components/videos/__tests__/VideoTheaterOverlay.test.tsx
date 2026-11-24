import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoTheaterOverlay } from '../VideoTheaterOverlay'
import { GALLERY_DATA, VIDEOS_DATA } from '../videoData'

describe('VideoTheaterOverlay Component', () => {
  const mockVideo = VIDEOS_DATA[0] // qopBymi9FYY

  it('renders null when activeVideo is null', () => {
    const { container } = render(
      <VideoTheaterOverlay
        activeVideo={null}
        onClose={vi.fn()}
        onSelectVideo={vi.fn()}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders iframe and video title when activeVideo is provided', () => {
    render(
      <VideoTheaterOverlay
        activeVideo={mockVideo}
        onClose={vi.fn()}
        onSelectVideo={vi.fn()}
      />
    )

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByText(mockVideo.title.toLowerCase())).toBeInTheDocument()

    // Verifies author name and cerebro references are not present in theater player
    expect(screen.queryByText(/cerebro/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ARCHIVE ENTRY:/i)).not.toBeInTheDocument()

    const iframe = screen.getByTitle(mockVideo.title)
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute(
      'src',
      `https://www.youtube-nocookie.com/embed/${mockVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`
    )
  })

  it('renders photo image and title when activeItem is a photo', () => {
    const photoItem = GALLERY_DATA.find((i) => i.type === 'photo')!

    render(
      <VideoTheaterOverlay
        activeItem={photoItem}
        onClose={vi.fn()}
        onSelectItem={vi.fn()}
      />
    )

    expect(screen.getByTestId('video-theater-overlay')).toBeInTheDocument()
    expect(screen.getByText(photoItem.title.toLowerCase())).toBeInTheDocument()

    const img = screen.getByAltText(photoItem.title)
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', photoItem.imageUrl)
  })

  it('calls onClose when clicking return button', () => {
    vi.useFakeTimers()
    const handleClose = vi.fn()

    render(
      <VideoTheaterOverlay
        activeVideo={mockVideo}
        onClose={handleClose}
        onSelectVideo={vi.fn()}
      />
    )

    const returnBtn = screen.getByRole('button', { name: 'Return to chamber' })
    fireEvent.click(returnBtn)

    // Advances 180ms smooth dissolve timer before onClose is dispatched
    vi.advanceTimersByTime(200)

    expect(handleClose).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('calls onClose when pressing Escape key', () => {
    vi.useFakeTimers()
    const handleClose = vi.fn()

    render(
      <VideoTheaterOverlay
        activeVideo={mockVideo}
        onClose={handleClose}
        onSelectVideo={vi.fn()}
      />
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    // Advances 180ms smooth dissolve timer before onClose is dispatched
    vi.advanceTimersByTime(200)

    expect(handleClose).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('cycles to previous and next items when clicking prev / next controls', () => {
    const handleSelectVideo = vi.fn()
    const activeItem = mockVideo // qopBymi9FYY at index 2
    const activeIdx = GALLERY_DATA.findIndex((i) => i.id === activeItem.id)
    const prevItem = GALLERY_DATA[activeIdx - 1]
    const nextItem = GALLERY_DATA[activeIdx + 1]

    render(
      <VideoTheaterOverlay
        activeVideo={activeItem}
        onClose={vi.fn()}
        onSelectVideo={handleSelectVideo}
      />
    )

    const prevBtn = screen.getByRole('button', { name: 'Previous video' })
    fireEvent.click(prevBtn)
    expect(handleSelectVideo).toHaveBeenCalledWith(prevItem)

    const nextBtn = screen.getByRole('button', { name: 'Next video' })
    fireEvent.click(nextBtn)
    expect(handleSelectVideo).toHaveBeenCalledWith(nextItem)
  })

  it('cycles to previous and next items using arrow keys', () => {
    const handleSelectVideo = vi.fn()
    const activeItem = mockVideo
    const activeIdx = GALLERY_DATA.findIndex((i) => i.id === activeItem.id)
    const prevItem = GALLERY_DATA[activeIdx - 1]
    const nextItem = GALLERY_DATA[activeIdx + 1]

    render(
      <VideoTheaterOverlay
        activeVideo={activeItem}
        onClose={vi.fn()}
        onSelectVideo={handleSelectVideo}
      />
    )

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(handleSelectVideo).toHaveBeenCalledWith(prevItem)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(handleSelectVideo).toHaveBeenCalledWith(nextItem)
  })
})
