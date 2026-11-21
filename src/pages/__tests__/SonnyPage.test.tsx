import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SonnyPage } from '../SonnyPage'
import { RouterProvider, useRouter } from '@/routes/Router'

const LocationWatcher = () => {
  const { currentPath, search } = useRouter()
  return <div data-testid="location-watcher" data-path={currentPath} data-search={search} />
}

describe('SonnyPage Component', () => {
  it('renders heading and navigates back home with halo query param', () => {
    window.location.hash = '#/sonny'

    render(
      <RouterProvider>
        <LocationWatcher />
        <SonnyPage />
      </RouterProvider>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('sonny')
    const backBtn = screen.getByRole('button', { name: /return home/i })
    expect(backBtn).toBeInTheDocument()

    fireEvent.click(backBtn)

    const watcher = screen.getByTestId('location-watcher')
    expect(watcher.getAttribute('data-search')).toContain('halo=true')
  })
})
