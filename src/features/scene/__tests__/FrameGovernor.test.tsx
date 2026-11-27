import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { FrameGovernor } from '../FrameGovernor'

const mockInvalidate = vi.fn()

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    invalidate: mockInvalidate,
  }),
}))

describe('FrameGovernor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not schedule renders when isSleeping is true', () => {
    render(<FrameGovernor targetFps={60} isSleeping={true} />)
    vi.advanceTimersByTime(100)
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  it('does not schedule renders when targetFps is null (uncapped mode)', () => {
    render(<FrameGovernor targetFps={null} isSleeping={false} />)
    vi.advanceTimersByTime(100)
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  it('does not schedule renders when isPaused is true', () => {
    render(<FrameGovernor targetFps={60} isSleeping={false} isPaused={true} />)
    vi.advanceTimersByTime(100)
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  it('schedules renders when active at 60 FPS', () => {
    render(<FrameGovernor targetFps={60} isSleeping={false} />)

    // Advance time by ~34ms (approx 2 frames at 60 FPS)
    vi.advanceTimersByTime(35)
    expect(mockInvalidate).toHaveBeenCalled()
  })
})
