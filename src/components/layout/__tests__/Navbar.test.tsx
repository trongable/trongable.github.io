import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navbar } from '../Navbar'
import { RouterProvider, useRouter } from '@/routes/Router'

const TestWrapper: React.FC = () => {
  const { currentPath } = useRouter()
  return (
    <>
      <Navbar />
      <div data-testid="current-path">{currentPath}</div>
    </>
  )
}

describe('Navbar Component', () => {
  it('renders all 3 navigation targets', () => {
    render(
      <RouterProvider>
        <TestWrapper />
      </RouterProvider>
    )

    expect(screen.getByRole('button', { name: 'about' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'dchc' })).toBeInTheDocument()
  })

  it('configures the external dchc link securely', () => {
    render(
      <RouterProvider>
        <TestWrapper />
      </RouterProvider>
    )

    const dchcLink = screen.getByRole('link', { name: 'dchc' })
    expect(dchcLink).toHaveAttribute('href', 'https://dc-hardcore.com')
    expect(dchcLink).toHaveAttribute('target', '_blank')
    expect(dchcLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('updates path when an internal link is clicked', () => {
    render(
      <RouterProvider>
        <TestWrapper />
      </RouterProvider>
    )

    const aboutButton = screen.getByRole('button', { name: 'about' })
    fireEvent.click(aboutButton)
    expect(screen.getByTestId('current-path')).toHaveTextContent('/about')

    const moreButton = screen.getByRole('button', { name: 'more' })
    fireEvent.click(moreButton)
    expect(screen.getByTestId('current-path')).toHaveTextContent('/more')
  })
})
