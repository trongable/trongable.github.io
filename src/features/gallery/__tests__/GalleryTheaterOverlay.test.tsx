import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GalleryTheaterOverlay as VideoTheaterOverlay } from '@/features/gallery/theater/GalleryTheaterOverlay'
import { GALLERY_DATA, VIDEOS_DATA } from '@/features/gallery/data/galleryData'
import { isImageDecoded, clearImagePreloadCache } from '@/utils/imagePreload'

describe('VideoTheaterOverlay Component', () => {
  const mockVideo = VIDEOS_DATA[0] // qopBymi9FYY

  beforeEach(() => {
    clearImagePreloadCache()
  })

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
    expect(screen.getByRole('button', { name: 'Return to chamber' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close media player' })).not.toBeInTheDocument()

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
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('loading', 'eager')

    // Title is centered below the media
    const titleWrapper = screen.getByTestId('theater-title-wrapper')
    expect(titleWrapper).toHaveClass('text-center', 'sm:col-start-2', 'sm:justify-self-center')

    // Photo frame locks aspect-matched bounds with crisp opaque thumbnail placeholder until HQ load finishes
    const photoFrame = screen.getByTestId('theater-photo-frame')
    expect(photoFrame.style.width).toBe(`min(90vw, ${(80 * photoItem.aspectRatio).toFixed(2)}vh)`)
    expect(photoFrame.style.height).toBe(`min(80vh, ${(90 / photoItem.aspectRatio).toFixed(2)}vw)`)
    const placeholder = screen.getByTestId('theater-thumbnail-placeholder')
    expect(placeholder).toHaveClass('opacity-100')
    expect(placeholder.className).not.toContain('blur-')
    expect(img).toHaveClass('opacity-0')

    fireEvent.load(img)
    expect(img).toHaveClass('opacity-100')
  })

  it('pre-decodes adjacent items in the background when an item is active', async () => {
    const photoIdx = GALLERY_DATA.findIndex((i) => i.type === 'photo')
    const activeItem = GALLERY_DATA[photoIdx]
    const prevItem = photoIdx > 0 ? GALLERY_DATA[photoIdx - 1] : GALLERY_DATA[GALLERY_DATA.length - 1]
    const nextItem = photoIdx < GALLERY_DATA.length - 1 ? GALLERY_DATA[photoIdx + 1] : GALLERY_DATA[0]

    render(
      <VideoTheaterOverlay
        activeItem={activeItem}
        items={GALLERY_DATA}
        onClose={vi.fn()}
        onSelectItem={vi.fn()}
      />
    )

    await vi.waitFor(() => {
      if (prevItem.type === 'photo') {
        const prevUrl = prevItem.hqImageUrl || prevItem.imageUrl
        expect(isImageDecoded(prevUrl)).toBe(true)
      }
      if (nextItem.type === 'photo') {
        const nextUrl = nextItem.hqImageUrl || nextItem.imageUrl
        expect(isImageDecoded(nextUrl)).toBe(true)
      }
    })
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
